/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
	preset: 'ts-jest',
	coverageDirectory: './coverage/',
	testEnvironment: "jsdom",
	collectCoverage: true,
	setupFiles: ["jest-webgl-canvas-mock"],
	coveragePathIgnorePatterns : ['/tests']
}