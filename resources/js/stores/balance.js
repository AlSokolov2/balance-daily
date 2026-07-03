/**
 * Main application store — task engine + settings + UI state.
 * Auth logic (init, logout, OAuth URLs) extracted to stores/auth.js module.
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import axios from 'axios';
import { recalculateTasks, isEffectivelyPostponed, isCategoryPostponed } from '../utils/priority-engine';
import { initAuth, logoutAuth, googleAuthUrl, vkAuthUrl, urlBase64ToUint8Array } from './auth.js';

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
        theme: 'system',
        locale: localStorage.getItem('locale') || 'ru',
        pulseInterval: parseInt(localStorage.getItem('pulse_interval')) || 1,
        visualStyle: localStorage.getItem('visual_style') || 'bubbles',
        treemapScale: parseFloat(localStorage.getItem('treemap_scale')) || 1.2,
        treemapMode: localStorage.getItem('treemap_mode') || 'nested',
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

        async fetchAll() { await this.sync(true); },
        async fetchStats() {
            if (!this.token) return;
            try { const res = await axios.get('stats'); this.stats = res.data; }
            catch (e) { console.error('Fetch stats error:', e); }
        },

        async sync(forceFull = false) {
            this.loading = true;
            try {
                const params = {};
                if (!forceFull && this.lastSync && this.tasks.length > 0) { params.since = this.lastSync; }
                else { forceFull = true; }
                const res = await axios.get('sync', { params });
                const d = res.data;
                this.mergeCollection('tasks', d.tasks, forceFull);
                this.mergeCollection('categories', d.categories, forceFull);
                if (d.settings) {
                    this.notepadText = d.settings.notepad_text || this.notepadText;
                    this.theme = d.settings.theme || this.theme;
                    this.locale = d.settings.locale || this.locale;
                    this.pulseInterval = parseInt(d.settings.pulse_interval) || this.pulseInterval;
                }
                if (d.subcatCoeffs) this.subcatCoeffs = d.subcatCoeffs;
                this.lastSync = d.server_time;
                localStorage.setItem('last_sync', this.lastSync);
                this.recalculateAll();
                this.applyTheme();
            } catch (e) { console.error('Sync error:', e); }
            finally { this.loading = false; }
        },

        mergeCollection(key, data, isFull) {
            if (!data) return;
            if (isFull) { this[key] = Array.isArray(data.updated) ? data.updated : []; }
            else {
                if (Array.isArray(data.updated)) {
                    data.updated.forEach(u => {
                        const idx = this[key].findIndex(x => x.id === u.id);
                        if (idx !== -1) this[key][idx] = u; else this[key].push(u);
                    });
                }
                if (Array.isArray(data.deleted)) this[key] = this[key].filter(x => !data.deleted.includes(x.id));
            }
        },

        // ── Task CRUD ──

        async addTask(taskData) { const res = await axios.post('tasks', taskData); this.tasks.push(res.data); this.recalculateAll(); },
        async deleteTask(id) { await axios.delete(`tasks/${id}`); this.tasks = this.tasks.filter(x => x.id !== id); this.recalculateAll(); },

        async updateTask(id, payload) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;
            const isRecurring = (payload.repeat_type && payload.repeat_type !== 'none') ||
                              (!payload.repeat_type && t.repeat_type && t.repeat_type !== 'none');
            if (payload.completed && isRecurring) {
                const n = this.calculateNextOccurrence(t, payload);
                payload.completed = false; payload.completed_at = null;
                payload.hidden_until = n.hidden_until; payload.last_completed_date = n.last_completed_date;
                payload.missed_count = 0; payload._was_completed = true;
            }
            const res = await axios.put(`tasks/${id}`, payload);
            const idx = this.tasks.findIndex(x => x.id === id);
            if (idx !== -1) this.tasks[idx] = res.data;
            this.recalculateAll();
        },

        async completeTask(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t || t.completed) return;
            await this.updateTask(id, { completed: true, completed_at: new Date().toISOString(), missed_count: 0 });
        },

        async archiveTask(id) {
            await axios.put(`tasks/${id}`, { completed: true, completed_at: new Date().toISOString(), _skip_history: true });
            this.tasks = this.tasks.filter(x => x.id !== id);
            this.recalculateAll();
        },

        async restoreTask(id) { await this.updateTask(id, { completed: false, completed_at: null, hidden_until: null, postpone_until: null }); },
        async returnNow(id) { await this.updateTask(id, { hidden_until: null, postpone_until: null }); },

        // ── Settings ──

        async setTheme(t) { this.theme = t; this.applyTheme(); await axios.post('settings', { settings: { theme: t } }); },
        async setLocale(l) { this.locale = l; localStorage.setItem('locale', l); await axios.post('settings', { settings: { locale: l } }); },
        async setPulseInterval(m) { this.pulseInterval = parseInt(m); localStorage.setItem('pulse_interval', m); this.startPulse(); await axios.post('settings', { settings: { pulse_interval: m } }); },
        setVisualStyle(s) { this.visualStyle = s; localStorage.setItem('visual_style', s); },
        setTreemapScale(s) { this.treemapScale = parseFloat(s); localStorage.setItem('treemap_scale', s); },
        setTreemapMode(m) { this.treemapMode = m; localStorage.setItem('treemap_mode', m); },

        // ── Push ──

        async toggleNotifications() { this.notificationsEnabled ? await this.unsubscribeFromPush() : await this.subscribeToPush(); },
        async subscribeToPush() {
            try {
                const r = await navigator.serviceWorker.ready;
                const key = __VAPID_PUBLIC_KEY__;
                if (!key) throw new Error('VAPID key');
                const sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
                const p = JSON.parse(JSON.stringify(sub));
                await axios.post('push-subscriptions', { endpoint: p.endpoint, public_key: p.keys.p256dh, auth_token: p.keys.auth });
                this.notificationsEnabled = true; localStorage.setItem('notifications_enabled', 'true');
            } catch (e) { console.error('Push subscription failed:', e); window.alert('Не удалось включить уведомления.'); }
        },
        async unsubscribeFromPush() {
            try {
                const r = await navigator.serviceWorker.ready;
                const sub = await r.pushManager.getSubscription();
                if (sub) { await axios.delete('push-subscriptions', { data: { endpoint: sub.endpoint } }); await sub.unsubscribe(); }
                this.notificationsEnabled = false; localStorage.setItem('notifications_enabled', 'false');
            } catch (e) { console.error('Push unsubscription failed:', e); }
        },

        // ── Pulse ──

        startPulse() {
            this.stopPulse();
            if (this.pulseInterval <= 0) return;
            this.pulseTimer = window.setInterval(() => {
                const today = new Date().toDateString();
                if (today !== this.lastPulse) { this.lastPulse = today; this.fetchAll(); }
                else { this.recalculateAll(); }
                this.checkReminders();
            }, this.pulseInterval * 60000);
        },
        stopPulse() { if (this.pulseTimer) { window.clearInterval(this.pulseTimer); this.pulseTimer = null; } },
        recalculateAll() { this.tasks = recalculateTasks(this.tasks, this.categories, this.subcatCoeffs); },
        checkReminders() {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
            const now = new Date();
            const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            this.tasks.forEach(t => {
                if (t.completed || !t.reminder_times?.length) return;
                if (t.hidden_until && new Date(t.hidden_until) > now) return;
                if (t.reminder_times.includes(ct)) {
                    try { new Notification(t.title, { body: t.subcategory || t.notes || '', icon: '/favicon.svg', tag: `rem-${t.id}-${ct}` }); } catch {}
                }
            });
        },

        // ── Theme ──

        applyTheme() {
            const isDark = this.theme === 'dark' || (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
        },

        // ── Priority ──

        calculateNextOccurrence(t, payload = {}) {
            const rt = payload.repeat_type || t.repeat_type;
            const ri = payload.repeat_interval || t.repeat_interval;
            const rd = payload.repeat_days || t.repeat_days;
            const now = new Date();
            let nd = new Date();
            if (rt === 'interval') { nd.setDate(nd.getDate() + (parseInt(ri) || 1)); }
            else if (rt === 'weekly' && rd?.length) { nd.setDate(nd.getDate() + 1); while (!rd.includes(nd.getDay())) nd.setDate(nd.getDate() + 1); }
            nd.setHours(0, 0, 0, 0);
            return { hidden_until: nd.toISOString(), last_completed_date: now.toISOString() };
        },
        isCategoryPostponed(slug) { return isCategoryPostponed(this.categories.find(c => c.slug === slug)); },
        isEffectivelyPostponed(t) { return isEffectivelyPostponed(t, Object.fromEntries(this.categories.map(c => [c.slug, c]))); },
        isHidden(t) { return t.hidden_until && new Date(t.hidden_until) > new Date(); },
    },
});
