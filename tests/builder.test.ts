import { FuncComponent, Builder } from '../src';
import { WIDTH, HEIGHT, testLooper } from './utils';
import * as PIXI from 'pixi.js';

test('BuilderTest', async () => {
	await testLooper((scene, finish) => {
		const builder = new Builder(scene);
		builder.withComponent(() => new FuncComponent('').doOnUpdate((cmp, delta) => cmp.owner.pixiObj.rotation += 0.0001 * delta * cmp.owner.id));
		builder.anchor(0.5, 0.5);

		let finishedComponents = 0;
		builder.withComponent(() => new FuncComponent('').setDuration(Math.random() * 3000).doOnFinish(() => {
			finishedComponents++;
			if (finishedComponents === 100) {
				// we have all
				finish();
			}
		}));

		for (let i = 0; i < 100; i++) {
			builder.globalPos(Math.random() * WIDTH, Math.random() * HEIGHT);
			builder.asText('Hello', new PIXI.TextStyle({
				fontSize: 35,
				fill: '#F00'
			})).withParent(scene.stage).buildAndKeepData();
		}
	});
});

test('BuilderTest2', async () => {
	await testLooper((scene, finish) => {
		const builder = new Builder(scene);
		builder.withChild(
			new Builder(scene)
				.localPos(100, 100)
				.withName('text')
				.asText('CHILD1', new PIXI.TextStyle({ fontSize: 35, fill: '#0F0' }))
		).withChild(
			new Builder(scene)
				.localPos(-100, -100)
				.withName('text')
				.asText('CHILD2', new PIXI.TextStyle({ fontSize: 35, fill: '#00F' }))
		);
		builder.withName('text').asText('PARENT', new PIXI.TextStyle({ fontSize: 80, fill: '#F00' }));
		builder.withComponent(() => new FuncComponent('').doOnUpdate((cmp, delta) => cmp.owner.pixiObj.rotation += 0.001 * delta));
		builder.anchor(0.5, 0.5);
		builder.localPos(WIDTH / 2, HEIGHT / 2).withParent(scene.stage).build();

		scene.callWithDelay(2000, () => {
			const objects = scene.findObjectsByName('text');
			expect(objects).toHaveLength(3);
			expect(objects.filter(obj => obj.pixiObj.parent.name === 'text')).toHaveLength(2);
			finish();
		});
	});
});


test('Builder component init test', async () => {
	await testLooper((scene, finish) => {
		const initOrder: string[] = [];
		const builder = new Builder(scene);
		builder.withChild(
			new Builder(scene)
				.withComponent(new FuncComponent('').doOnInit(() => initOrder.push('CHILD1')))
				.asContainer()
		).withChild(
			new Builder(scene)
				.withComponent(new FuncComponent('').doOnInit(() => initOrder.push('CHILD2')))
				.asContainer()
		);
		builder.asContainer();
		builder.withComponent(() => new FuncComponent('').doOnInit(() => initOrder.push('PARENT')));
		builder.withParent(scene.stage).build();

		scene.callWithDelay(500, () => {
			const expectedOrder = ['PARENT', 'CHILD1', 'CHILD2'];
			expect(expectedOrder.filter((val, index) => initOrder[index] !== val)).toHaveLength(0);
			finish();
		});
	});
});
