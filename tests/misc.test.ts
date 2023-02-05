import { Container} from '../src';
import { testLooper } from './utils';

test('FlagTest', async () => {
	await testLooper((scene, finish) => {
		const obj = new Container();

		obj.setFlag(1);
		obj.setFlag(10);
		obj.setFlag(20);
		obj.setFlag(32);
		obj.setFlag(45);
		obj.setFlag(70);
		obj.setFlag(90);
		obj.setFlag(128);
		obj.resetFlag(1);
		obj.invertFlag(2);
		const flags = [...obj._proxy.getAllFlags()];
		const allFlags = [2, 10, 20, 32, 45, 70, 90, 128];
		expect(flags).toHaveLength(allFlags.length);
		expect(flags.filter(flag => allFlags.findIndex(it => it === flag) === -1)).toHaveLength(0);
		finish();
	});
});
