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
 * @param {Date} [now] - Reference instant; pass one to keep a whole pass on a single clock reading.
 * @returns {number} The calculated priority value.
 */
export function calcPriority(task, catsMap, subcatCoeffs = {}, now = new Date()) {
    const cat = catsMap[task.category_slug];
    if (!cat) return 0;

    let s = (cat.currentWeight || 0.1) * parseFloat(task.importance || 1);

    if (task.subcategory && subcatCoeffs[task.subcategory]) {
        s *= subcatCoeffs[task.subcategory];
    }

    if (isEffectivelyPostponed(task, catsMap, now)) {
        s *= 0.7;
    }

    if (task.deadline) {
        const d = new Date(task.deadline);
        const diff = Math.ceil((d - now) / 86400000);
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
 * Whole calendar days between a deadline and `now`, counting from midnight to midnight.
 *
 * Deliberately the same truncation `missed_count` uses below: a deadline that passed at
 * 10:00 today reads as 0 until tomorrow. Consistent with the repeat counter beats
 * precise-but-inconsistent, and both feed the same `(N)` badge.
 *
 * @param {Object} task
 * @param {Date} now
 * @returns {number}
 */
export function overdueDays(task, now = new Date()) {
    if (task.completed || !task.deadline) return 0;
    const deadline = new Date(task.deadline);
    if (isNaN(deadline)) return 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    return Math.max(0, Math.floor((today - deadlineDay) / 86400000));
}

/**
 * Recalculate all tasks in the store.
 */
export function recalculateTasks(tasks, categories, subcatCoeffs, now = new Date()) {
    // Materialise the derived per-task state first, at one shared `now`, so every layer renders
    // the same thing. Three reasons it happens before the early return: the view layer reads
    // these fields unconditionally (an empty category list must not leave them undefined), each
    // component re-deriving the predicate from its own `new Date()` is what let the list and the
    // charts disagree (#158, #161), and the counters below are the input to `days_overdue`, so
    // they cannot stay behind the early return any more. It also never expired live — `new
    // Date()` is not a reactive dependency, so cached computeds never invalidated. Mutating
    // these properties is what the pulse propagates.
    const catsMap = Object.fromEntries((categories || []).map(c => [c.slug, c]));

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
                const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                t.missed_count = Math.max(0, Math.floor((nowDay - dueDay) / 86400000));
            }
        }
    });

    // 2. Postponed state and the overdue counter
    tasks.forEach(t => {
        t.postponed = isEffectivelyPostponed(t, catsMap, now);
        // A repeat that has missed occurrences is overdue by definition, even without a
        // deadline; otherwise the deadline decides. Never both added up — they describe the
        // same lateness, and summing them would double-count a repeating task with a deadline.
        // `completed` wins over both: a finished task is not overdue, and `missed_count` is
        // left stale on the pass that follows a completion.
        t.days_overdue = t.completed ? 0 : Math.max(overdueDays(t, now), t.missed_count || 0);
    });

    if (!categories || !categories.length) return tasks;

    // 3. Dynamic weights
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
    // Since currentWeight is always initialized to at least 0.1, totalWeight is guaranteed to be > 0 if categories is not empty.
    categories.forEach(c => {
        c.currentWeight /= totalWeight;
    });

    // 4. Priorities
    tasks.forEach(t => {
        t.calculatedPriority = t.completed ? 0 : calcPriority(t, catsMap, subcatCoeffs, now);
    });

    return tasks;
}
