/**
 * Tasks store — CRUD, sync, pulse, push, priority.
 * filterCat / searchQuery / bubbleZoom stay in balance.js (mutated directly by components).
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import axios from 'axios';
import { recalculateTasks, isEffectivelyPostponed as isEffectivelyPostponedUtil, isCategoryPostponed as isCategoryPostponedUtil } from '../utils/priority-engine';
import { urlBase64ToUint8Array } from './auth.js';
import { useSettingsStore } from './settings.js';
import { useAuthStore } from './auth.js';

export const useTasksStore = defineStore('tasks', {
    state: () => ({
        tasks: [],
        categories: [],
        subcatCoeffs: {},
        notepadText: '',
        lastSync: localStorage.getItem('last_sync') || null,
        stats: null,
        loading: false,
        lastPulse: new Date().toDateString(),
        pulseTimer: null,
        notificationsEnabled: localStorage.getItem('notifications_enabled') === 'true',
    }),

    getters: {
        allSubcats: (state) => Object.keys(state.subcatCoeffs),

        allTasksOrdered: (state) => {
            if (!Array.isArray(state.tasks)) return [];
            return [...state.tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
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
        // ── Data & Sync ──

        async fetchAll() {
            await this.sync(true);
        },

        async fetchStats() {
            if (!useAuthStore().token) return;
            try {
                const res = await axios.get('stats');
                this.stats = res.data;
            } catch (e) {
                console.error('Fetch stats error:', e);
            }
        },

        async sync(forceFull = false) {
            this.loading = true;
            try {
                const params = {};
                if (!forceFull && this.lastSync && this.tasks.length > 0) {
                    params.since = this.lastSync;
                } else {
                    forceFull = true;
                }
                const res = await axios.get('sync', { params });
                const d = res.data;
                this.mergeCollection('tasks', d.tasks, forceFull);
                this.mergeCollection('categories', d.categories, forceFull);
                if (d.settings) {
                    this.notepadText = d.settings.notepad_text || this.notepadText;
                    const settings = useSettingsStore();
                    settings.theme = d.settings.theme || settings.theme;
                    settings.locale = d.settings.locale || settings.locale;
                    settings.pulseInterval = parseInt(d.settings.pulse_interval) || settings.pulseInterval;
                }
                if (d.subcatCoeffs) this.subcatCoeffs = d.subcatCoeffs;
                this.lastSync = d.server_time;
                localStorage.setItem('last_sync', this.lastSync);
                this.recalculateAll();
                useSettingsStore().applyTheme();
            } catch (e) {
                console.error('Sync error:', e);
            } finally {
                this.loading = false;
            }
        },

        mergeCollection(key, data, isFull) {
            if (!data) return;
            if (isFull) {
                this[key] = Array.isArray(data.updated) ? data.updated : [];
            } else {
                if (Array.isArray(data.updated)) {
                    data.updated.forEach(u => {
                        const idx = this[key].findIndex(x => x.id === u.id);
                        if (idx !== -1) this[key][idx] = u;
                        else this[key].push(u);
                    });
                }
                if (Array.isArray(data.deleted)) {
                    this[key] = this[key].filter(x => !data.deleted.includes(x.id));
                }
            }
        },

        // ── Task CRUD ──

        async addTask(taskData) {
            const res = await axios.post('tasks', taskData);
            this.tasks.push(res.data);
            this.recalculateAll();
        },

        async deleteTask(id) {
            await axios.delete(`tasks/${id}`);
            this.tasks = this.tasks.filter(x => x.id !== id);
            this.recalculateAll();
        },

        async updateTask(id, payload) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;
            const isRecurring = (payload.repeat_type && payload.repeat_type !== 'none') ||
                              (!payload.repeat_type && t.repeat_type && t.repeat_type !== 'none');
            if (payload.completed && isRecurring) {
                const n = this.calculateNextOccurrence(t, payload);
                payload.completed = false;
                payload.completed_at = null;
                payload.hidden_until = n.hidden_until;
                payload.last_completed_date = n.last_completed_date;
                payload.missed_count = 0;
                payload._was_completed = true;
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

        async restoreTask(id) {
            await this.updateTask(id, { completed: false, completed_at: null, hidden_until: null, postpone_until: null });
        },

        async returnNow(id) {
            await this.updateTask(id, { hidden_until: null, postpone_until: null });
        },

        // ── Push ──

        async toggleNotifications() {
            if (this.notificationsEnabled) {
                await this.unsubscribeFromPush();
            } else {
                await this.subscribeToPush();
            }
        },

        async subscribeToPush() {
            try {
                const r = await navigator.serviceWorker.ready;
                const key = __VAPID_PUBLIC_KEY__;
                if (!key) throw new Error('VAPID key');
                const sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
                const p = JSON.parse(JSON.stringify(sub));
                await axios.post('push-subscriptions', { endpoint: p.endpoint, public_key: p.keys.p256dh, auth_token: p.keys.auth });
                this.notificationsEnabled = true;
                localStorage.setItem('notifications_enabled', 'true');
            } catch (e) {
                console.error('Push subscription failed:', e);
                window.alert('Не удалось включить уведомления.');
            }
        },

        async unsubscribeFromPush() {
            try {
                const r = await navigator.serviceWorker.ready;
                const sub = await r.pushManager.getSubscription();
                if (sub) {
                    await axios.delete('push-subscriptions', { data: { endpoint: sub.endpoint } });
                    await sub.unsubscribe();
                }
                this.notificationsEnabled = false;
                localStorage.setItem('notifications_enabled', 'false');
            } catch (e) {
                console.error('Push unsubscription failed:', e);
            }
        },

        // ── Pulse ──

        startPulse() {
            this.stopPulse();
            const pulseInterval = useSettingsStore().pulseInterval;
            if (pulseInterval <= 0) return;
            this.pulseTimer = window.setInterval(() => {
                const today = new Date().toDateString();
                if (today !== this.lastPulse) {
                    this.lastPulse = today;
                    this.fetchAll();
                } else {
                    this.recalculateAll();
                }
                this.checkReminders();
            }, pulseInterval * 60000);
        },

        stopPulse() {
            if (this.pulseTimer) {
                window.clearInterval(this.pulseTimer);
                this.pulseTimer = null;
            }
        },

        recalculateAll() {
            this.tasks = recalculateTasks(this.tasks, this.categories, this.subcatCoeffs);
        },

        checkReminders() {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
            const now = new Date();
            const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            this.tasks.forEach(t => {
                if (t.completed || !t.reminder_times?.length) return;
                if (t.hidden_until && new Date(t.hidden_until) > now) return;
                if (t.reminder_times.includes(ct)) {
                    try {
                        new Notification(t.title, { body: t.subcategory || t.notes || '', icon: '/favicon.svg', tag: `rem-${t.id}-${ct}` });
                    } catch {
                        /* noop */
                    }
                }
            });
        },

        // ── Priority helpers ──

        calculateNextOccurrence(t, payload = {}) {
            const rt = payload.repeat_type || t.repeat_type;
            const ri = payload.repeat_interval || t.repeat_interval;
            const rd = payload.repeat_days || t.repeat_days;
            const now = new Date();
            let nd = new Date();
            if (rt === 'interval') {
                nd.setDate(nd.getDate() + (parseInt(ri) || 1));
            } else if (rt === 'weekly' && rd?.length) {
                nd.setDate(nd.getDate() + 1);
                while (!rd.includes(nd.getDay())) nd.setDate(nd.getDate() + 1);
            }
            nd.setHours(0, 0, 0, 0);
            return { hidden_until: nd.toISOString(), last_completed_date: now.toISOString() };
        },

        isCategoryPostponed(slug) {
            return isCategoryPostponedUtil(this.categories.find(c => c.slug === slug));
        },

        isEffectivelyPostponed(t) {
            return isEffectivelyPostponedUtil(t, Object.fromEntries(this.categories.map(c => [c.slug, c])));
        },

        isHidden(t) {
            return t.hidden_until && new Date(t.hidden_until) > new Date();
        },
    },
});
