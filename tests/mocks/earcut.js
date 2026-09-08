/**
 * CommonJS shim for earcut (Pixi depends on earcut@3 which is ESM-only).
 * Jest runs tests as CJS; this avoids "Must use import to load ES Module".
 */
function earcut() {
	return [];
}

earcut.default = earcut;
earcut.flatten = () => ({ vertices: [], holes: [], dimensions: 2 });
earcut.deviation = () => 0;

module.exports = earcut;
