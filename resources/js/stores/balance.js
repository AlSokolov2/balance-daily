/**
 * Compatibility store — composes auth, settings, ui, tasks stores.
 * Holds only filterCat / searchQuery / bubbleZoom (mutated directly by components).
 * Everything else is proxied to domain Pinia stores.
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import { useAuthStore } from './auth.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';
import { useTasksStore } from './tasks.js';

export const useBalanceStore = defineStore('balance', {
    state: () => ({
        // ── UI state mutated directly by components (no setter actions yet) ──
        filterCat: 'all',
        searchQuery: '',
        bubbleZoom: 1,
    }),

    getters: {
        // ── Proxy to auth store ──
        token() { return useAuthStore().token; },
        user() { return useAuthStore().user; },
        isAuthenticated() { return useAuthStore().isAuthenticated; },
        googleAuthUrl() { return useAuthStore().googleAuthUrl; },
        vkAuthUrl() { return useAuthStore().vkAuthUrl; },

        // ── Proxy to settings store ──
        theme() { return useSettingsStore().theme; },
        locale() { return useSettingsStore().locale; },
        pulseInterval() { return useSettingsStore().pulseInterval; },

        // ── Proxy to ui store ──
        visualStyle() { return useUiStore().visualStyle; },
        treemapScale() { return useUiStore().treemapScale; },
        treemapMode() { return useUiStore().treemapMode; },

        // ── Proxy to tasks store (state) ──
        tasks() { return useTasksStore().tasks; },
        categories() { return useTasksStore().categories; },
        subcatCoeffs() { return useTasksStore().subcatCoeffs; },
        notepadText() { return useTasksStore().notepadText; },
        lastSync() { return useTasksStore().lastSync; },
        stats() { return useTasksStore().stats; },
        loading() { return useTasksStore().loading; },
        lastPulse() { return useTasksStore().lastPulse; },
        pulseTimer() { return useTasksStore().pulseTimer; },
        notificationsEnabled() { return useTasksStore().notificationsEnabled; },

        // ── Proxy to tasks store (getters) ──
        allSubcats() { return useTasksStore().allSubcats; },
        allTasksOrdered() { return useTasksStore().allTasksOrdered; },
        counts() { return useTasksStore().counts; },

        // ── Cross-domain getters (need filterCat from balance + tasks data) ──
        bubbleTasks() {
            const tasksStore = useTasksStore();
            const active = tasksStore.allTasksOrdered.filter(t => {
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > new Date()) return false;
                return true;
            });
            if (this.filterCat === 'all') return active;
            if (['archive', 'hidden'].includes(this.filterCat)) return [];
            return active.filter(t => t.category_slug === this.filterCat);
        },

        focusTasks() { return this.bubbleTasks.filter(t => !t.ha && !this.isEffectivelyPostponed(t)); },
        plansTasks() { return this.bubbleTasks.filter(t => this.isEffectivelyPostponed(t)); },
        routineTasks() { return this.bubbleTasks.filter(t => t.ha && !this.isEffectivelyPostponed(t)); },

        filteredTasks() {
            const now = new Date();
            const tasksStore = useTasksStore();
            let tasks = tasksStore.allTasksOrdered;
            if (this.filterCat === 'hidden') {
                return tasks.filter(t => t.hidden_until && new Date(t.hidden_until) > now && !t.completed)
                    .sort((a, b) => new Date(a.hidden_until) - new Date(b.hidden_until));
            }
            if (this.filterCat === 'archive') {
                return tasks.filter(t => t.completed)
                    .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
            }
            tasks = tasks.filter(t => !t.completed && (!t.hidden_until || new Date(t.hidden_until) <= now));
            if (this.filterCat !== 'all') tasks = tasks.filter(t => t.category_slug === this.filterCat);
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                tasks = tasks.filter(t =>
                    (t.title && t.title.toLowerCase().includes(q)) ||
                    (t.notes && t.notes.toLowerCase().includes(q)));
            }
            return tasks;
        },
    },

    actions: {
        // ── Auth lifecycle ──

        async init() {
            try {
                await useAuthStore().init();
                if (useAuthStore().token) {
                    await this.sync();
                    this.startPulse();
                }
            } catch (e) {
                console.error('Init error:', e);
                await this.logout();
            }
        },

        async logout() {
            useTasksStore().stopPulse();
            await useAuthStore().logout();
            const tasks = useTasksStore();
            tasks.lastSync = null;
            localStorage.removeItem('last_sync');
            tasks.tasks = [];
            tasks.categories = [];
            tasks.subcatCoeffs = {};
            await tasks.sync(true);
        },

        // ── Data & Sync ──

        async fetchAll() { await useTasksStore().fetchAll(); },
        async fetchStats() { await useTasksStore().fetchStats(); },
        async sync(forceFull = false) { await useTasksStore().sync(forceFull); },
        mergeCollection(key, data, isFull) { useTasksStore().mergeCollection(key, data, isFull); },

        // ── Task CRUD ──

        async addTask(taskData) { await useTasksStore().addTask(taskData); },
        async deleteTask(id) { await useTasksStore().deleteTask(id); },
        async updateTask(id, payload) { await useTasksStore().updateTask(id, payload); },
        async completeTask(id) { await useTasksStore().completeTask(id); },
        async archiveTask(id) { await useTasksStore().archiveTask(id); },
        async restoreTask(id) { await useTasksStore().restoreTask(id); },
        async returnNow(id) { await useTasksStore().returnNow(id); },

        // ── Settings ──

        async setTheme(t) { await useSettingsStore().setTheme(t); },
        async setLocale(l) { await useSettingsStore().setLocale(l); },
        async setPulseInterval(m) { await useSettingsStore().setPulseInterval(m); this.startPulse(); },
        setVisualStyle(s) { useUiStore().setVisualStyle(s); },
        setTreemapScale(s) { useUiStore().setTreemapScale(s); },
        setTreemapMode(m) { useUiStore().setTreemapMode(m); },

        // ── Push ──

        async toggleNotifications() { await useTasksStore().toggleNotifications(); },
        async subscribeToPush() { await useTasksStore().subscribeToPush(); },
        async unsubscribeFromPush() { await useTasksStore().unsubscribeFromPush(); },

        // ── Pulse ──

        startPulse() { useTasksStore().startPulse(); },
        stopPulse() { useTasksStore().stopPulse(); },
        recalculateAll() { useTasksStore().recalculateAll(); },
        checkReminders() { useTasksStore().checkReminders(); },

        // ── Theme ──

        applyTheme() { useSettingsStore().applyTheme(); },

        // ── Priority ──

        calculateNextOccurrence(t, payload = {}) { return useTasksStore().calculateNextOccurrence(t, payload); },
        isCategoryPostponed(slug) { return useTasksStore().isCategoryPostponed(slug); },
        isEffectivelyPostponed(t) { return useTasksStore().isEffectivelyPostponed(t); },
        isHidden(t) { return useTasksStore().isHidden(t); },
    },
});
