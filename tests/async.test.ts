import { Graphics, FuncComponent } from '../src';
import { AsyncComponent } from '../src/components/async-component';
import { testLooper } from './utils';

test('AsyncComponentTest', async () => {
	await testLooper((scene, finish) => {
		const gfx = new Graphics('');
		gfx.beginFill(0x00FF00);
		gfx.drawRect(0, 0, 200, 200);
		gfx.pivot.set(100, 100);
		gfx.position.set(300, 300);
		gfx.endFill();
		scene.stage.pixiObj.addChild(gfx);
		let counter = 0;
		gfx.addComponent(new AsyncComponent(function* generator(cmp) {
			for(let i = 0; i < 10; i++) {
				yield cmp.waitFrames(1);
				gfx.addComponent(new FuncComponent('').doOnUpdate((cmp) => {
					counter++;
					cmp.sendMessage('TEST');
					cmp.finish();
				}));
				// the message should be send AFTER we have initialized the waiting procedure
				yield cmp.waitForMessage('TEST');
			}
			expect(counter).toBe(10);
			finish();
		}));
	});
});
