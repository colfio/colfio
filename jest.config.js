/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	coverageDirectory: './coverage/',
	testEnvironment: 'jsdom',
	collectCoverage: true,
	setupFiles: ['jest-webgl-canvas-mock'],
	coveragePathIgnorePatterns: ['/tests'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
	moduleNameMapper: {
		'^earcut$': '<rootDir>/tests/mocks/earcut.js',
	},
	transformIgnorePatterns: [
		'/node_modules/(?!(\\.pnpm/(pixi\\.js|@pixi|parse-svg-path|normalize-svg-path|adaptive-bezier-curve)@|pixi\\.js|@pixi|parse-svg-path|normalize-svg-path|adaptive-bezier-curve)/)',
	],
};
