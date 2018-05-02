// Rendering component that can render a single sprite
class SpriteRenderer extends Component {

    oninit() {
        this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
	}
	
	drawSprite(ctx, sprite, trans){
        let posX = trans.absPosX * this.scene.unitSize;
        let posY = trans.absPosY * this.scene.unitSize;
        let originX = trans.rotationOffsetX * this.scene.unitSize;
        let originY = trans.rotationOffsetY * this.scene.unitSize;

        ctx.translate(posX + originX, posY + originY);
        ctx.rotate(trans.absRotation);

        ctx.drawImage(sprite.image, sprite.offsetX, sprite.offsetY,
            sprite.width, sprite.height, -originX, -originY, sprite.width, sprite.height);
        ctx.rotate(-trans.absRotation);
        ctx.translate(-(posX + originX), -(posY + originY));
	}

    draw(ctx) {
        let sprite = this.owner.mesh;
        this.drawSprite(ctx, sprite, this.owner.trans);
    }
}

// Rendering component that can render a collection of sprites
class MultiSpriteRenderer extends SpriteRenderer {
    oninit() {
        this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
    }

    draw(ctx) {
        let spriteCollection = this.owner.mesh;

        for (let [id, sprite] of spriteCollection.sprites) {
			this.drawSprite(ctx, sprite, sprite.trans);
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
		}
	}

	finalize() {
		canvas.removeEventListener("touchstart", this.startHandler);
		canvas.removeEventListener("touchend", this.endHandler);
		canvas.removeEventListener("mousedown", this.startHandler);
		canvas.removeEventListener("mouseup", this.endHandler);

		if (this.mode |= INPUT_MOVE) {
			canvas.addEventListener("mousemove", this.moveHandler);
		}
	}

	handleStart(evt) {
		evt.preventDefault();
		if (typeof (evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
			// only single-touch
			this.lastTouch = evt.changedTouches[0];
		} else {
			this.lastTouch = evt;
		}

		if (this.mode |= MSG_DOWN) {
			this.sendmsg(MSG_DOWN, this.getMousePos(this.scene.canvas, evt));
		}
	}

	handleMove(evt) {
		evt.preventDefault();
		this.sendmsg(MSG_MOVE, this.getMousePos(this.scene.canvas, evt));
	}

	handleEnd(evt) {
		evt.preventDefault();
		var posX, posY;
		if (this.lastTouch != null) {
			if (typeof (evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
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
				this.sendmsg(MSG_TOUCH, this.getMousePos(this.scene.canvas, evt));
			}
		}
	}

	// Get the mouse position
	getMousePos(canvas, e) {
		var rect = canvas.getBoundingClientRect();
		return {
			posX: Math.round((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
			posY: Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
		};
	}
}
