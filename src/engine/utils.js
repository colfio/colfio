
var Interpolation = {};
Interpolation.linear = (current, start, length) => Math.min(1, Math.max(0, (current - start) / length));
Interpolation.easeinout = (current, start, length) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = pos < 0.5 ? 2 * pos * pos : -1 + (4 - 2 * pos) * pos;
    return Math.min(1, Math.max(0, posInt));
}

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

function isTime(frequency, lastTime, currentTime){
	let delta = currentTime - lastTime;
	return delta > 1/frequency;
}


// Get a random int between low and high, inclusive
function randRange(low, high) {
	return Math.floor(low + Math.random() * (high - low + 1));
}