import { defineStore } from 'pinia';
import axios from 'axios';

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

        activeTasks: (state) => {
            const now = new Date();
            if (!Array.isArray(state.tasks)) return [];
            return state.tasks.filter(t => {
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > now) return false;
                return true;
            }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        },

        bubbleTasks: (state) => {
            const active = state.tasks && Array.isArray(state.tasks) ? state.tasks.filter(t => {
                const now = new Date();
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > now) return false;
                return true;
            }).sort((a, b) => b.calculatedPriority - a.calculatedPriority) : [];

            if (state.filterCat === 'all') return active;
            if (state.filterCat === 'archive' || state.filterCat === 'hidden') return [];
            return active.filter(t => t.category_slug === state.filterCat);
        },

        filteredTasks: (state) => {
            const now = new Date();
            if (!Array.isArray(state.tasks)) return [];
            let tasks = [...state.tasks];
            
            if (state.filterCat === 'hidden') {
                return tasks.filter(t => t.hidden_until && new Date(t.hidden_until) > now && !t.completed)
                            .sort((a, b) => new Date(a.hidden_until) - new Date(b.hidden_until));
            }
            
            if (state.filterCat === 'archive') {
                return tasks.filter(t => t.completed)
                            .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
            }

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

            return tasks.sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        },

        counts: (state) => {
            const now = new Date();
            const res = {
                all: 0,
                hidden: 0,
                archive: 0,
                byCat: {}
            };

            if (!Array.isArray(state.tasks)) return res;

            state.tasks.forEach(t => {
                if (t.completed) {
                    res.archive++;
                } else {
                    const isHidden = t.hidden_until && new Date(t.hidden_until) > now;
                    if (isHidden) {
                        res.hidden++;
                    } else {
                        res.all++;
                        if (t.category_slug) {
                            res.byCat[t.category_slug] = (res.byCat[t.category_slug] || 0) + 1;
                        }
                    }
                }
            });

            return res;
        }
    },

    actions: {
        /**
         * Initialize the store, check for auth tokens and user data.
         */
        async init() {
            // ... (обработка токена из URL)
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
                    await this.sync(); // Используем инкрементальную синхронизацию
                    this.startPulse();
                } catch (e) {
                    this.logout();
                }
            }
        },

        /**
         * Log out the current user and clear local state.
         */
        async logout() {
            this.stopPulse();
            if (this.token) {
                try {
                    await axios.post('logout');
                } catch (e) {}
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

        /**
         * Fetch all user data using full or incremental sync.
         */
        async fetchAll() {
            await this.sync(true); // fetchAll теперь всегда делает полную синхронизацию
        },

        async sync(forceFull = false) {
            this.loading = true;
            try {
                const params = {};
                // If local tasks are empty, we MUST do a full sync even if lastSync exists
                const isLocalStateEmpty = this.tasks.length === 0;
                
                if (!forceFull && this.lastSync && !isLocalStateEmpty) {
                    params.since = this.lastSync;
                } else {
                    forceFull = true; // Mark as full sync for merging logic below
                }

                const res = await axios.get('sync', { params });
                const data = res.data;

                // 1. Merge Tasks
                if (forceFull) {
                    this.tasks = Array.isArray(data.tasks?.updated) ? data.tasks.updated : [];
                } else {
                    if (Array.isArray(data.tasks?.updated)) {
                        data.tasks.updated.forEach(u => {
                            const idx = this.tasks.findIndex(t => t.id === u.id);
                            if (idx !== -1) this.tasks[idx] = u;
                            else this.tasks.push(u);
                        });
                    }
                    if (Array.isArray(data.tasks?.deleted)) {
                        this.tasks = this.tasks.filter(t => !data.tasks.deleted.includes(t.id));
                    }
                }

                // 2. Merge Categories
                if (forceFull) {
                    this.categories = Array.isArray(data.categories?.updated) ? data.categories.updated : [];
                } else {
                    if (Array.isArray(data.categories?.updated)) {
                        data.categories.updated.forEach(u => {
                            const idx = this.categories.findIndex(c => c.id === u.id);
                            if (idx !== -1) this.categories[idx] = u;
                            else this.categories.push(u);
                        });
                    }
                    if (Array.isArray(data.categories?.deleted)) {
                        this.categories = this.categories.filter(c => !data.categories.deleted.includes(c.id));
                    }
                }

                // 3. Settings & Coeffs
                if (data.settings) {
                    this.notepadText = data.settings.notepad_text || this.notepadText;
                    this.theme = data.settings.theme || this.theme;
                    this.locale = data.settings.locale || this.locale;
                    this.pulseInterval = parseInt(data.settings.pulse_interval) || this.pulseInterval;
                }
                
                if (data.subcatCoeffs) {
                    this.subcatCoeffs = data.subcatCoeffs;
                }

                // 4. Update lastSync
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

        async setTheme(newTheme) {
            this.theme = newTheme;
            this.applyTheme();
            await axios.post('settings', { settings: { theme: newTheme } });
        },

        async setLocale(newLocale) {
            this.locale = newLocale;
            localStorage.setItem('locale', newLocale);
            // We'll update the i18n instance from the component or here if we import it
            await axios.post('settings', { settings: { locale: newLocale } });
        },

        async setPulseInterval(minutes) {
            this.pulseInterval = parseInt(minutes);
            localStorage.setItem('pulse_interval', minutes);
            this.startPulse(); // Restart with new interval
            await axios.post('settings', { settings: { pulse_interval: minutes } });
        },

        async toggleNotifications() {
            if (this.notificationsEnabled) {
                await this.unsubscribeFromPush();
            } else {
                await this.subscribeToPush();
            }
        },

        async subscribeToPush() {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Get VAPID public key from meta or config
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
                alert('Не удалось включить уведомления. Проверьте разрешения в браузере.');
            }
        },

        async unsubscribeFromPush() {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await axios.delete('push-subscriptions', {
                        data: { endpoint: subscription.endpoint }
                    });
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
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        },

        startPulse() {
            this.stopPulse();
            if (this.pulseInterval <= 0) return; // Manual mode

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
            if (this.pulseTimer) {
                clearInterval(this.pulseTimer);
                this.pulseTimer = null;
            }
        },

        applyTheme() {
            const isDark = this.theme === 'dark' || 
                (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },

        /**
         * Main engine: recalculate all task priorities and dynamic category weights.
         */
        recalculateAll() {
            const now = new Date();
            if (!this.categories || !Array.isArray(this.categories) || !this.categories.length) return;
            if (!this.tasks || !Array.isArray(this.tasks)) { this.tasks = []; return; }

            // 1. Calculate missed counts for repeat tasks
            this.tasks.forEach(t => {
                if (!t.completed && t.repeat_type !== 'none' && t.last_completed_date) {
                    let due = null;
                    const last = new Date(t.last_completed_date);
                    if (t.repeat_type === 'interval') {
                        due = new Date(last);
                        due.setDate(due.getDate() + (parseInt(t.repeat_interval) || 1));
                    } else if (t.repeat_type === 'weekly' && t.repeat_days && t.repeat_days.length) {
                        due = new Date(last);
                        due.setDate(due.getDate() + 1);
                        while (due <= now) {
                            if (t.repeat_days.includes(due.getDay())) break;
                            due.setDate(due.getDate() + 1);
                        }
                    }
                    if (due) {
                        t.missed_count = Math.max(0, Math.ceil((now - due) / 86400000));
                    }
                } else {
                    t.missed_count = t.missed_count || 0;
                }
            });

            // 2. Calculate dynamic category weights (1.5x boost for empty categories)
            const ARCHIVE = '__archive__';
            this.categories.forEach(c => {
                c.currentWeight = parseFloat(c.weight) || 0.1;
                const completedToday = this.tasks.filter(t => 
                    t.category_slug === c.slug && 
                    t.completed && 
                    t.completed_at && 
                    new Date(t.completed_at).toDateString() === now.toDateString()
                ).length;
                
                if (c.slug !== ARCHIVE && completedToday === 0) {
                    c.currentWeight *= 1.5;
                }
            });

            // Normalize weights
            const totalWeight = this.categories.reduce((acc, c) => acc + c.currentWeight, 0);
            if (totalWeight > 0) {
                this.categories.forEach(c => {
                    c.currentWeight /= totalWeight;
                });
            }

            // 3. Calculate task priorities
            const catsMap = Object.fromEntries(this.categories.map(c => [c.slug, c]));
            this.tasks.forEach(t => {
                if (!t.completed) {
                    t.calculatedPriority = this.calcPriority(t, catsMap);
                } else {
                    t.calculatedPriority = 0;
                }
            });
        },

        /**
         * Calculate priority for a single task based on complex formula.
         */
        calcPriority(t, catsMap) {
            const cat = catsMap[t.category_slug];
            if (!cat) return 0;

            let s = cat.currentWeight * parseFloat(t.importance);
            
            if (t.subcategory && this.subcatCoeffs[t.subcategory]) {
                s *= this.subcatCoeffs[t.subcategory];
            }

            if (this.isEffectivelyPostponed(t)) {
                s *= 0.7;
            }

            if (t.missed_count > 0) {
                s *= (1 + t.missed_count * 0.5);
            }

            if (t.deadline) {
                const n = new Date();
                const d = new Date(t.deadline);
                const diff = Math.ceil((d - n) / 86400000);
                if (diff < 0) s += 5;
                else if (diff === 0) s += 4;
                else if (diff <= 2) s += 3;
                else if (diff <= 7) s += 1;
            }

            return s;
        },

        isCategoryPostponed(catSlug) {
            const cat = this.categories.find(c => c.slug === catSlug);
            if (!cat || !cat.hide_until) return false;
            const now = new Date();
            const [h, m] = cat.hide_until.split(':').map(Number);
            if (isNaN(h) || isNaN(m)) return false;
            const hideTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
            return now < hideTime;
        },

        isEffectivelyPostponed(t) {
            if (t.postpone_until) {
                const p = new Date(t.postpone_until);
                if (p > new Date()) return true;
            }
            if (!t.force_active && this.isCategoryPostponed(t.category_slug)) return true;
            return false;
        },

        isHidden(t) {
            if (!t.hidden_until) return false;
            return new Date(t.hidden_until) > new Date();
        },

        async addTask(taskData) {
            const res = await axios.post('tasks', taskData);
            this.tasks.push(res.data);
            this.recalculateAll();
        },

        async completeTask(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t || t.completed) return;

            if (t.repeat_type === 'none') {
                const completedAt = new Date().toISOString();
                await axios.post(`tasks/${id}`, { 
                    _method: 'PUT',
                    completed: true, 
                    completed_at: completedAt 
                });
                t.completed = true;
                t.completed_at = completedAt;
                t.missed_count = 0;
            } else {
                const now = new Date();
                const dateLocale = this.locale === 'ru' ? 'ru-RU' : 'en-US';
                const dateStr = now.toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                const newNotes = (t.notes ? t.notes + '\n' : '') + '✔ ' + dateStr;
                
                let nextDate = new Date();
                if (t.repeat_type === 'interval') {
                    nextDate.setDate(nextDate.getDate() + (parseInt(t.repeat_interval) || 1));
                } else if (t.repeat_type === 'weekly' && t.repeat_days && t.repeat_days.length) {
                    nextDate.setDate(nextDate.getDate() + 1);
                    while (!t.repeat_days.includes(nextDate.getDay())) {
                        nextDate.setDate(nextDate.getDate() + 1);
                    }
                }

                const hiddenUntil = nextDate.toISOString();
                const lastCompletedDate = now.toISOString();

                await axios.post(`tasks/${id}`, {
                    _method: 'PUT',
                    notes: newNotes,
                    hidden_until: hiddenUntil,
                    last_completed_date: lastCompletedDate,
                    missed_count: 0
                });

                t.notes = newNotes;
                t.hidden_until = hiddenUntil;
                t.last_completed_date = lastCompletedDate;
                t.missed_count = 0;
            }
            this.recalculateAll();
        },

        async deleteTask(id) {
            await axios.post(`tasks/${id}?_method=DELETE`);
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.recalculateAll();
        },

        async restoreTask(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;
            
            await axios.post(`tasks/${id}`, {
                _method: 'PUT',
                completed: false,
                completed_at: null,
                hidden_until: null
            });

            t.completed = false;
            t.completed_at = null;
            t.hidden_until = null;
            this.recalculateAll();
        },

        async returnNow(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;
            
            await axios.post(`tasks/${id}`, {
                _method: 'PUT',
                hidden_until: null
            });

            t.hidden_until = null;
            this.recalculateAll();
        }
    }
});
