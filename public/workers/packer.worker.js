/**
 * Bubble Packer Web Worker
 * 
 * Advanced version with Inter-group Attraction and Iterative Tightening.
 */

self.onmessage = function(e) {
    const { central, side, W, H, isMobile, padding, mode } = e.data;
    const minGap = 15; // Minimum gap between groups
    
    const isOverlap = (x, y, r, placed) => {
        for (let j = 0; j < placed.length; j++) {
            const p = placed[j];
            const dx = x - p.x, dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < r + p.r + 2) return true;
        }
        return false;
    };

    const packGroup = (tasks, centerX, centerY, scale, bounds = null) => {
        if (!tasks.length) return [];
        
        const sizedTasks = tasks.map(item => ({ id: item.id, r: item.r * scale, pri: item.pri }))
                                .sort((a, b) => b.r - a.r);
        const placed = [];
        
        for (let i = 0; i < sizedTasks.length; i++) {
            const it = sizedTasks[i];
            let r = it.r, found = false, bestX, bestY;
            
            // Search in expanding spiral
            for (let dist = 0; dist <= 1000; dist += 2) {
                const steps = Math.max(8, Math.floor(2 * Math.PI * dist / (r * 0.6)));
                for (let step = 0; step < steps; step++) {
                    const ang = (step / steps) * 2 * Math.PI;
                    const x = centerX + Math.cos(ang) * dist, y = centerY + Math.sin(ang) * dist;
                    
                    // If bounds provided, check them
                    if (bounds && (x - r < bounds.left || x + r > bounds.right || y - r < bounds.top || y + r > bounds.bottom)) continue;
                    
                    if (!isOverlap(x, y, r, placed)) { 
                        bestX = x; bestY = y; found = true; break; 
                    }
                }
                if (found) break;
            }
            if (found) {
                placed.push({ x: bestX, y: bestY, r: r, id: it.id, size: r * 2 });
            }
        }

        // Internal Tightening
        for (let pass = 0; pass < 15; pass++) {
            let movedAny = false;
            for (let i = 0; i < placed.length; i++) {
                const p = placed[i];
                const dx = centerX - p.x, dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 2) continue;

                const nx = p.x + (dx / dist) * 2, ny = p.y + (dy / dist) * 2;
                let collision = false;
                for (let j = 0; j < placed.length; j++) {
                    if (i === j) continue;
                    const other = placed[j];
                    if (Math.sqrt(Math.pow(nx - other.x, 2) + Math.pow(ny - other.y, 2)) < p.r + other.r + 2) {
                        collision = true; break;
                    }
                }
                if (!collision) { p.x = nx; p.y = ny; movedAny = true; }
            }
            if (!movedAny) break;
        }
        return placed;
    };

    const getBounds = (placed) => {
        if (!placed.length) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        placed.forEach(p => {
            minX = Math.min(minX, p.x - p.r);
            maxX = Math.max(maxX, p.x + p.r);
            minY = Math.min(minY, p.y - p.r);
            maxY = Math.max(maxY, p.y + p.r);
        });
        return { left: minX, right: maxX, top: minY, bottom: maxY, width: maxX - minX, height: maxY - minY };
    };

    // 1. Independent Packing
    const scale = 1.0;
    
    if (mode === 'single') {
        let placed = packGroup(central, W / 2, H / 2, scale);
        if (placed.length) {
            const b = getBounds(placed);
            const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;
            const availW = W - padding * 2, availH = H - padding * 2;
            const autoScale = Math.min(availW / b.width, availH / b.height);
            
            placed = placed.map(p => {
                const nx = W / 2 + (p.x - cx) * autoScale;
                const ny = H / 2 + (p.y - cy) * autoScale;
                const nr = p.r * autoScale;
                return { x: nx, y: ny, r: nr, id: p.id, size: nr * 2 };
            });
        }
        self.postMessage({ bubblePositions: placed });
        return;
    }

    const isPortrait = H > W;
    const centralTasks = central;
    const side1Tasks = [], side2Tasks = [];
    side.forEach((s, i) => i % 2 === 0 ? side1Tasks.push(s) : side2Tasks.push(s));

    let centralPlaced = packGroup(centralTasks, W / 2, H / 2, scale);
    
    // Initial guess positions based on orientation
    const side1X = isPortrait ? W / 2 : W / 4;
    const side1Y = isPortrait ? H / 4 : H / 2;
    const side2X = isPortrait ? W / 2 : 3 * W / 4;
    const side2Y = isPortrait ? 3 * H / 4 : H / 2;

    let topOrLeftPlaced = packGroup(side1Tasks, side1X, side1Y, scale);
    let botOrRightPlaced = packGroup(side2Tasks, side2X, side2Y, scale);

    // 2. Inter-group Attraction
    const cB = getBounds(centralPlaced);

    if (isPortrait) {
        // Vertical Attraction (Portrait)
        if (topOrLeftPlaced.length) {
            const tB = getBounds(topOrLeftPlaced);
            const shiftY = cB.top - minGap - tB.bottom;
            topOrLeftPlaced.forEach(p => p.y += shiftY);
        }
        if (botOrRightPlaced.length) {
            const bB = getBounds(botOrRightPlaced);
            const shiftY = cB.bottom + minGap - bB.top;
            botOrRightPlaced.forEach(p => p.y += shiftY);
        }
    } else {
        // Horizontal Attraction (Landscape)
        if (topOrLeftPlaced.length) {
            const lB = getBounds(topOrLeftPlaced);
            const shiftX = cB.left - minGap - lB.right;
            topOrLeftPlaced.forEach(p => p.x += shiftX);
        }
        if (botOrRightPlaced.length) {
            const rB = getBounds(botOrRightPlaced);
            const shiftX = cB.right + minGap - rB.left;
            botOrRightPlaced.forEach(p => p.x += shiftX);
        }
    }

    // 3. Global Auto-Zoom to fill viewport
    let allPlaced = [...centralPlaced, ...topOrLeftPlaced, ...botOrRightPlaced];
    if (allPlaced.length) {
        const fullB = getBounds(allPlaced);
        const cx = (fullB.left + fullB.right) / 2, cy = (fullB.top + fullB.bottom) / 2;
        const availW = W - padding * 2, availH = H - padding * 2;
        const autoScale = Math.min(availW / fullB.width, availH / fullB.height);
        
        // Final transform: center and maximize
        allPlaced = allPlaced.map(p => {
            const nx = W / 2 + (p.x - cx) * autoScale;
            const ny = H / 2 + (p.y - cy) * autoScale;
            const nr = p.r * autoScale;
            return { x: nx, y: ny, r: nr, id: p.id, size: nr * 2 };
        });
    }

    self.postMessage({ bubblePositions: allPlaced });
};
