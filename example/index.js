class Sprite {
	constructor(atlas, offsetX, offsetY, width, height) {
		this.atlas = atlas;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.width = width;
		this.height = height;
	}
}

class Renderer extends Component {
	draw(ctx) {
		if (this.owner.sprite != null) {
			ctx.drawImage(this.owner.sprite.atlas, this.owner.sprite.offsetX, this.owner.sprite.offsetY,
				this.owner.sprite.width, this.owner.sprite.height, this.owner.posX, this.owner.posY, this.owner.sprite.width, this.owner.sprite.height);
		}
	}
}


function newGame() {
	loadImage('./example/circle.png').then((img) => {
		var gameObject = new GameObject('circle');
		gameObject.sprite = new Sprite(img, 0, 0, img.width, img.height);
		gameObject.addComponent(new Renderer())
		scene.addGameObject(gameObject);
	});
}