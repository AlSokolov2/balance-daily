/**
 * Task engine module — CRUD, sync, pulse, push, priority helpers.
 * Plain functions that operate on a store instance.
 *
 * @see #129 — Split monolith store
 */
import axios from 'axios';
import { recalculateTasks, isEffectivelyPostponed as isEffectivelyPostponedUtil, isCategoryPostponed as isCategoryPostponedUtil } from '../utils/priority-engine';
import { urlBase64ToUint8Array } from './auth.js';

// ── Data & Sync ──

export async function fetchAll(store) {
    await sync(store, true);
}

export async function fetchStats(store) {
    if (!store.token) return;
    try {
        const res = await axios.get('stats');
        store.stats = res.data;
    } catch (e) {
        console.error('Fetch stats error:', e);
    }
}

export async function sync(store, forceFull = false) {
    store.loading = true;
    try {
        const params = {};
        if (!forceFull && store.lastSync && store.tasks.length > 0) {
            params.since = store.lastSync;
        } else {
            forceFull = true;
        }
        const res = await axios.get('sync', { params });
        const d = res.data;
        mergeCollection(store, 'tasks', d.tasks, forceFull);
        mergeCollection(store, 'categories', d.categories, forceFull);
        if (d.settings) {
            store.notepadText = d.settings.notepad_text || store.notepadText;
            store.theme = d.settings.theme || store.theme;
            store.locale = d.settings.locale || store.locale;
            store.pulseInterval = parseInt(d.settings.pulse_interval) || store.pulseInterval;
        }
        if (d.subcatCoeffs) store.subcatCoeffs = d.subcatCoeffs;
        store.lastSync = d.server_time;
        localStorage.setItem('last_sync', store.lastSync);
        recalculateAll(store);
        store.applyTheme();
    } catch (e) {
        console.error('Sync error:', e);
    } finally {
        store.loading = false;
    }
}

export function mergeCollection(store, key, data, isFull) {
    if (!data) return;
    if (isFull) {
        store[key] = Array.isArray(data.updated) ? data.updated : [];
    } else {
        if (Array.isArray(data.updated)) {
            data.updated.forEach(u => {
                const idx = store[key].findIndex(x => x.id === u.id);
                if (idx !== -1) store[key][idx] = u;
                else store[key].push(u);
            });
        }
        if (Array.isArray(data.deleted)) {
            store[key] = store[key].filter(x => !data.deleted.includes(x.id));
        }
    }
}

// ── Task CRUD ──

export async function addTask(store, taskData) {
    const res = await axios.post('tasks', taskData);
    store.tasks.push(res.data);
    recalculateAll(store);
}

export async function deleteTask(store, id) {
    await axios.delete(`tasks/${id}`);
    store.tasks = store.tasks.filter(x => x.id !== id);
    recalculateAll(store);
}

export async function updateTask(store, id, payload) {
    const t = store.tasks.find(x => x.id === id);
    if (!t) return;
    const isRecurring = (payload.repeat_type && payload.repeat_type !== 'none') ||
                      (!payload.repeat_type && t.repeat_type && t.repeat_type !== 'none');
    if (payload.completed && isRecurring) {
        const n = calculateNextOccurrence(t, payload);
        payload.completed = false;
        payload.completed_at = null;
        payload.hidden_until = n.hidden_until;
        payload.last_completed_date = n.last_completed_date;
        payload.missed_count = 0;
        payload._was_completed = true;
    }
    const res = await axios.put(`tasks/${id}`, payload);
    const idx = store.tasks.findIndex(x => x.id === id);
    if (idx !== -1) store.tasks[idx] = res.data;
    recalculateAll(store);
}

export async function completeTask(store, id) {
    const t = store.tasks.find(x => x.id === id);
    if (!t || t.completed) return;
    await updateTask(store, id, { completed: true, completed_at: new Date().toISOString(), missed_count: 0 });
}

export async function archiveTask(store, id) {
    await axios.put(`tasks/${id}`, { completed: true, completed_at: new Date().toISOString(), _skip_history: true });
    store.tasks = store.tasks.filter(x => x.id !== id);
    recalculateAll(store);
}

export async function restoreTask(store, id) {
    await updateTask(store, id, { completed: false, completed_at: null, hidden_until: null, postpone_until: null });
}

export async function returnNow(store, id) {
    await updateTask(store, id, { hidden_until: null, postpone_until: null });
}

// ── Push ──

export async function toggleNotifications(store) {
    if (store.notificationsEnabled) {
        await store.unsubscribeFromPush();
    } else {
        await store.subscribeToPush();
    }
}

export async function subscribeToPush(store) {
    try {
        const r = await navigator.serviceWorker.ready;
        const key = __VAPID_PUBLIC_KEY__;
        if (!key) throw new Error('VAPID key');
        const sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
        const p = JSON.parse(JSON.stringify(sub));
        await axios.post('push-subscriptions', { endpoint: p.endpoint, public_key: p.keys.p256dh, auth_token: p.keys.auth });
        store.notificationsEnabled = true;
        localStorage.setItem('notifications_enabled', 'true');
    } catch (e) {
        console.error('Push subscription failed:', e);
        window.alert('Не удалось включить уведомления.');
    }
}

export async function unsubscribeFromPush(store) {
    try {
        const r = await navigator.serviceWorker.ready;
        const sub = await r.pushManager.getSubscription();
        if (sub) {
            await axios.delete('push-subscriptions', { data: { endpoint: sub.endpoint } });
            await sub.unsubscribe();
        }
        store.notificationsEnabled = false;
        localStorage.setItem('notifications_enabled', 'false');
    } catch (e) {
        console.error('Push unsubscription failed:', e);
    }
}

// ── Pulse ──

export function startPulse(store) {
    stopPulse(store);
    if (store.pulseInterval <= 0) return;
    store.pulseTimer = window.setInterval(() => {
        const today = new Date().toDateString();
        if (today !== store.lastPulse) {
            store.lastPulse = today;
            store.fetchAll();
        } else {
            store.recalculateAll();
        }
        checkReminders(store);
    }, store.pulseInterval * 60000);
}

export function stopPulse(store) {
    if (store.pulseTimer) {
        window.clearInterval(store.pulseTimer);
        store.pulseTimer = null;
    }
}

export function recalculateAll(store) {
    store.tasks = recalculateTasks(store.tasks, store.categories, store.subcatCoeffs);
}

export function checkReminders(store) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const now = new Date();
    const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    store.tasks.forEach(t => {
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
}

// ── Priority helpers ──

/**
 * Calculate next occurrence date for recurring tasks.
 * Pure function — does not access store.
 */
export function calculateNextOccurrence(t, payload = {}) {
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
}

export function isCategoryPostponedFn(store, slug) {
    return isCategoryPostponedUtil(store.categories.find(c => c.slug === slug));
}

export function isEffectivelyPostponedFn(store, t) {
    return isEffectivelyPostponedUtil(t, Object.fromEntries(store.categories.map(c => [c.slug, c])));
}

export function isHiddenFn(t) {
    return t.hidden_until && new Date(t.hidden_until) > new Date();
}
