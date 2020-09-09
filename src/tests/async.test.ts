import { Graphics, FuncComponent } from '..';
import AsyncComponent from '../components/async-component';
import { addTest } from './test-collector';


addTest('AsyncComponentTest', (scene, onFinish) => {
	let gfx = new Graphics('');
	gfx.beginFill(0x00FF00);
	gfx.drawRect(0, 0, 200, 200);
	gfx.pivot.set(100, 100);
	gfx.position.set(300, 300);
	gfx.endFill();
	scene.stage.pixiObj.addChild(gfx);
	let tokens = 0;

	gfx.addComponent(new AsyncComponent(function* generator(cmp) {
		for(let i = 0; i < 10; i++) {
			tokens++;
			yield cmp.waitFrames(1);
			gfx.addComponent(new FuncComponent('').doOnUpdate((cmp) => {
				cmp.sendMessage('TEST');
				cmp.finish();
			}));
			// the message should be send AFTER we have initialized the waiting procedure
			yield cmp.waitForMessage('TEST');
		}
		scene.callWithDelay(0, () => onFinish(tokens === 10));
	}));
});