/**
 * Main application store — task engine (CRUD, sync, pulse, push).
 * Auth → stores/auth.js, Settings → stores/settings.js, UI → stores/ui.js.
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import { initAuth, logoutAuth, googleAuthUrl, vkAuthUrl } from './auth.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';
import {
    fetchAll, fetchStats, sync, mergeCollection,
    addTask, deleteTask, updateTask, completeTask, archiveTask, restoreTask, returnNow,
    toggleNotifications, subscribeToPush, unsubscribeFromPush,
    startPulse, stopPulse, recalculateAll, checkReminders,
    calculateNextOccurrence, isCategoryPostponedFn, isEffectivelyPostponedFn, isHiddenFn,
} from './tasks.js';

export const useBalanceStore = defineStore('balance', {
    state: () => ({
        token: localStorage.getItem('auth_token') || null,
        user: null,

        tasks: [],
        categories: [],
        subcatCoeffs: {},
        notepadText: '',
        lastSync: localStorage.getItem('last_sync') || null,
        stats: null,
        bubbleZoom: 1,
        notificationsEnabled: localStorage.getItem('notifications_enabled') === 'true',
        filterCat: 'all',
        searchQuery: '',
        loading: false,
        lastPulse: new Date().toDateString(),
        pulseTimer: null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        googleAuthUrl: () => googleAuthUrl(),
        vkAuthUrl: () => vkAuthUrl(),

        // ── Proxy to settings store ──
        theme() { return useSettingsStore().theme; },
        locale() { return useSettingsStore().locale; },
        pulseInterval() { return useSettingsStore().pulseInterval; },

        // ── Proxy to ui store ──
        visualStyle() { return useUiStore().visualStyle; },
        treemapScale() { return useUiStore().treemapScale; },
        treemapMode() { return useUiStore().treemapMode; },

        allSubcats: (state) => Object.keys(state.subcatCoeffs),
        allTasksOrdered: (state) => {
            if (!Array.isArray(state.tasks)) return [];
            return [...state.tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        },

        bubbleTasks: (state) => {
            const active = state.allTasksOrdered.filter(t => {
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > new Date()) return false;
                return true;
            });
            if (state.filterCat === 'all') return active;
            if (['archive', 'hidden'].includes(state.filterCat)) return [];
            return active.filter(t => t.category_slug === state.filterCat);
        },

        focusTasks() { return this.bubbleTasks.filter(t => !t.ha && !this.isEffectivelyPostponed(t)); },
        plansTasks() { return this.bubbleTasks.filter(t => this.isEffectivelyPostponed(t)); },
        routineTasks() { return this.bubbleTasks.filter(t => t.ha && !this.isEffectivelyPostponed(t)); },

        filteredTasks: (state) => {
            const now = new Date();
            let tasks = state.allTasksOrdered;
            if (state.filterCat === 'hidden') {
                return tasks.filter(t => t.hidden_until && new Date(t.hidden_until) > now && !t.completed)
                    .sort((a, b) => new Date(a.hidden_until) - new Date(b.hidden_until));
            }
            if (state.filterCat === 'archive') {
                return tasks.filter(t => t.completed)
                    .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
            }
            tasks = tasks.filter(t => !t.completed && (!t.hidden_until || new Date(t.hidden_until) <= now));
            if (state.filterCat !== 'all') tasks = tasks.filter(t => t.category_slug === state.filterCat);
            if (state.searchQuery) {
                const q = state.searchQuery.toLowerCase();
                tasks = tasks.filter(t =>
                    (t.title && t.title.toLowerCase().includes(q)) ||
                    (t.notes && t.notes.toLowerCase().includes(q)));
            }
            return tasks;
        },

        counts: (state) => {
            const now = new Date();
            const res = { all: 0, hidden: 0, archive: 0, byCat: {} };
            if (!Array.isArray(state.tasks)) return res;
            state.tasks.forEach(t => {
                if (t.completed) res.archive++;
                else if (t.hidden_until && new Date(t.hidden_until) > now) res.hidden++;
                else {
                    res.all++;
                    if (t.category_slug) res.byCat[t.category_slug] = (res.byCat[t.category_slug] || 0) + 1;
                }
            });
            return res;
        },
    },

    actions: {
        // ── Auth lifecycle (delegates to auth module) ──

        async init() { await initAuth(this); },
        async logout() { await logoutAuth(this); },

        // ── Data & Sync ──

        async fetchAll() { await fetchAll(this); },
        async fetchStats() { await fetchStats(this); },
        async sync(forceFull = false) { await sync(this, forceFull); },
        mergeCollection(key, data, isFull) { mergeCollection(this, key, data, isFull); },

        // ── Task CRUD ──

        async addTask(taskData) { await addTask(this, taskData); },
        async deleteTask(id) { await deleteTask(this, id); },
        async updateTask(id, payload) { await updateTask(this, id, payload); },
        async completeTask(id) { await completeTask(this, id); },
        async archiveTask(id) { await archiveTask(this, id); },
        async restoreTask(id) { await restoreTask(this, id); },
        async returnNow(id) { await returnNow(this, id); },

        // ── Settings (proxy to settings store) ──

        async setTheme(t) { await useSettingsStore().setTheme(t); },
        async setLocale(l) { await useSettingsStore().setLocale(l); },
        async setPulseInterval(m) { await useSettingsStore().setPulseInterval(m); this.startPulse(); },
        setVisualStyle(s) { useUiStore().setVisualStyle(s); },
        setTreemapScale(s) { useUiStore().setTreemapScale(s); },
        setTreemapMode(m) { useUiStore().setTreemapMode(m); },

        // ── Push ──

        async toggleNotifications() { await toggleNotifications(this); },
        async subscribeToPush() { await subscribeToPush(this); },
        async unsubscribeFromPush() { await unsubscribeFromPush(this); },

        // ── Pulse ──

        startPulse() { startPulse(this); },
        stopPulse() { stopPulse(this); },
        recalculateAll() { recalculateAll(this); },
        checkReminders() { checkReminders(this); },

        // ── Theme ──

        applyTheme() { useSettingsStore().applyTheme(); },

        // ── Priority ──

        calculateNextOccurrence(t, payload = {}) { return calculateNextOccurrence(t, payload); },
        isCategoryPostponed(slug) { return isCategoryPostponedFn(this, slug); },
        isEffectivelyPostponed(t) { return isEffectivelyPostponedFn(this, t); },
        isHidden(t) { return isHiddenFn(t); },
    },
});
