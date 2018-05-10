/**
 * @file Bootstrapper of the game, initializes game loop and the scene
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */


/**
 * @typedef {typeof import('./compengine.js').Scene} Scene
 */

// number of ms since the game started
var gameTime = 0;
/** @type {Canvas} */
var canvas;
/** @type {CanvasRenderingContext2D} */
var canvasCtx;
/** @type {Scene} */
var scene;

window.onload = function () {
	// get canvas
	canvas = document.getElementById('gameCanvas');
	canvasCtx = canvas.getContext('2d');

	// init component microengine
	scene = new Scene(canvas);

	initGame()
	gameLoop()
}

// initializes the whole game scene, its game entities, attributes and components
function initGame() {
	// Timing and frames per second
	this.lastframe = 0;
	this.initialized = false;

	// Call init to start the game
	newGame();
}

// ========================= GAME LOOP =========================
function gameLoop(tframe = 0) {
	// Request animation frames
	window.requestAnimationFrame(gameLoop);

	// deltatime
	let dt = (tframe - lastframe) / 1000;
	lastframe = tframe;

	gameTime += dt;
	scene.update(dt, gameTime);
	// clear canvas and call update and render function upon the scene
	canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	scene.draw(canvasCtx);
}
// =============================================================
