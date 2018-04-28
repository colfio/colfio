
class Renderer extends Component {
	draw(ctx) {
		if (this.owner.mesh != null) {
			ctx.drawImage(this.owner.mesh.image, this.owner.mesh.offsetX, this.owner.mesh.offsetY,
				this.owner.mesh.width, this.owner.mesh.height, this.owner.trans.posX, this.owner.trans.posY, this.owner.mesh.width, this.owner.mesh.height);
		}
	}
}


function newGame() {
	loadImage('./example/circle.png').then((img) => {
		var gameObject = new GameObject('circle');
		gameObject.mesh = new Sprite(0, 0, img.width, img.height, img);
		gameObject.addComponent(new Renderer())
		scene.root.addGameObject(gameObject);
	});
}