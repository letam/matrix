/**
 * Corner detection utility for identifying if a mouse position is in a corner region.
 * Corners are defined as areas within cornerSize pixels from two adjacent edges.
 */

/**
 * Checks if the given coordinates are within a corner region of the window.
 * @param {number} x - Mouse X coordinate
 * @param {number} y - Mouse Y coordinate
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @param {number} cornerSize - Size of corner region in pixels (default: 150)
 * @returns {boolean} True if position is in a corner region
 */
export function isInCorner(x, y, width, height, cornerSize = 150) {
	const inLeftEdge = x < cornerSize;
	const inRightEdge = x > width - cornerSize;
	const inTopEdge = y < cornerSize;
	const inBottomEdge = y > height - cornerSize;

	// Must be within two adjacent edges to be in a corner
	return (inLeftEdge || inRightEdge) && (inTopEdge || inBottomEdge);
}

/**
 * Gets the corner position (for debugging or styling).
 * @param {number} x - Mouse X coordinate
 * @param {number} y - Mouse Y coordinate
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @param {number} cornerSize - Size of corner region in pixels (default: 150)
 * @returns {string|null} Corner position string ("top-left", "top-right", etc.) or null
 */
export function getCornerPosition(x, y, width, height, cornerSize = 150) {
	if (!isInCorner(x, y, width, height, cornerSize)) {
		return null;
	}

	const inLeft = x < cornerSize;
	const inTop = y < cornerSize;

	if (inTop && inLeft) return "top-left";
	if (inTop && !inLeft) return "top-right";
	if (!inTop && inLeft) return "bottom-left";
	return "bottom-right";
}
