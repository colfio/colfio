function newGame() {
	loadImage('./example/circle.png').then((img) => {
		var gameObject = new GameObject('circle');
		gameObject.sprite = new Sprite(img, 0, 0, img.width, img.height);
		gameObject.addComponent(new Renderer())
		scene.addGameObject(gameObject);
	});
}