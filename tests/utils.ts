import { Scene } from '../src';
import * as PIXI from 'pixi.js';

export const WIDTH = 600;
export const HEIGHT = 600;
export const TIME_STEP = 16.67;
export const TIMEOUT_SECONDS = 10;

export const testLooper = (action: (scene: Scene, resolve: () => void, tick: () => void) => void) => {
	// init engine
	const app = new PIXI.Application({
		width: WIDTH,
		height: HEIGHT,
	});

	const scene = new Scene('default', app);
	const ticker = app.ticker;
	ticker.autoStart = false;
	ticker.stop();

	let currentTime = 0;

	return new Promise((resolve, reject) => {
		let finished = false;

		const tick = () => {
			currentTime += TIME_STEP;
			scene._update(TIME_STEP, currentTime);
			ticker.update(currentTime);

		}

		action(scene, () => {
			finished = true;
			resolve(true);
		}, tick);

		while(!finished) {
			if (currentTime >= (TIMEOUT_SECONDS * 1000)) {
				scene.clearScene({});
				reject('Timeout after ' + Math.floor(currentTime / 1000) + ' seconds!');
				return;
			} else {
				tick();
			}
		}

		scene.clearScene({});
		resolve(true);
	});
}

export const initEngine = () => {
	const app = new PIXI.Application({
		width: WIDTH,
		height: HEIGHT,
	});

	const scene = new Scene('default', app);
	const ticker = app.ticker;
	ticker.autoStart = false;
	ticker.stop();

	return {
		scene,
		app,
		ticker
	}
}
