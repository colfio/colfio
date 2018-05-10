/**
 * Converts radians to degrees
 * @param {Number} angle  
 * @returns {Number} converted number
 */
function radToDeg(angle) {
	return angle * (180 / Math.PI);
}


/**
 * Converts degrees to radians
 * @param {Number} angle  
 * @returns {Number} converted number
 */
function degToRad(angle) {
	return angle * (Math.PI / 180);
}

/**
 * Checks if two circles intersect
 * @param {Number} x1 x-axis center of the first circle 
 * @param {Number} y1 y-axis center of the first circle
 * @param {Number} r1 radius of the first circle
 * @param {Number} x2 x-axis center of the second circle
 * @param {Number} y2 y-axis center of thse second circle
 * @param {Number} r2 radius of the second circle
 * @returns {Boolean} true if the circles intersect
 */
function circleIntersection(x1, y1, r1, x2, y2, r2) {
	// Calculate the distance between the centers
	var dx = x1 - x2;
	var dy = y1 - y2;

	if (Math.abs(dx) < (r1 + r2) && Math.abs(dy) < r1 + r2) {
		return true;
	}

	return false;
}

/**
 * Gets a random integer in range
 * @param {Number} low low interval, inclusive 
 * @param {Number} high high interval, inclusive
 * @returns {Number} a random number
 */
function randRange(low, high) {
	return Math.floor(low + Math.random() * (high - low + 1));
}