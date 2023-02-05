import { Graphics, FuncComponent, Message, ChainComponent } from '../src';
import { testLooper } from './utils';

test('ChainComponentTest', async () => {
	await testLooper((scene, finish) => {
		const gfx = new Graphics('');
		gfx.beginFill(0x00FF00);
		gfx.drawRect(0, 0, 200, 200);
		gfx.pivot.set(100, 100);
		gfx.position.set(300, 300);
		gfx.endFill();
		scene.stage.pixiObj.addChild(gfx);
		let tokens = 0;
		gfx.addComponent(new FuncComponent('').doOnMessage('TOKEN', () => tokens++));
		gfx.addComponent(new ChainComponent()
			.beginRepeat(2)
			.waitFor(() => new FuncComponent('').doOnUpdate((cmp, delta) => gfx.rotation += 0.1 * delta).setDuration(500))
			.waitFor(() => new FuncComponent('').doOnUpdate((cmp, delta) => gfx.rotation -= 0.1 * delta).setDuration(500))
			.addComponent(() => new FuncComponent('').doOnUpdate((cmp, delta) => gfx.rotation += 0.01 * delta).setDuration(1000).doOnFinish((cmp) => cmp.sendMessage('TOKEN')))
			.waitForMessage('TOKEN')
			.endRepeat()
			.call(() => {
				expect(tokens).toBe(2);
				finish();
			})
		);
	});
});

test('ChainComponentTest2', async () => {
	await testLooper((scene, finish) => {
		let tokens = 0;
		let whileTokens = 0;
		scene.addGlobalComponent(new ChainComponent()
			.beginIf(() => false)
			.call(() => tokens = -10)
			.else()
			.call(() => tokens++)
			.endIf()
			.beginIf(() => true)
			.call(() => tokens++)
			.else()
			.call(() => tokens = -10)
			.endIf()
			.beginWhile(() => whileTokens <= 10)
			.call(() => whileTokens++)
			.endWhile()
			.call(() => {
				expect(tokens).toBe(2);
				finish();
			})
		);
	});
});


test('ChainComponentTest3', async () => {
	await testLooper((scene, finish) => {
		scene.addGlobalComponent(new ChainComponent()
		.waitForMessage('TOKEN')
		.call(() => {
			// just wait for this call
			finish();
		})
		);

		scene.callWithDelay(2000, () => {
			scene.sendMessage(new Message('TOKEN'));
		});
	});
});

test('ChainComponentTest4', async () => {
	await testLooper((scene, finish) => {
		let token = 0;

		const cmpGenerator = () => new FuncComponent('generic').doOnMessage('STOP', (cmp) => {
			token++;
			cmp.finish();
		});

		scene.addGlobalComponent(new ChainComponent()
			.waitFor([cmpGenerator(), cmpGenerator(), cmpGenerator()]) // add 3 components and wait when all of them finish
			.call(() => {
				expect(token).toBe(3);
				finish();
			})
		);

		scene.callWithDelay(500, () => {
			scene.sendMessage(new Message('STOP'));
		});
	});
});


test('ChainComponentConditionalTest', async () => {
	await testLooper((scene, finish) => {
		scene.stage.setFlag(12);
		scene.stage.stateId = 22;
		scene.addGlobalComponent(new ChainComponent()
			.waitForMessageConditional('TOKEN', { ownerState: 22, ownerFlag: 12 })
			.call(() => {
				finish();
			})
		);

		scene.callWithDelay(200, () => {
			scene.stage.addComponent(new ChainComponent().call((cmp) => cmp.sendMessage('TOKEN')));
		});
	});
});

test('Chain Merge', async () => {
	await testLooper((scene, finish) => {
		let token = 0;
		const chain1 = new ChainComponent()
			.call(() => token++) // 1
			.call(() => token *= 2) // 2
			.call(() => token *= 3); // 6

		const chain2 = new ChainComponent()
			.call(() => token++) // 7
			.call(() => token++) // 8
			.call(() => token /= 2); // 4

		scene.addGlobalComponentAndRun(chain1.mergeWith(chain2));
		expect(token).toBe(4);
		finish();
	});
});

test('Chain Merge at the beginning', async () => {
	await testLooper((scene, finish) => {
		let token = 0;

		const chain2 = new ChainComponent()
			.call(() => token++) // 1
			.call(() => token++) // 2
			.call(() => token /= 2); // 1


		const chain1 = new ChainComponent()
			.call(() => token++) // 2
			.call(() => token *= 2) // 4
			.call(() => token *= 3); // 12

		scene.addGlobalComponentAndRun(chain1.mergeAtBeginning(chain2));
		expect(token).toBe(12);
		finish();
	});
});


test('Chain Wait for all', async () => {
	await testLooper((scene, finish) => {
		let token = 0;

		const chain = new ChainComponent()
			.waitFor([
				new FuncComponent('A').doOnUpdate((cmp) => {
					token++;
					cmp.finish();
				}),
				new FuncComponent('B').doOnUpdate((cmp) => {
					token++;
					cmp.finish();
				})]);

		scene.addGlobalComponentAndRun(chain);
		scene.callWithDelay(100, () => {
			expect(token).toBe(2);
			finish();
		});
	});
});


test('Chain Wait for first', async () => {
	await testLooper((scene, finish) => {
		let token = 0;

		const chain = new ChainComponent()
			.waitForFirst([
				new FuncComponent('A').doOnUpdate((cmp) => {
					token++;
					cmp.finish();
				}),
				new FuncComponent('B').doOnUpdate((cmp) => {
					token++;
					cmp.finish();
				}),
				new FuncComponent('C').doOnUpdate(() => {
					token++; // endless
				})]);

		scene.addGlobalComponentAndRun(chain);
		scene.callWithDelay(100, () => {
			expect(token).toBe(3);
			finish();
		});
	});
});

