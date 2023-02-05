import { Graphics, FuncComponent, Builder, ChainComponent } from '../src';
import { testLooper } from './utils';
import * as PIXI from 'pixi.js';

test('RotationTest', async () => {
	await testLooper((scene, finish) => {
		const gfx = new Graphics('');
		gfx.beginFill(0xFF0000);
		gfx.drawRect(0, 0, 200, 200);
		gfx.pivot.set(100, 100);
		gfx.position.set(300, 300);
		gfx.endFill();
		scene.stage.pixiObj.addChild(gfx);
		gfx.addComponent(new FuncComponent('').doOnUpdate((cmp, delta) => gfx.rotation += delta * 0.001));
		scene.callWithDelay(1500, () => {
			finish();
		});
	});
});

test('FuncComponentTest', async () => {
	await testLooper((scene, finish) => {
		let token = 0;
		new Builder(scene)
			.localPos(300, 300)
			.anchor(0.5)
			.withName('text')
			.asText('GENERIC', new PIXI.TextStyle({ fontSize: 35, fill: '#FFF' }))
			.withComponent(new FuncComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = 0xFFFF + Math.floor(Math.random() * 0xFF))) // animation, not important for the test
			.withComponent(new FuncComponent('gencmp').doOnMessage('msg_example', () => token++))
			.withComponent(new ChainComponent().waitTime(1000).call((cmp) => cmp.sendMessage('msg_example')).call((cmp) => cmp.sendMessage('msg_example')))
			.withParent(scene.stage).build();

		// chain component will fire two messages that should be captured by FuncComponent and token var should be increased

		scene.callWithDelay(2000, () => {
			expect(token).toBe(2);
			finish();
		});
	});
});

test('FuncComponentTest2', async () => {
	await testLooper((scene, finish) => {
		let token = 0;
		new Builder(scene)
			.localPos(300, 300)
			.anchor(0.5)
			.withName('text')
			.asText('GENERIC 2', new PIXI.TextStyle({ fontSize: 35, fill: '#0FF' }))
			.withComponent(new FuncComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = 0x0000 + Math.floor(Math.random() * 0xFF))) // animation, not important for the test
			.withComponent(new FuncComponent('gencmp').doOnMessageOnce('msg_example', () => token++))
			.withComponent(new ChainComponent().waitTime(1000).call((cmp) => cmp.sendMessage('msg_example')).call((cmp) => cmp.sendMessage('msg_example')))
			.withParent(scene.stage).build();

		// chain component will fire two messages that should be captured by FuncComponent only once
		scene.callWithDelay(2000, () => {
			expect(token).toBe(1);
			finish();
		});
	});
});

test('FuncComponentConditionalTest', async () => {
	await testLooper((scene, finish) => {
		let token = 0;
		let tokenTag = 0;
		let tokenName = 0;
		let tokenState = 0;
		let tokenFlag = 0;
		new Builder(scene)
			.localPos(300, 300)
			.anchor(0.5)
			.withName('text')
			.asText('GENERIC CONDITIONAL', new PIXI.TextStyle({ fontSize: 35, fill: '#0FF' }))
			.withComponent(new FuncComponent('tint').doOnUpdate((cmp) => cmp.owner.asText().tint = Math.floor(Math.random() * 0xFF) << 16 + 0xFFFF)) // animation, not important for the test
			.withComponent(new FuncComponent('gencmp')
				.doOnMessageConditional('msg_conditional', {}, () => token++) // empty condition, should be invoked every time
				.doOnMessageConditional('msg_conditional', { ownerTag: 'test_tag' }, () => tokenTag++) // increase only if the object has test_tag tag
				.doOnMessageConditional('msg_conditional', { ownerName: 'test_name' }, () => tokenName++) // shouldn't be invoked
				.doOnMessageConditional('msg_conditional', { ownerName: 'text' }, () => tokenName++) // increase only if the object has name == text
				.doOnMessageConditional('msg_conditional', { ownerState: 12 }, () => tokenState++) // increase only if the object has state == 12
				.doOnMessageConditional('msg_conditional', { ownerFlag: 50 }, () => tokenFlag++)) // increase only if the object has flag == 50
			.withComponent(new ChainComponent().waitTime(1000)
				.call((cmp) => cmp.sendMessage('msg_example')) // shouldn't be captured at all
				.call((cmp) => cmp.owner.addTag('test_tag'))
				.call((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure and tag-closure
				.call((cmp) => cmp.owner.removeTag('test_tag'))
				.call((cmp) => cmp.owner.stateId = 12)
				.call((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure and state-closure
				.call((cmp) => cmp.owner.stateId = 13)
				.call((cmp) => cmp.sendMessage('msg_conditional')) // should be captured by empty closure, name-closure
				.call((cmp) => cmp.owner.setFlag(50))
				.call((cmp) => cmp.sendMessage('msg_conditional'))) // should be captured by empty closure, name-closure and flag-closure
			.withParent(scene.stage).build();

		scene.callWithDelay(2000, () => {
			expect(token).toBe(4);
			expect(tokenTag).toBe(1);
			expect(tokenName).toBe(4);
			expect(tokenState).toBe(1);
			finish();
		});
	});
});
