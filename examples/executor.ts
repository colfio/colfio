import { TranslateAnimation, RotationAnimation } from './animations';
import * as ECS from '../src';

newGame(new ECS.Engine);
// Start a new game
function newGame(engine: ECS.Engine) {
	engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, { debugEnabled: true });

	let obj = new ECS.Builder(engine.scene)
		.localPos(200, 200)
		.anchor(0.5, 0.5)
		.asGraphics()
		.withParent(engine.scene.stage)
		.build().asGraphics();

	obj.beginFill(0xfff012, 1);
	obj.drawRect(0, 0, 100, 100);
	obj.endFill();


	obj.addComponent(new ECS.ChainComponent()
		.beginInterval(1)
		.waitFor(() => (new TranslateAnimation(100, 100, 200, 100, 1000)))
		.waitFor(() => (new TranslateAnimation(200, 100, 200, 200, 1000)))
		.waitFor(() => (new TranslateAnimation(200, 200, 100, 200, 1000)))
		.waitFor(() => (new TranslateAnimation(100, 200, 100, 100, 1000)))
		.endInterval());
}

