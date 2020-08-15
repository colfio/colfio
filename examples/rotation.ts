import { TranslateAnimation, RotationAnimation } from './animations';
import * as ECS from '../src';

class RotationAnim extends ECS.Component {
	onUpdate(delta, absolute) {
		this.owner.pixiObj.rotation += delta * 0.01;
	}
}

newGame(new ECS.GameLoop());


// Start a new game
function newGame(engine: ECS.GameLoop) {

	engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, { debugEnabled: true });

	let rect1Gfx = new ECS.Graphics();
	rect1Gfx.beginFill(0xfff012, 1);
	rect1Gfx.drawRect(0, 0, 100, 100);

	let rect2Gfx = new ECS.Graphics();
	rect2Gfx.beginFill(0x00ff12, 1);
	rect2Gfx.drawRect(0, 0, 100, 100);

	rect1Gfx.position.set(200, 200);
	rect1Gfx.pivot.set(50, 50);
	rect1Gfx.addComponent(new RotationAnim());
	engine.scene.stage.pixiObj.addChild(rect1Gfx);

	rect2Gfx.position.set(350, 200);
	rect2Gfx.pivot.set(50, 50);
	rect2Gfx.addComponent(new RotationAnim());
	engine.scene.stage.pixiObj.addChild(rect2Gfx);
}

