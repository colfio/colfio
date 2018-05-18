
function newGame() {
	loadImage('circle.png').then((img) => {
		var gameObject = new GameObject('circle');
		gameObject.mesh = new SpriteMesh(0, 0, img.width, img.height, img);
		gameObject.addComponent(new BasicRenderer())
		scene.root.addGameObject(gameObject);
	});
}