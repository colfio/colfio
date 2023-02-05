import { Container } from '../src';
import { testLooper } from './utils';

test('TagSearchTest', async () => {
	await testLooper((scene, finish) => {
		scene.clearScene({ tagsSearchEnabled: true });
		const obj = new Container();
		obj.addTag('A');
		obj.addTag('B');
		obj.addTag('C');
		scene.stage.pixiObj.addChild(obj);

		const obj2 = new Container();
		obj2.addTag('A');
		scene.stage.pixiObj.addChild(obj2);

		const obj3 = new Container();
		obj3.addTag('A');
		obj3.addTag('B');
		scene.stage.pixiObj.addChild(obj3);
		expect(scene.findObjectsByTag('A')).toHaveLength(3);
		expect(scene.findObjectsByTag('B')).toHaveLength(2);
		expect(scene.findObjectsByTag('C')).toHaveLength(1);
		finish();
	});
});

test('TagSearchTest2', async () => {
	await testLooper((scene, finish) => {
		scene.clearScene({ tagsSearchEnabled: true });
		const obj = new Container();
		obj.addTag('A');
		obj.addTag('B');
		obj.addTag('C');
		scene.stage.pixiObj.addChild(obj);

		const obj2 = new Container();
		obj2.addTag('A');
		scene.stage.pixiObj.addChild(obj2);

		const obj3 = new Container();
		obj3.addTag('A');
		obj3.addTag('B');
		scene.stage.pixiObj.addChild(obj3);
		obj3.removeTag('A');
		obj3.removeTag('B');
		expect(scene.findObjectsByTag('A')).toHaveLength(2);
		expect(scene.findObjectsByTag('B')).toHaveLength(1);
		expect(scene.findObjectsByTag('C')).toHaveLength(1);
		finish();
	});
});

test('StateSearchTest', async () => {
	await testLooper((scene, finish) => {
		scene.clearScene({ statesSearchEnabled: true });
		const obj = new Container();
		obj.stateId = 15;
		scene.stage.pixiObj.addChild(obj);

		const obj2 = new Container();
		obj2.stateId = 15;
		scene.stage.pixiObj.addChild(obj2);

		const obj3 = new Container();
		obj3.stateId = 10;
		scene.stage.pixiObj.addChild(obj3);
		expect(scene.findObjectsByState(15)).toHaveLength(2);
		expect(scene.findObjectsByState(10)).toHaveLength(1);
		expect(scene.findObjectsByState(5)).toHaveLength(0);
		finish();
	});
});

test('StateSearchTest2', async () => {
	await testLooper((scene, finish) => {
		scene.clearScene({ statesSearchEnabled: true });
		const obj = new Container();
		obj.stateId = 15;
		scene.stage.pixiObj.addChild(obj);

		const obj2 = new Container();
		obj2.stateId = 15;
		scene.stage.pixiObj.addChild(obj2);
		obj.stateId = 200; // change the state
		expect(scene.findObjectsByState(15)).toHaveLength(1);
		expect(scene.findObjectsByState(200)).toHaveLength(1);
		finish();
	});
});

test('FlagSearchTest', async () => {
	await testLooper((scene, finish) => {
		scene.clearScene({ flagsSearchEnabled: true });
		const obj = new Container();
		obj.setFlag(12);
		scene.stage.pixiObj.addChild(obj);
		obj.setFlag(120);
		const obj2 = new Container();
		obj2.setFlag(12);
		scene.stage.pixiObj.addChild(obj2);
		obj.resetFlag(120);
		expect(scene.findObjectsByFlag(12)).toHaveLength(2);
		expect(scene.findObjectsByFlag(120)).toHaveLength(0);
		finish();
	});
});

