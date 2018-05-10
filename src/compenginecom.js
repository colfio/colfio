/**
 * @file Set of basic components for ECS engine
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

/**
 * @typedef {typeof import('./compengine.js').Mesh} Mesh
 * @typedef {typeof import('./compengine.js').Component} Component
 */

/**
 * Debugging component that renders the whole scene graph
 */
class DebugComponent extends Component {

	/**
	 * @param {Boolean} displayBBox if true, the component will also display bounding boxes 
	 * @param {HTMLElement} targetHtmlElement target html element the debug component should render to
	 */
	constructor(displayBBox, targetHtmlElement) {
		super();
		this.targetHtmlElement = targetHtmlElement;
		this.strWrapper = { str: "" };
		this.displayBBox = displayBBox;
	}

	oninit() {
		if (this.owner.parent != null) {
			throw new Error("DebugComponent must be attached to the very root!");
		}

		// subscribe to all messages
		this.subscribe(MSG_ALL);

		if (this.displayBBox == true) {
			this.scene.afterDraw = () => {
				let strokeStyle = this.scene.canvasCtx.strokeStyle;
				this.scene.canvasCtx.beginPath();
				this.scene.canvasCtx.strokeStyle = "red";
				this._drawBoundingBox(this.scene.canvasCtx, this.owner);
				this.scene.canvasCtx.stroke();
				this.scene.canvasCtx.strokeStyle = strokeStyle;
			}
		}
	}

	onmessage(msg) {
		let ownerTag = msg.gameObject != null ? msg.gameObject.tag : "";
		if (typeof (msg.action) == "string") {
			console.log(msg.action + " >> " + ownerTag);
		}
	}

	update(delta, absolute) {
		this.strWrapper.str = "";
		this._processNode(this.owner, this.strWrapper);
		this.targetHtmlElement.innerHTML = this.strWrapper.str;
	}


	_drawBoundingBox(ctx, node) {
		if (node.hasState(STATE_DRAWABLE)) {
			let bb = node.bbox;
			let posX = bb.topLeftX * UNIT_SIZE;
			let posY = bb.topLeftY * UNIT_SIZE;
			let size = bb.getSize();

			if (size.width != 0 && size.height != 0) {
				ctx.rect(posX, posY, size.width * UNIT_SIZE, size.height * UNIT_SIZE);
			}

			ctx.rect(node.trans.absPosX * UNIT_SIZE, node.trans.absPosY * UNIT_SIZE, 10, 10);
		}
		for (let [id, child] of node.children) {
			this._drawBoundingBox(ctx, child);
		}
	}

	_setPadding(padding) {
		let otp = "";
		for (let i = 0; i < padding; i++) {
			otp = otp.concat("&nbsp");
		}
		return otp;
	}

	_processNode(node, strWrapper, padding = 0) {

		// transform:
		strWrapper.str += "<strong><span style=\"color:red\">";
		strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2)
			+ `rel:[${node.trans.posX.toFixed(2)},${node.trans.posY.toFixed(2)}]|abs:[${node.trans.absPosX.toFixed(2)},${node.trans.absPosY.toFixed(2)}]|rot: ${node.trans.rotation.toFixed(2)}|z: ${node.zIndex}`
			+ "<br>");
		strWrapper.str += "</span></strong>";

		// mesh
		strWrapper.str += "<strong><span style=\"color:purple\">";
		strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2)
			+ `size:[${node.mesh.width.toFixed(2)} x ${node.mesh.height.toFixed(2)}]`
			+ "<br>");
		strWrapper.str += "</span></strong>";

		// attributes
		for (let [key, attr] of node.attributes) {
			strWrapper.str += "<strong><span style=\"color:red\">";
			strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2)
				+ `${key} => ${attr.toString()}`
				+ "<br>");
			strWrapper.str += "</span></strong>";
		}

		// components
		for (let cmp of node.components) {
			strWrapper.str += "<span style=\"color:blue\">";
			strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) + cmp.constructor.name + "<br>");
			strWrapper.str += "</span>";
		}

		// children
		for (let [id, child] of node.children) {
			strWrapper.str += "<span style=\"color:green\">";
			strWrapper.str = strWrapper.str.concat(this._setPadding(padding)
				+ `${child.id}:${child.tag}` + "<br>");
			this._processNode(child, strWrapper, padding + 4);
			strWrapper.str += "</span>";
		}
	}
}

/**
 * Rendering component for all basic meshes
 */
class BasicRenderer extends Component {

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 */
	draw(ctx) {
		let mesh = this.owner.mesh;
		let alpha = ctx.globalAlpha;

		ctx.globalAlpha = mesh.alpha;
		if (mesh instanceof RectMesh) {
			this._drawRectMesh(ctx, mesh);
		} else if (mesh instanceof TextMesh) {
			this._drawTextMesh(ctx, mesh);
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
		ctx.globalAlpha = alpha;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {Mesh} mesh 
	 */
	_drawRectMesh(ctx, mesh) {
		let trans = this.owner.trans;
		let posX = trans.absPosX * UNIT_SIZE;
		let posY = trans.absPosY * UNIT_SIZE;
		let originX = trans.rotationOffsetX * UNIT_SIZE;
		let originY = trans.rotationOffsetY * UNIT_SIZE;
		ctx.translate(posX, posY);
		ctx.rotate(trans.absRotation);
		let fillStyle = ctx.fillStyle;
		ctx.fillStyle = mesh.fillStyle;
		ctx.fillRect(-originX, -originY, mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE);
		ctx.fillStyle = fillStyle;
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX), -(posY));
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {Mesh} mesh 
	 */
	_drawTextMesh(ctx, mesh) {
		let trans = this.owner.trans;
		let posX = trans.absPosX * UNIT_SIZE;
		let posY = trans.absPosY * UNIT_SIZE;
		let originX = trans.rotationOffsetX * UNIT_SIZE;
		let originY = trans.rotationOffsetY * UNIT_SIZE;
		ctx.translate(posX, posY);
		ctx.rotate(trans.absRotation);
		let fillStyle = ctx.fillStyle;
		let textAlign = ctx.textAlign;
		ctx.fillStyle = mesh.fillStyle;
		ctx.textAlign = mesh.textAlign;
		ctx.font = mesh.font;
		ctx.fillText(mesh.text, -originX, -originY);
		ctx.fillStyle = fillStyle;
		ctx.textAlign = textAlign;
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX), -(posY));
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {Mesh} mesh 
	 */
	_drawImageMesh(ctx, mesh) {
		let trans = this.owner.trans;
		let posX = trans.absPosX * UNIT_SIZE;
		let posY = trans.absPosY * UNIT_SIZE;
		let originX = trans.rotationOffsetX * UNIT_SIZE;
		let originY = trans.rotationOffsetY * UNIT_SIZE;
		ctx.translate(posX, posY);
		ctx.rotate(trans.absRotation);
		ctx.drawImage(mesh.image, 0, 0, mesh.image.width, mesh.image.height, -originX, -originY, mesh.image.width, mesh.image.height);
		ctx.rotate(-trans.absRotation);
		ctx.translate(-(posX), -(posY));
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {Mesh} mesh 
	 */
	_drawSpriteMesh(ctx, mesh, trans) {
		let posX = trans.absPosX * UNIT_SIZE;
		let posY = trans.absPosY * UNIT_SIZE;
		let originX = trans.rotationOffsetX * UNIT_SIZE;
		let originY = trans.rotationOffsetY * UNIT_SIZE;
		ctx.translate(posX, posY);
		ctx.rotate(trans.absRotation);
		ctx.drawImage(mesh.image, mesh.offsetX, mesh.offsetY,
			mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE, -originX, -originY, mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE);
		ctx.rotate(-trans.absRotation);
		ctx.translate(-posX, -posY);
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {Mesh} mesh 
	 */
	_drawMultiSpriteMesh(ctx, mesh) {
		for (let [id, sprite] of mesh.sprites) {
			this.drawSpriteMesh(ctx, sprite, sprite.trans);
		}
	}
}

/**
 * Interpolation object
 */
Interpolation = {
	/**
	 * Calculates linear interpolation
	 * @param {Number} current current value 
	 * @param {Number} start starting value
	 * @param {Number} length length of the interpolation
	 * @returns {Number} calculated value
	 */
	linear: function(current, start, length) {
		return Math.min(1, Math.max(0, (current - start) / length));
	},
	/**
	 * Calculates easing interpolation
	 * @param {Number} current current value 
	 * @param {Number} start starting value
	 * @param {Number} length length of the interpolation
	 * @returns {Number} calculated value
	 */
	easeinout: function(current, start, length) {
		let pos = Interpolation.linear(current, start, length);
		let posInt =  pos < 0.5 ? 2*pos*pos : -1+(4-2*pos)*pos;
		return Math.min(1, Math.max(0, posInt));	
	}
};

/**
 * Base class for animations
 */
class Animation extends Component {
	// loops = 0 for infinite!
	constructor(duration, goBack = false, loops = 1) {
		super();
		this.duration = duration;
		this.goBack = goBack;
		this.goingBack = false;
		this.loops = loops;
		this.currentLoop = 0;
		this.startTime = 0;

		this.interpolation = Interpolation.linear;
	}

	update(delta, absolute) {
		if (this.startTime == 0) {
			this.startTime = absolute;
		}

		if (!this.goingBack) {
			// going forward
			let percent = this.interpolation(absolute, this.startTime, this.duration);
			this._applyAnim(percent, false);

			if (percent >= 1) {
				if (this.goBack) {
					this.goingBack = true;
					this.startTime = absolute;
				} else {
					this.finish();
				}
			}
		} else {
			// going back (only if goBack == true)
			let percent = this.interpolation(absolute, this.startTime, this.duration);
			this._applyAnim(percent, true);

			if (percent >= 1) {
				if (++this.currentLoop != this.loops) {
					this.goingBack = !this.goingBack;
					this.startTime = absolute;
				} else {
					this.finish();
				}
			}
		}
	}

	_applyAnim(percent, inverted) {
		// override in child classes
		throw new Error('Abstract class Animation can\'t be instantiated directly!');
	}
}

/**
 * Translate animation component, moves an object between two points
 */
class TranslateAnimation extends Animation {
	/**
	 * @param {Number} srcPosX x-axis position of the source 
	 * @param {Number} srcPosY y-axis position of the source
	 * @param {Number} targetPosX x-axis position of the target
	 * @param {Number} targetPosY y-axis position of the target
	 * @param {Number} duration duration of the animation
	 * @param {Boolean} goBack if true, the animation will play in reverse order as well
	 * @param {Boolean} loops if true, the animation will loop
	 */
	constructor(srcPosX, srcPosY, targetPosX, targetPosY, duration, goBack = false, loops = 1) {
		super(duration, goBack, loops);
		this.srcPosX = srcPosX;
		this.srcPosY = srcPosY;
		this.targetPosX = targetPosX;
		this.targetPosY = targetPosY;
	}

	oninit() {
		super.oninit();
		this.owner.trans.posX = this.srcPosX;
		this.owner.trans.posY = this.srcPosY;
	}

	_applyAnim(percent, inverted) {
		if (inverted) {
			this.owner.trans.posX = this.targetPosX + percent * (this.srcPosX - this.targetPosX);
			this.owner.trans.posY = this.targetPosY + percent * (this.srcPosY - this.targetPosY);
		} else {
			this.owner.trans.posX = this.srcPosX + percent * (this.targetPosX - this.srcPosX);
			this.owner.trans.posY = this.srcPosY + percent * (this.targetPosY - this.srcPosY);
		}
	}
}

/**
 * Rotation animation component
 */
class RotationAnimation extends Animation {
	/**
	 * @param {Number} srcRot source rotation value
	 * @param {Number} targetRot target rotation value
	 * @param {Number} duration duration of the animation
	 * @param {Boolean} goBack if true, the animation will play in reverse order as well
	 * @param {Boolean} loops if true, the animation will loop
	 */
	constructor(srcRot, targetRot, duration, goBack = false, loops = 1) {
		super(duration, goBack, loops);
		this.srcRot = srcRot;
		this.targetRot = targetRot;
	}

	oninit() {
		super.oninit();
		this.owner.trans.rotation = this.srcRot;
	}

	_applyAnim(percent, inverted) {
		if (inverted) {
			this.owner.trans.rotation = this.targetRot + percent * (this.srcRot - this.targetRot);
		} else {
			this.owner.trans.rotation = this.srcRot + percent * (this.targetRot - this.srcRot);
		}
	}
}

/**
 * Flag for TOUCH events handling
 */
const INPUT_TOUCH = 1;
/**
 * Flag for MOUSE_DOWN events handling
 */
const INPUT_DOWN = 1 << 1;
/**
 * Flag for MOUSE_MOVE events handling
 */
const INPUT_MOVE = 1 << 2;
/**
 * Flag for MOUSE_RELEASE events handling
 */
const INPUT_UP = 1 << 3;

/**
 * Message code for touch event
 */
const MSG_TOUCH = 100;
/**
 * Message code for mouse_down event
 */
const MSG_DOWN = 101;
/**
 * Message code for mouse_move event
 */
const MSG_MOVE = 102;
/**
 * Message code for mouse_up event
 */
const MSG_UP = 103;

/**
 * Component that handles touch and mouse events and transforms them into messages 
 * that can be subscribed by any other component
 */
class InputManager extends Component {

	/**
	 * Mode that will be captured
	 * Possible values: INPUT_TOUCH, INPUT_DOWN, INPUT_MOVE, INPUT_MOVE and any bit-wise OR combination of them 
	 */
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
		if (this.mode |= INPUT_UP) {
			canvas.addEventListener("mouseup", this.endHandler, false);
		}
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
				if (isTouch) {
					this.sendmsg(MSG_TOUCH, { mousePos: this.getMousePos(this.scene.canvas, evt, isTouch), isTouch: isTouch });
				} else {
					this.sendmsg(MSG_UP, { mousePos: this.getMousePos(this.scene.canvas, evt, isTouch), isTouch: isTouch });
				}
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
