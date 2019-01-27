import * as PIXI from 'pixi.js';
import Scene from './Scene';

/**
 * Entry point to the PIXIJS
 */
export default class GameLoop {
    app: PIXI.Application = null;
    lastTime = 0;
    gameTime = 0;
    scene: Scene = null;
    ticker: PIXI.Ticker = null;

    init(canvas: HTMLCanvasElement, resolution: number = 1) {
        this.app = new PIXI.Application({
            width: canvas.width / resolution,
            height: canvas.height / resolution,
            antialias: true,
            view: canvas,
            resolution: resolution // resolution/device pixel ratio
        });

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
}