import { TranslateAnimation, RotationAnimation } from './animations';
import * as ECS from '../src';

newGame(new ECS.Engine());

// Start a new game
function newGame(engine: ECS.Engine) {
	engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, { debugEnabled: true });

	let obj = new ECS.Builder(engine.scene)
		.localPos(2, 2)
		.anchor(0.5, 0.5)
		.asGraphics()
		.withParent(engine.scene.stage)
		.build().asGraphics();

	obj.beginFill(0xfff012, 1);
	obj.drawRect(-50, -50, 100, 100);
	obj.endFill();

	engine.scene.stage.addChild(obj);

	obj.addComponent(new ECS.ChainComponent()
		.beginRepeat(0)
		.waitFor(() => new RotationAnimation(0, 1, 1000))
		.waitFor(() => new TranslateAnimation(100, 100, 200, 200, 1000))
		.endRepeat()
	);
}