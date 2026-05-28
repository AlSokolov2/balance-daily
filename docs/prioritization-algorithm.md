# Prioritization & Visualization Algorithm

The core feature of **Balance.Daily** is its ability to automatically manage user focus through dynamic task priorities.

## 🧬 Task Priority Calculation

Task priority (`calculatedPriority`) is computed in the Pinia Store every time data is loaded or modified. To ensure a smooth UI experience, these calculations are offloaded to **Web Workers** where appropriate.

The base formula is:

`P = (CategoryWeight * Importance * SubcategoryCoeff * PostponePenalty * MissedBoost) + DeadlineBonus`

### 1. Category Weight (CategoryWeight)
Each category has a base weight (e.g., Work — 0.5, Home — 0.2).
*   **Dynamic Boost:** If a category has **zero** completed tasks today, its weight is temporarily multiplied by **1.5**. This pushes the system to "nudge" you toward neglected areas of your life.
*   **Normalization:** After all adjustments, the sum of all category weights is normalized to 1.0 (100%).

### 2. Importance
Defined by the user during task creation:
*   Very High: 4.0
*   High: 3.0
*   Medium: 2.0
*   Low: 1.0

### 3. Penalties & Bonuses
*   **Postponement:** If a task is postponed (`postpone_until`), its priority is multiplied by **0.7**.
*   **Overdue Days:** For recurring tasks, priority grows as days are missed: `*(1 + missed_days * 0.5)`.
*   **Deadlines:**
    *   Overdue: +5.0
    *   Due Today: +4.0
    *   1-2 days remaining: +3.0
    *   Up to a week remaining: +1.0

### 4. Real-time Updates (The Pulse)
The application maintains a **1-minute pulse**. Every minute, the store triggers a re-calculation of all priorities. This ensures that approaching deadlines and the expiration of "postpone" or "hidden" timers are reflected on the chart without requiring a page refresh.

---

## 🔮 Visualization (Bubble Chart)

The circle packing algorithm is executed in a **Web Worker** to prevent blocking the main UI thread. It works as follows:

1.  **Size:** Bubble diameter is directly proportional to the `calculatedPriority` value.
2.  **Grouping:** 
    *   **Center:** Primary active tasks.
    *   **Side:** Tasks marked as "High Attention" (HA) or postponed tasks.
3.  **Iterative Tightening:** The algorithm performs multiple passes to find the most dense packing without overlaps. It uses a "repulsion" force between bubbles and an "attraction" force toward the center of their respective groups.
4.  **Auto-Scaling:** If the total area of bubbles exceeds the viewport, the system automatically reduces the global scale until they fit perfectly.
5.  **Interactivity:** Supports **Pinch-to-Zoom** and **Drag** gestures for detailed inspection on mobile devices.
