// Convert radians to degrees
function radToDeg(angle) {
	return angle * (180 / Math.PI);
}

// Convert degrees to radians
function degToRad(angle) {
	return angle * (Math.PI / 180);
}

// Check if two circles intersect
function circleIntersection(x1, y1, r1, x2, y2, r2) {
	// Calculate the distance between the centers
	var dx = x1 - x2;
	var dy = y1 - y2;

	if (Math.abs(dx) < (r1 + r2) && Math.abs(dy) < r1 + r2) {
		return true;
	}

	return false;
}

// Get a random int between low and high, inclusive
function randRange(low, high) {
	return Math.floor(low + Math.random() * (high - low + 1));
}