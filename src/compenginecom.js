// Rendering component that can render any mesh
class BasicRenderer extends Component {

	draw(ctx) {
		let mesh = this.owner.mesh;

		if (mesh instanceof RectMesh) {
			this._drawRectMesh(ctx, mesh);
		} else if (mesh instanceof ImageMesh) {
			this._drawImageMesh(ctx, mesh);
		} else if (mesh instanceof SpriteMesh) {
			this._drawSpriteMesh(ctx, mesh, this.owner.trans);
		} else if (mesh instanceof MultiSprite) {
			throw new Error("MultiSprite cannot be used directly. Put it into a MultiSpriteCollection instead");
		} else if (mesh instanceof MultiSpriteCollection) {
			this._drawMultiSpriteMesh(ctx, mesh);
		} else {
			throw new Error("Not supported mesh type");
		}
	}

	_drawRectMesh(ctx, mesh) {
		let trans = this.owner.trans;
		let posX = trans.absPosX * this.scene.unitSize;
		let posY = trans.absPosY * this.scene.unitSize;
		let originX = trans.rotationOffsetX * this.scene.unitSize;
		let originY = trans.rotationOffsetY * this.scene.unitSize;
		ctx.translate(posX + originX, posY + originY);
		ctx.rotate(trans.absRotation);
		let fillStyle = ctx.fillStyle;
		ctx.fillStyle = mesh.fillStyle;
		ctx.fillRect(-originX, -originY, mesh.width * this.scene.unitSize, mesh.height * this.scene.unitSize);
		ctx.fillStyle = fillStyle;
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX + originX), -(posY + originY));
	}

	_drawImageMesh(ctx, mesh) {
		let trans = this.owner.trans;
		let posX = trans.absPosX * this.scene.unitSize;
		let posY = trans.absPosY * this.scene.unitSize;
		let originX = trans.rotationOffsetX * this.scene.unitSize;
		let originY = trans.rotationOffsetY * this.scene.unitSize;
		ctx.translate(posX + originX, posY + originY);
		ctx.rotate(trans.absRotation);
		ctx.drawImage(mesh.image, 0, 0, mesh.image.width, mesh.image.height, -originX, -originY, mesh.image.width, mesh.image.height);
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX + originX), -(posY + originY));
	}

	_drawSpriteMesh(ctx, mesh, trans) {
		let posX = trans.absPosX * this.scene.unitSize;
		let posY = trans.absPosY * this.scene.unitSize;
		let originX = trans.rotationOffsetX * this.scene.unitSize;
		let originY = trans.rotationOffsetY * this.scene.unitSize;
		ctx.translate(posX + originX, posY + originY);
		ctx.rotate(trans.absRotation);
		ctx.drawImage(mesh.image, mesh.offsetX, mesh.offsetY,
			mesh.width, mesh.height, -originX, -originY, mesh.width, mesh.height);
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX + originX), -(posY + originY));
	}

	_drawMultiSpriteMesh(ctx, mesh) {
		for (let [id, sprite] of mesh.sprites) {
			this.drawSpriteMesh(ctx, sprite, sprite.trans);
		}
	}
}


const INPUT_TOUCH = 1;
const INPUT_DOWN = 1 << 1;
const INPUT_MOVE = 1 << 2;

const MSG_TOUCH = 100;
const MSG_DOWN = 101;
const MSG_MOVE = 102;

// Component that handles touch and mouse events and transforms them into messages 
// that can be subscribed by any other component
class InputManager extends Component {

	constructor(mode = INPUT_TOUCH) {
		super();
		this.mode = mode;
	}

	oninit() {
		this.lastTouch = null;

		let canvas = this.scene.canvas;

		// must be done this way, because we want to
		// remove these listeners while finalization
		this.startHandler = (evt) => {
			this.handleStart(evt);
		};
		this.endHandler = (evt) => {
			this.handleEnd(evt);
		};

		this.moveHandler = (evt) => {
			this.handleMove(evt);
		};

		canvas.addEventListener("touchstart", this.startHandler, false);
		canvas.addEventListener("touchend", this.endHandler, false);
		canvas.addEventListener("mousedown", this.startHandler, false);
		canvas.addEventListener("mouseup", this.endHandler, false);

		if (this.mode |= INPUT_MOVE) {
			canvas.addEventListener("mousemove", this.moveHandler, false);
			canvas.addEventListener("touchmove", this.moveHandler, false);
		}
	}

	finalize() {
		canvas.removeEventListener("touchstart", this.startHandler);
		canvas.removeEventListener("touchend", this.endHandler);
		canvas.removeEventListener("mousedown", this.startHandler);
		canvas.removeEventListener("mouseup", this.endHandler);

		if (this.mode |= INPUT_MOVE) {
			canvas.removeEventListener("mousemove", this.moveHandler);
			canvas.removeEventListener("touchmove", this.moveHandler);
		}
	}

	handleStart(evt) {
		evt.preventDefault();
		let isTouch = typeof (evt.changedTouches) !== "undefined";
		if (isTouch && evt.changedTouches.length == 1) {
			// only single-touch
			this.lastTouch = evt.changedTouches[0];
		} else {
			this.lastTouch = evt;
		}

		if (this.mode |= MSG_DOWN) {
			this.sendmsg(MSG_DOWN, { mousePos: this.getMousePos(this.scene.canvas, evt, isTouch), isTouch: isTouch });
		}
	}

	handleMove(evt) {
		evt.preventDefault();
		let isTouch = typeof (evt.changedTouches) !== "undefined";
		this.sendmsg(MSG_MOVE, { mousePos: this.getMousePos(this.scene.canvas, evt, isTouch), isTouch: isTouch });
	}

	handleEnd(evt) {
		evt.preventDefault();
		var posX, posY;
		let isTouch = typeof (evt.changedTouches) !== "undefined";
		if (this.lastTouch != null) {
			if (isTouch && evt.changedTouches.length == 1) {
				posX = evt.changedTouches[0].pageX;
				posY = evt.changedTouches[0].pageY;

			} else {
				// mouse
				posX = evt.pageX;
				posY = evt.pageY;
			}

			// 10px tolerance should be enough
			if (Math.abs(this.lastTouch.pageX - posX) < 10 &&
				Math.abs(this.lastTouch.pageY - posY) < 10) {
				// at last send the message to all subscribers about this event
				this.sendmsg(MSG_TOUCH, { mousePos: this.getMousePos(this.scene.canvas, evt, isTouch), isTouch: isTouch });
			}
		}
	}

	// Get the mouse position
	getMousePos(canvas, e, isTouch) {
		var rect = canvas.getBoundingClientRect();
		let clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
		let clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
		return {
			posX: Math.round((clientX - rect.left) / (rect.right - rect.left) * canvas.width),
			posY: Math.round((clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
		};
	}
}
