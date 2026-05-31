/**
 * Color utility functions for Balance.Daily
 */

/**
 * Converts a hex color string to rgba format.
 * 
 * @param {string} hex - Hex color string (e.g., '#ff0000' or 'ff0000')
 * @param {number} alpha - Alpha transparency (0 to 1)
 * @returns {string} rgba color string
 */
export function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(150, 150, 150, ${alpha})`;
    
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
