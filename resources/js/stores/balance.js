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
        user: null,
        token: localStorage.getItem('auth_token') || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        googleAuthUrl: () => (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/google',
        allSubcats: (state) => Object.keys(state.subcatCoeffs),

        activeTasks: (state) => {
            const now = new Date();
            return state.tasks.filter(t => {
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > now) return false;
                return true;
            }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        },

        bubbleTasks: (state) => {
            const active = state.tasks.filter(t => {
                const now = new Date();
                if (t.completed) return false;
                if (t.hidden_until && new Date(t.hidden_until) > now) return false;
                return true;
            }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);

            if (state.filterCat === 'all') return active;
            if (state.filterCat === 'archive' || state.filterCat === 'hidden') return [];
            return active.filter(t => t.category_slug === state.filterCat);
        },

        filteredTasks: (state) => {
            const now = new Date();
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

            return tasks.sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        }
    },

    actions: {
        /**
         * Initialize the store, check for auth tokens and user data.
         */
        async init() {
            // Check for token in URL (after Google redirect)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');
            if (tokenFromUrl) {
                this.token = tokenFromUrl;
                localStorage.setItem('auth_token', tokenFromUrl);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (this.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                try {
                    const res = await axios.get('user');
                    this.user = res.data;
                } catch (e) {
                    this.logout();
                }
            }
            await this.fetchAll();
        },

        /**
         * Log out the current user and clear local state.
         */
        async logout() {
            if (this.token) {
                try {
                    await axios.post('logout');
                } catch (e) {}
            }
            this.token = null;
            this.user = null;
            localStorage.removeItem('auth_token');
            delete axios.defaults.headers.common['Authorization'];
            this.tasks = [];
            await this.fetchAll();
        },

        /**
         * Fetch all user data (tasks, categories, settings) from API.
         */
        async fetchAll() {
            this.loading = true;
            try {
                const [tasksRes, catsRes, settingsRes] = await Promise.all([
                    axios.get('tasks'),
                    axios.get('categories'),
                    axios.get('settings')
                ]);
                this.categories = catsRes.data;
                this.tasks = tasksRes.data;
                this.notepadText = settingsRes.data.notepad_text || '';
                
                // Get subcat coeffs from export/stats endpoint for simplicity
                const subRes = await axios.get('export');
                this.subcatCoeffs = subRes.data.subcatCoeffs || {};
                
                this.recalculateAll();
            } catch (e) {
                console.error('Fetch error:', e);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Main engine: recalculate all task priorities and dynamic category weights.
         */
        recalculateAll() {
            const now = new Date();
            if (!this.categories || !this.categories.length) return;

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
                await axios.put(`tasks/${id}`, { 
                    completed: true, 
                    completed_at: completedAt 
                });
                t.completed = true;
                t.completed_at = completedAt;
                t.missed_count = 0;
            } else {
                const now = new Date();
                const dateStr = now.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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

                await axios.put(`tasks/${id}`, {
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
            await axios.delete(`tasks/${id}`);
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.recalculateAll();
        },

        async restoreTask(id) {
            const t = this.tasks.find(x => x.id === id);
            if (!t) return;
            
            await axios.put(`tasks/${id}`, {
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
            
            await axios.put(`tasks/${id}`, {
                hidden_until: null
            });

            t.hidden_until = null;
            this.recalculateAll();
        }
    }
});
