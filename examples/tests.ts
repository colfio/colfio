let tests = import('../src/tests/component-tests');
tests.then((val) => {
	new val.default();
});