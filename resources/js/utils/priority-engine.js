/**
 * Balance.Daily Priority Engine
 * Handles complex task prioritization and category weight calculations.
 */

/**
 * Calculate priority for a single task.
 *
 * @param {Object} task - The task object.
 * @param {Object} catsMap - Map of category slugs to category objects with currentWeight.
 * @param {Object} subcatCoeffs - Map of subcategory names to coefficients.
 * @returns {number} The calculated priority value.
 */
export function calcPriority(task, catsMap, subcatCoeffs = {}) {
    const cat = catsMap[task.category_slug];
    if (!cat) return 0;

    let s = (cat.currentWeight || 0.1) * parseFloat(task.importance || 1);

    if (task.subcategory && subcatCoeffs[task.subcategory]) {
        s *= subcatCoeffs[task.subcategory];
    }

    if (isEffectivelyPostponed(task, catsMap)) {
        s *= 0.7;
    }

    if (task.deadline) {
        const n = new Date();
        const d = new Date(task.deadline);
        const diff = Math.ceil((d - n) / 86400000);
        if (diff < 0) s += 5;
        else if (diff === 0) s += 4;
        else if (diff <= 2) s += 3;
        else if (diff <= 7) s += 1;
    }

    return s;
}

/**
 * Check if a category is currently hidden/postponed.
 */
export function isCategoryPostponed(cat, now = new Date()) {
    if (!cat || !cat.hide_until) return false;
    const [h, m] = cat.hide_until.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const hideTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return now < hideTime;
}

/**
 * Check if a task is effectively postponed (by its own date or its category).
 */
export function isEffectivelyPostponed(task, catsMap, now = new Date()) {
    if (task.postpone_until && new Date(task.postpone_until) > now) {
        return true;
    }
    const cat = catsMap[task.category_slug];
    return !task.force_active && isCategoryPostponed(cat, now);
}

/**
 * Recalculate all tasks in the store.
 */
export function recalculateTasks(tasks, categories, subcatCoeffs, now = new Date()) {
    if (!categories || !categories.length) return tasks;

    // 1. Missed counts for repeats
    tasks.forEach(t => {
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
        }
    });

    // 2. Dynamic weights
    const ARCHIVE = '__archive__';
    categories.forEach(c => {
        c.currentWeight = parseFloat(c.weight) || 0.1;
        const completedToday = tasks.filter(t =>
            t.category_slug === c.slug &&
            t.completed &&
            t.completed_at &&
            new Date(t.completed_at).toDateString() === now.toDateString()
        ).length;

        if (c.slug !== ARCHIVE && completedToday === 0) {
            c.currentWeight *= 1.5;
        }
    });

    const totalWeight = categories.reduce((acc, c) => acc + c.currentWeight, 0);
    if (totalWeight > 0) {
        categories.forEach(c => {
            c.currentWeight /= totalWeight;
        });
    }

    // 3. Priorities
    const catsMap = Object.fromEntries(categories.map(c => [c.slug, c]));
    tasks.forEach(t => {
        t.calculatedPriority = t.completed ? 0 : calcPriority(t, catsMap, subcatCoeffs);
    });

    return tasks;
}
