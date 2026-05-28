/**
 * Bubble Packer Web Worker
 * 
 * Separates heavy circle packing calculations from the main UI thread.
 */

self.onmessage = function(e) {
    const { central, side, W, H, isMobile, padding } = e.data;
    
    const isOverlap = (x, y, r, placed) => {
        for (let j = 0; j < placed.length; j++) {
            const p = placed[j];
            const dx = x - p.x, dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < r + p.r + 2) return true;
        }
        return false;
    };

    const packGroup = (tasks, left, top, right, bottom, scale) => {
        const width = right - left, height = bottom - top;
        const centerX = left + width / 2, centerY = top + height / 2;
        const sizedTasks = tasks.map(item => ({ id: item.id, r: item.r * scale, pri: item.pri }))
                                .sort((a, b) => b.r - a.r);
        const placed = [];
        for (let i = 0; i < sizedTasks.length; i++) {
            const it = sizedTasks[i];
            let r = it.r, found = false, bestX, bestY;
            const maxDistX = width / 2 - r - padding, maxDistY = height / 2 - r - padding;
            const maxDist = Math.min(maxDistX, maxDistY);
            
            for (let dist = 0; dist <= maxDist; dist += 2) {
                const steps = Math.max(8, Math.floor(2 * Math.PI * dist / (r * 0.6)));
                for (let step = 0; step < steps; step++) {
                    const ang = (step / steps) * 2 * Math.PI;
                    const x = centerX + Math.cos(ang) * dist, y = centerY + Math.sin(ang) * dist;
                    if (x - r < left + padding || x + r > right - padding || y - r < top + padding || y + r > bottom - padding) continue;
                    if (!isOverlap(x, y, r, placed)) { bestX = x; bestY = y; found = true; break; }
                }
                if (found) break;
            }
            if (!found) {
                let shrunk = false;
                for (let shrink = 0; shrink <= r * 0.2; shrink += 2) {
                    let newR = r - shrink;
                    if (newR < 10) break;
                    const maxDist2 = Math.min(width/2 - newR - padding, height/2 - newR - padding);
                    for (let dist2 = 0; dist2 <= maxDist2; dist2 += 2) {
                        const steps2 = Math.max(8, Math.floor(2 * Math.PI * dist2 / (newR * 0.6)));
                        for (let step2 = 0; step2 < steps2; step2++) {
                            const ang2 = (step2 / steps2) * 2 * Math.PI;
                            const x2 = centerX + Math.cos(ang2) * dist2, y2 = centerY + Math.sin(ang2) * dist2;
                            if (x2 - newR < left + padding || x2 + newR > right - padding || y2 - newR < top + padding || y2 + newR > bottom - padding) continue;
                            if (!isOverlap(x2, y2, newR, placed)) { bestX = x2; bestY = y2; r = newR; found = shrunk = true; break; }
                        }
                        if (shrunk) break;
                    }
                    if (shrunk) break;
                }
                if (!shrunk) return null;
            }
            placed.push({ x: bestX, y: bestY, r: r, id: it.id, size: r * 2 });
        }
        return placed;
    };

    let bestPlaced = null, scale = 1.2;

    while (scale > 0.3) {
        let centralPlaced = [], leftPlaced = [], rightPlaced = [], ok = true;

        if (isMobile) {
            const hPart = (H - padding * 2) / 3;
            const side1 = [], side2 = [];
            side.forEach((s, i) => i % 2 === 0 ? side1.push(s) : side2.push(s));
            
            let topPlaced = [], midPlaced = [], botPlaced = [];
            
            if (side1.length > 0) {
                topPlaced = packGroup(side1, padding, padding, W - padding, padding + hPart, scale);
                if (!topPlaced) ok = false;
            }
            if (ok && central.length > 0) {
                midPlaced = packGroup(central, padding, padding + hPart, W - padding, padding + hPart * 2, scale);
                if (!midPlaced) ok = false;
            }
            if (ok && side2.length > 0) {
                botPlaced = packGroup(side2, padding, padding + hPart * 2, W - padding, H - padding, scale);
                if (!botPlaced) ok = false;
            }
            
            if (ok) {
                centralPlaced = (topPlaced || []).concat(midPlaced || [], botPlaced || []);
            }
        } else {
            if (central.length > 0) {
                centralPlaced = packGroup(central, (W - W * 0.4) / 2, padding, (W + W * 0.4) / 2, H - padding, scale);
                if (!centralPlaced) ok = false;
            }
            if (!ok) { scale -= 0.02; continue; }

            const cLeft = (W - W * 0.4) / 2, cRight = (W + W * 0.4) / 2;
            if (side.length > 0) {
                const leftTasks = [], rightTasks = [];
                side.forEach((s, i) => i % 2 === 0 ? leftTasks.push(s) : rightTasks.push(s));
                if (leftTasks.length > 0) {
                    leftPlaced = packGroup(leftTasks, padding, padding, cLeft - padding, H - padding, scale);
                    if (!leftPlaced) ok = false;
                }
                if (ok && rightTasks.length > 0) {
                    rightPlaced = packGroup(rightTasks, cRight + padding, padding, W - padding, H - padding, scale);
                    if (!rightPlaced) ok = false;
                }
            }
        }
        
        if (!ok) { scale -= 0.02; continue; }

        let allPlaced = (centralPlaced || []).concat(leftPlaced || [], rightPlaced || []);
        
        if (!isMobile && allPlaced.length > 0) {
            let cLA, cRA;
            if (centralPlaced && centralPlaced.length > 0) {
                let minCX = Infinity, maxCX = -Infinity;
                centralPlaced.forEach(p => {
                    if (p.x - p.r < minCX) minCX = p.x - p.r;
                    if (p.x + p.r > maxCX) maxCX = p.x + p.r;
                });
                cLA = minCX; cRA = maxCX;
            } else {
                cLA = W / 2; cRA = W / 2;
            }
            const smallestD = Math.min(...allPlaced.map(p => p.r * 2), 10);
            if (leftPlaced && leftPlaced.length > 0) {
                const maxRL = Math.max(...leftPlaced.map(p => p.x + p.r));
                let dx = cLA - smallestD - maxRL;
                if (dx > 0) {
                    const minLeftA = Math.min(...leftPlaced.map(p => p.x + dx - p.r));
                    if (minLeftA < padding) dx -= (padding - minLeftA);
                    if (dx > 0) leftPlaced.forEach(p => { p.x += dx; });
                }
            }
            if (rightPlaced && rightPlaced.length > 0) {
                const minLR = Math.min(...rightPlaced.map(p => p.x - p.r));
                let dx = cRA + smallestD - minLR;
                if (dx < 0) {
                    let shift = -dx;
                    const maxRA = Math.max(...rightPlaced.map(p => p.x - shift + p.r));
                    if (maxRA > W - padding) shift -= (maxRA - (W - padding));
                    if (shift > 0) rightPlaced.forEach(p => { p.x -= shift; });
                }
            }
        }

        allPlaced = (centralPlaced || []).concat(leftPlaced || [], rightPlaced || []);
        if (allPlaced.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            allPlaced.forEach(p => {
                if (p.x - p.r < minX) minX = p.x - p.r;
                if (p.x + p.r > maxX) maxX = p.x + p.r;
                if (p.y - p.r < minY) minY = p.y - p.r;
                if (p.y + p.r > maxY) maxY = p.y + p.r;
            });
            const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
            const usedW = maxX - minX, usedH = maxY - minY;
            if (usedW > 0 && usedH > 0) {
                const availW = W - padding * 2, availH = H - padding * 2;
                const zoom = Math.min(availW / usedW, availH / usedH);
                if (zoom > 1.0) {
                    allPlaced = allPlaced.map(p => {
                        let nx = W / 2 + (p.x - cx) * zoom;
                        let ny = H / 2 + (p.y - cy) * zoom;
                        let nr = p.r * zoom;
                        nx = Math.max(padding + nr, Math.min(W - padding - nr, nx));
                        ny = Math.max(padding + nr, Math.min(H - padding - nr, ny));
                        return { x: nx, y: ny, r: nr, id: p.id, size: nr * 2 };
                    });
                }
            }
        }
        bestPlaced = allPlaced;
        break;
    }
    
    self.postMessage({ bubblePositions: bestPlaced || [] });
};
