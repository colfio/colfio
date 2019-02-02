import * as PIXI from 'pixi.js';
import Scene from './scene';
import { resizeContainer } from '../utils/functions';

/**
 * Entry point to the PIXIJS
 */
export default class GameLoop {
    app: PIXI.Application = null;
    lastTime = 0;
    gameTime = 0;
    scene: Scene = null;
    ticker: PIXI.Ticker = null;
    width: number;
    height: number;

    init(canvas: HTMLCanvasElement, width: number, height: number, resolution: number = 1, autoResize = true) {
        this.width = width;
        this.height = height;

        this.app = new PIXI.Application({
            width: width / resolution,
            height: height / resolution,
            antialias: true,
            view: canvas,
            resolution: resolution // resolution/device pixel ratio
        });

        if(autoResize) {
            this.initResizeHandler();
        }
        this.scene = new Scene(this.app);
        this.ticker = PIXI.ticker.shared;
        // stop the shared ticket and update it manually
        this.ticker.autoStart = false;
        this.ticker.stop();

        this.loop(performance.now());
    }

    private loop(time: number) {
        // update our component minilib
        let dt = (time - this.lastTime);
        this.lastTime = time;
        this.gameTime += dt;
        this.scene._update(dt, this.gameTime);

        // update PIXI
        this.ticker.update(this.gameTime);
        requestAnimationFrame((time) => this.loop(time));
    }

    private initResizeHandler() {
        let virtualWidth = this.app.screen.width;
        let virtualHeight = this.app.screen.height;
        resizeContainer(this.app.view, virtualWidth, virtualHeight);
        window.addEventListener('resize', (evt) => resizeContainer(this.app.view, this.width, this.height));
      }
}