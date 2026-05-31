import { defineStore } from 'pinia';
import axios from 'axios';
import { recalculateTasks, isEffectivelyPostponed, isCategoryPostponed } from '../utils/priority-engine';

export const useBalanceStore = defineStore('balance', {
    state: () => ({
        tasks: [],
        categories: [],
        subcatCoeffs: {},
        filterCat: 'all',
        loading: false,
        bubbleZoom: 1,
        notepadText: '',
        theme: 'system',
        locale: localStorage.getItem('locale') || 'ru',
        pulseInterval: parseInt(localStorage.getItem('pulse_interval')) || 1,
        notificationsEnabled: localStorage.getItem('notifications_enabled') === 'true',
        searchQuery: '',
        lastSync: localStorage.getItem('last_sync') || null,
        lastPulse: new Date().toDateString(),
        pulseTimer: null,
        user: null,
        token: localStorage.getItem('auth_token') || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        googleAuthUrl: () => (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/google',
        allSubcats: (state) => Object.keys(state.subcatCoeffs),

        /**
         * Base getter for all tasks sorted by priority.
         */
        allTasksOrdered: (state) => {
            if (!Array.isArray(state.tasks)) return [];
            return [...state.tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        },

        /**
         * Getters for visualization sections.
         */
        bubbleTasks: (state) => {
            const active = state.allTasksOrdered.filter(t => {
                if (t.completed) return false;
                const now = new Date();
                if (t.hidden_until && new Date(t.hidden_until) > now) return false;
                return true;
            });

            if (state.filterCat === 'all') return active;
            if (['archive', 'hidden'].includes(state.filterCat)) return [];
            return active.filter(t => t.category_slug === state.filterCat);
        },

        focusTasks: (state) => state.bubbleTasks.filter(t => !t.ha && !state.isEffectivelyPostponed(t)),
        plansTasks: (state) => state.bubbleTasks.filter(t => state.isEffectivelyPostponed(t)),
        routineTasks: (state) => state.bubbleTasks.filter(t => t.ha && !state.isEffectivelyPostponed(t)),

        /**
         * Main tasks list getter with full filtering logic.
         */
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

            // Regular filter
            tasks = tasks.filter(t => !t.completed && (!t.hidden_until || new Date(t.hidden_until) <= now));
            
            if (state.filterCat !== 'all') {
                tasks = tasks.filter(t => t.category_slug === state.filterCat);
            }

            if (state.searchQuery) {
                const q = state.searchQuery.toLowerCase();
                tasks = tasks.filter(t => 
                    (t.title && t.title.toLowerCase().includes(q)) || 
                    (t.notes && t.notes.toLowerCase().includes(q))
                );
            }

            return tasks;
        },

        counts: (state) => {
            const now = new Date();
            const res = { all: 0, hidden: 0, archive: 0, byCat: {} };

            if (!Array.isArray(state.tasks)) return res;

            state.tasks.forEach(t => {
                if (t.completed) {
                    res.archive++;
                } else if (t.hidden_until && new Date(t.hidden_until) > now) {
                    res.hidden++;
                } else {
                    res.all++;
                    if (t.category_slug) {
                        res.byCat[t.category_slug] = (res.byCat[t.category_slug] || 0) + 1;
                    }
                }
            });
            return res;
        }
    },

    actions: {
        async init() {
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');
            if (tokenFromUrl) {
                this.token = tokenFromUrl;
                localStorage.setItem('auth_token', tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (this.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                try {
                    const res = await axios.get('user');
                    this.user = res.data;
                    await this.sync();
                    this.startPulse();
                } catch (e) {
                    this.logout();
                }
            }
        },

        async logout() {
            this.stopPulse();
            if (this.token) {
                try { await axios.post('logout'); } catch (e) {}
            }
            this.token = null;
            this.user = null;
            this.lastSync = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('last_sync');
            delete axios.defaults.headers.common['Authorization'];
            this.tasks = [];
            this.categories = [];
            await this.sync(true);
        },

        async fetchAll() {
            await this.sync(true);
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
                const data = res.data;

                // Sync logic...
                this.mergeCollection('tasks', data.tasks, forceFull);
                this.mergeCollection('categories', data.categories, forceFull);

                if (data.settings) {
                    this.notepadText = data.settings.notepad_text || this.notepadText;
                    this.theme = data.settings.theme || this.theme;
                    this.locale = data.settings.locale || this.locale;
                    this.pulseInterval = parseInt(data.settings.pulse_interval) || this.pulseInterval;
                }
                
                if (data.subcatCoeffs) this.subcatCoeffs = data.subcatCoeffs;

                this.lastSync = data.server_time;
                localStorage.setItem('last_sync', this.lastSync);

                this.recalculateAll();
                this.applyTheme();
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

        async setTheme(newTheme) {
            this.theme = newTheme;
            this.applyTheme();
            await axios.post('settings', { settings: { theme: newTheme } });
        },

        async setLocale(newLocale) {
            this.locale = newLocale;
            localStorage.setItem('locale', newLocale);
            await axios.post('settings', { settings: { locale: newLocale } });
        },

        async setPulseInterval(minutes) {
            this.pulseInterval = parseInt(minutes);
            localStorage.setItem('pulse_interval', minutes);
            this.startPulse();
            await axios.post('settings', { settings: { pulse_interval: minutes } });
        },

        async toggleNotifications() {
            this.notificationsEnabled ? await this.unsubscribeFromPush() : await this.subscribeToPush();
        },

        async subscribeToPush() {
            try {
                const registration = await navigator.serviceWorker.ready;
                const publicKey = __VAPID_PUBLIC_KEY__;
                if (!publicKey) throw new Error('VAPID public key not found');

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(publicKey)
                });

                const p = JSON.parse(JSON.stringify(subscription));
                await axios.post('push-subscriptions', {
                    endpoint: p.endpoint,
                    public_key: p.keys.p256dh,
                    auth_token: p.keys.auth
                });

                this.notificationsEnabled = true;
                localStorage.setItem('notifications_enabled', 'true');
            } catch (e) {
                console.error('Push subscription failed:', e);
                alert('Не удалось включить уведомления.');
            }
        },

        async unsubscribeFromPush() {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await axios.delete('push-subscriptions', { data: { endpoint: subscription.endpoint } });
                    await subscription.unsubscribe();
                }
                this.notificationsEnabled = false;
                localStorage.setItem('notifications_enabled', 'false');
            } catch (e) {
                console.error('Push unsubscription failed:', e);
            }
        },

        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
            return outputArray;
        },

        startPulse() {
            this.stopPulse();
            if (this.pulseInterval <= 0) return;

            this.pulseTimer = setInterval(() => {
                const today = new Date().toDateString();
                if (today !== this.lastPulse) {
                    this.lastPulse = today;
                    this.fetchAll();
                } else {
                    this.recalculateAll();
                }
            }, this.pulseInterval * 60000);
        },

        stopPulse() {
            if (this.pulseTimer) { clearInterval(this.pulseTimer); this.pulseTimer = null; }
        },

        applyTheme() {
            const isDark = this.theme === 'dark' || 
                (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
        },

        recalculateAll() {
            this.tasks = recalculateTasks(this.tasks, this.categories, this.subcatCoeffs);
        },

        isCategoryPostponed(catSlug) {
            const cat = this.categories.find(c => c.slug === catSlug);
            return isCategoryPostponed(cat);
        },

        isEffectivelyPostponed(t) {
            const catsMap = Object.fromEntries(this.categories.map(c => [c.slug, c]));
            return isEffectivelyPostponed(t, catsMap);
        },

        isHidden(t) {
            return t.hidden_until && new Date(t.hidden_until) > new Date();
        },

        async addTask(taskData) {
            const res = await axios.post('tasks', taskData);
            this.tasks.push(res.data);
            this.recalculateAll();
        },

        async updateTask(id, payload) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;

            // Logic: Recurring tasks should go to 'hidden' instead of 'archive' on completion
            const isRecurring = (payload.repeat_type && payload.repeat_type !== 'none') || 
                              (!payload.repeat_type && t.repeat_type && t.repeat_type !== 'none');

            if (payload.completed && isRecurring) {
                payload.completed = false;
                payload.completed_at = null;
                
                const nextData = this.calculateNextOccurrence(t, payload);
                payload.hidden_until = nextData.hidden_until;
                payload.last_completed_date = nextData.last_completed_date;
                payload.notes = (payload.notes !== undefined ? payload.notes : t.notes || '');
                payload.notes = (payload.notes ? payload.notes + '\n' : '') + '✔ ' + new Date().toLocaleString();
                payload.missed_count = 0;
            }

            const res = await axios.put(`tasks/${id}`, payload);
            const idx = this.tasks.findIndex(x => x.id === id);
            if (idx !== -1) this.tasks[idx] = res.data;
            
            this.recalculateAll();
        },

        calculateNextOccurrence(t, payload = {}) {
            const repeat_type = payload.repeat_type || t.repeat_type;
            const repeat_interval = payload.repeat_interval || t.repeat_interval;
            const repeat_days = payload.repeat_days || t.repeat_days;
            
            const now = new Date();
            let nextDate = new Date();
            
            if (repeat_type === 'interval') {
                nextDate.setDate(nextDate.getDate() + (parseInt(repeat_interval) || 1));
            } else if (repeat_type === 'weekly' && repeat_days?.length) {
                nextDate.setDate(nextDate.getDate() + 1);
                while (!repeat_days.includes(nextDate.getDay())) { 
                    nextDate.setDate(nextDate.getDate() + 1); 
                }
            }

            // Ensure task activates at the very start of the target day (00:00:00)
            nextDate.setHours(0, 0, 0, 0);

            return {
                hidden_until: nextDate.toISOString(),
                last_completed_date: now.toISOString()
            };
        },

        async completeTask(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t || t.completed) return;

            if (t.repeat_type === 'none') {
                await this.updateTask(id, { 
                    completed: true, 
                    completed_at: new Date().toISOString(),
                    missed_count: 0 
                });
            } else {
                await this.updateTask(id, { completed: true }); // updateTask will handle the rest
            }
        },

        async restoreTask(id) {
            await this.updateTask(id, { completed: false, completed_at: null, hidden_until: null });
        },

        async returnNow(id) {
            await this.updateTask(id, { hidden_until: null });
        },
    }
});
