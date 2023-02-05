import { Graphics, FuncComponent, Message, Messages, Container, Builder } from '../src';
import { testLooper } from './utils';

test('MessageNotifyTest', async () => {
	await testLooper((scene, finish, tick) => {
	// enable everything
	scene.clearScene({
		notifyAttributeChanges: true,
		notifyFlagChanges: true,
		notifyStateChanges: true,
		notifyTagChanges: true
	});

	let token = 0;
	// update token with every new message
	scene.addGlobalComponent(new FuncComponent('')
		.doOnMessage(Messages.ATTRIBUTE_ADDED, () => token++)
		.doOnMessage(Messages.ATTRIBUTE_CHANGED, () => token++)
		.doOnMessage(Messages.ATTRIBUTE_REMOVED, () => token++)
		.doOnMessage(Messages.FLAG_CHANGED, () => token++)
		.doOnMessage(Messages.TAG_ADDED, () => token++)
		.doOnMessage(Messages.TAG_REMOVED, () => token++)
		.doOnMessage(Messages.OBJECT_ADDED, () => token++)
		.doOnMessage(Messages.OBJECT_REMOVED, () => token++)
		.doOnMessage(Messages.STATE_CHANGED, () => token++)
		.doOnMessage(Messages.COMPONENT_ADDED, () => token++)
		.doOnMessage(Messages.COMPONENT_REMOVED, () => token++)
	);
	// update scene so that the component will be added to the stage
	tick();

	new Builder(scene)
		.withComponent(new FuncComponent('dummy'))
		.withAttribute('dummy_attr', 12345)
		.withFlag(123)
		.withParent(scene.stage)
		.withState(12).build();

	scene.callWithDelay(500, () => { // wait a few frames
		// we expect only two messages: OBJECT_ATTACHED and COMPONENT_ADDED
		expect(token).toBe(2);
		finish();
	});
	});
});


test('MessageNotifyTest2', async () => {
	await testLooper((scene, finish, tick) => {
	// enable everything
	scene.clearScene({
		notifyAttributeChanges: true,
		notifyFlagChanges: true,
		notifyStateChanges: true,
		notifyTagChanges: true
	});

	let token = 0;
	scene.stage.assignAttribute('attr_1', 1);
	scene.stage.asContainer().addChild(new Graphics('CHILD'));
	scene.stage.addComponent(new FuncComponent('GENERIC1'));
	// update token with every new message
	scene.addGlobalComponent(new FuncComponent('')
		.doOnMessage(Messages.ATTRIBUTE_ADDED, () => token++)
		.doOnMessage(Messages.ATTRIBUTE_CHANGED, () => token++)
		.doOnMessage(Messages.ATTRIBUTE_REMOVED, () => token++)
		.doOnMessage(Messages.FLAG_CHANGED, () => token++)
		.doOnMessage(Messages.TAG_ADDED, () => token++)
		.doOnMessage(Messages.TAG_REMOVED, () => token++)
		.doOnMessage(Messages.OBJECT_ADDED, () => token++)
		.doOnMessage(Messages.OBJECT_REMOVED, () => token++)
		.doOnMessage(Messages.STATE_CHANGED, () => token++)
		.doOnMessage(Messages.COMPONENT_ADDED, () => token++)
		.doOnMessage(Messages.COMPONENT_REMOVED, () => token++)
	);
	// update scene so that the component will be added to the stage
	tick();

	// now we should receive message about every single update
	scene.stage.assignAttribute('attr_2', 1); // attribute added
	scene.stage.assignAttribute('attr_1', 1); // attribute changed
	scene.stage.removeAttribute('attr_1'); // attribute removed
	scene.stage.removeAttribute('attr_XYZ'); // doesn't exist, no message
	scene.stage.setFlag(12); // flag chnaged
	scene.stage.resetFlag(33); // flag changed
	scene.stage.addTag('tag1'); // tag added
	scene.stage.removeTag('tag1'); // tag removed
	scene.stage.removeTag('tag2'); // doesn't exist, no message
	scene.stage.asContainer().addChild(new Graphics('CHILD_2')); // object added
	scene.stage.asContainer().destroyChild(scene.findObjectByName('CHILD')!); // object removed
	scene.stage.stateId = 12; // state changed
	scene.stage.addComponent(new FuncComponent('GENERIC2')); // component added
	scene.stage.removeComponent(scene.stage.findComponentByName('GENERIC1')!); // component removed

	scene.callWithDelay(500, () => { // wait a few frames
		// we expect all 12 messages
		expect(token).toBe(12);
		finish();
	});
	});
});


test('FinishedComponentMessageTest', async () => {
	await testLooper((scene, finish) => {
		let token = 0;

		// component that will be reused by another object when removed from the first one
		const recyclableComponent = new FuncComponent('recyclable')
			.doOnMessage('TOKEN_MSG', () => token++);

		// add object
		let container = new Container('');
		scene.stage.pixiObj.addChild(container);
		container.addComponent(recyclableComponent);

		scene.callWithDelay(100, () => { // wait 100s and send the first message
			scene.sendMessage(new Message('TOKEN_MSG'));
			recyclableComponent.finish(); // finish the component
			container = new Container('');
			scene.stage.pixiObj.addChild(container);
			container.addComponent(recyclableComponent);

			scene.callWithDelay(200, () => {
				scene.sendMessage(new Message('TOKEN_MSG')); // send another message -> should be captured and token should be increased
				expect(token).toBe(2);
				finish();
			});
		});
	});
});
