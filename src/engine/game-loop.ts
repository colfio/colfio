import * as PIXI from 'pixi.js';
window.PIXI = PIXI; // workaround for PIXISound
import Scene from './scene';
import { resizeContainer } from '../utils/functions';
import { SceneConfig, defaultConfig as sceneDefaultConfig } from './scene';

export enum GameLoopType {
	FIXED,
	VARIABLE
}

export interface EngineConfig extends SceneConfig {
	resizeToScreen?: boolean;
	transparent?: boolean;
	backgroundColor?: number;
	antialias?: boolean;
	width?: number;
	height?: number;
	resolution?: number;
	gameLoopType?: GameLoopType;
}

const defaultConfig: EngineConfig = {
	...sceneDefaultConfig,
	resizeToScreen: true,
	transparent: false,
	backgroundColor: 0x000000,
	antialias: true,
	width: undefined,
	height: undefined,
	resolution: 1,
	gameLoopType: GameLoopType.VARIABLE
};

/**
 * Entry point to the PIXIJS
 */
export default class GameLoop {
	app: PIXI.Application = null;
	lastTime = 0;
	gameTime = 0;
	scene: Scene = null;
	ticker: PIXI.Ticker = null;
	virtualWidth: number;
	virtualHeight: number;
	_running: boolean;
	config: EngineConfig;


	init(canvas: HTMLCanvasElement, engineConfig?: EngineConfig) {
		this.config = {
			...defaultConfig,
			...engineConfig
		};

		// enable debug if the query string contains ?debug
		this.config.debugEnabled = this.config.debugEnabled || /[?&]debug/.test(location.search);

		// do not resize to screen if debug window is on
		this.config.resizeToScreen = this.config.resizeToScreen && !this.config.debugEnabled;

		this.virtualWidth = this.config.width || canvas.width;
		this.virtualHeight = this.config.height || canvas.height;

		this.app = new PIXI.Application({
			width: this.virtualWidth / this.config.resolution,
			height: this.virtualHeight / this.config.resolution,
			view: canvas,
			resolution: this.config.resolution, // resolution/device pixel ratio
			transparent: this.config.transparent,
			antialias: this.config.antialias,
			backgroundColor: this.config.backgroundColor,
		});

		this.scene = new Scene('default', this.app, this.config);

		if (this.config.resizeToScreen) {
			this.initResizeHandler();
		}

		this.ticker = this.app.ticker;
		// stop the shared ticket and update it manually
		this.ticker.autoStart = false;
		this.ticker.stop();
		this._running = true;
		this.loop(performance.now());
	}

	get running() {
		return this._running;
	}

	destroy() {
		this.app.destroy(false);
		this._running = false;
		if (this.config.resizeToScreen) {
			window.removeEventListener('resize', this.resizeHandler);
		}
	}

	private loop(time: number) {
		// update our component library
		let dt = Math.min(time - this.lastTime, 300); // 300ms threshold
		this.lastTime = time;
		this.gameTime += dt;
		if (this.config.gameLoopType === GameLoopType.FIXED) {
			this.scene._update(16, this.gameTime); // 16ms is a fixed tick
		} else {
			this.scene._update(dt, this.gameTime);
		}

		// update PIXI
		if (this._running) {
			this.ticker.update(this.gameTime);
			requestAnimationFrame((time) => this.loop(time));
		}
	}

	private initResizeHandler() {
		resizeContainer(this.app.view, this.virtualWidth, this.virtualHeight);
		window.addEventListener('resize', this.resizeHandler);
	}

	private resizeHandler = () => resizeContainer(this.app.view, this.virtualWidth, this.virtualHeight);
}