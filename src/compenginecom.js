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
	linear: function (current, start, length) {
		return Math.min(1, Math.max(0, (current - start) / length));
	},
	/**
	 * Calculates easing interpolation
	 * @param {Number} current current value 
	 * @param {Number} start starting value
	 * @param {Number} length length of the interpolation
	 * @returns {Number} calculated value
	 */
	easeinout: function (current, start, length) {
		let pos = Interpolation.linear(current, start, length);
		let posInt = pos < 0.5 ? 2 * pos * pos : -1 + (4 - 2 * pos) * pos;
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

const CMD_BEGIN_REPEAT = 1;
const CMD_END_REPEAT = 2;
const CMD_EXECUTE = 3;
const CMD_BEGIN_WHILE = 4;
const CMD_END_WHILE = 5;
const CMD_BEGIN_INTERVAL = 6;
const CMD_END_INTERVAL = 7;
const CMD_BEGIN_IF = 8;
const CMD_ELSE = 9;
const CMD_END_IF = 10;
const CMD_WAIT_TIME = 11;
const CMD_ADD_COMPONENT = 12;
const CMD_WAIT_FOR_FINISH = 13;
const CMD_WAIT_UNTIL = 14;
const CMD_WAIT_FRAMES = 15;
const CMD_WAIT_FOR_MESSAGE = 16;
const CMD_REMOVE_COMPONENT = 17;
const CMD_REMOVE_GAME_OBJECT_BY_TAG = 18;
const CMD_REMOVE_GAME_OBJECT = 19;


/**
 *  @typedef {{
 * 	key: string,
 * param1: any,
 * param2: any,
 * next: SNode
 * }} SNode
 */

/**
 * Simple stack
 */
class Stack {
	constructor() {
		this.top = null;
		this.size = 0;
	}

	/**
	 * Pushes a new node onto the stack
	 * @param {SNode} node
	 */
	push(node) {
		this.top = node;
		this.size += 1;
	}

	/**
	 * Pops the current node from the stack
	 * @param {SNode} node
	 */
	pop() {
		let temp = this.top;
		this.top = this.top.previous;
		this.size -= 1;
		return temp;
	}

	/**
	 * Returns the node on the top
	 */
	top() {
		return this.top;
	}
}

/**
 * Component that executes a chain of commands during the update loop
 */
class ExecutorComponent extends Component {
	constructor() {
		super();
		this.scopeStack = new Stack();
		// linked list
		this.current = null;
		this.head = null;
		this.tail = null;

		// custom parameters
		this.helpParam = null;
		this.helpParam2 = null;
	}

	/**
	 * Repeats the following part of the chain until endRepeat()
	 * @param {Number} num number of repetitions
	 * @returns {ExecutorComponent}
	 */
	beginRepeat(num) {
		this._enqueue(CMD_BEGIN_REPEAT, num);
		return this;
	}

	/**
	 * Enclosing element for beginRepeat() command
	 * @returns {ExecutorComponent}
	 */
	endRepeat() {
		this._enqueue(CMD_END_REPEAT);
		return this;
	}

	/**
	 * Executes a closure
	 * @param {action} func function to execute 
	 * @returns {ExecutorComponent}
	 */
	execute(func) {
		this._enqueue(CMD_EXECUTE, func);
		return this;
	}

	/**
	 * Repeats the following part of the chain up to the endWhile() 
	 * till the func() keeps returning true 
	 * @param {function} func function that returns either true or false
	 * @returns {ExecutorComponent}
	 */
	beginWhile(func) {
		this._enqueue(CMD_BEGIN_WHILE, func);
		return this;
	}

	/**
	 * Enclosing command for beginWhile()
	 * @returns {ExecutorComponent}
	 */
	endWhile() {
		this._enqueue(CMD_END_WHILE);
		return this;
	}

	/**
	 * Starts an infinite loop that will repeat every num second  
	 * @param {number} num number of seconds to wait
	 * @returns {ExecutorComponent}
	 */
	beginInterval(num) {
		this._enqueue(CMD_BEGIN_INTERVAL, num);
		return this;
	}

	/**
	 * Enclosing command for beginInterval()
	 * @returns {ExecutorComponent}
	 */
	endInterval() {
		this._enqueue(CMD_END_INTERVAL);
		return this;
	}

	/**
	 * Checks an IF condition returned by 'func' and jumps to the next element,
	 * behind the 'else' element or behind the 'endIf' element, if the condition is not met
	 * @param {function} func function that returns either true or false 
	 * @returns {ExecutorComponent}
	 */
	beginIf(func) {
		this._enqueue(CMD_BEGIN_IF, func);
		return this;
	}

	/**
	 * Defines a set of commands that are to be executed if the condition of the current
	 * beginIf() command is not met
	 * @returns {ExecutorComponent}
	 */
	else() {
		this._enqueue(CMD_ELSE);
		return this;
	}

	/**
	 * Enclosing command for beginIf()
	 * @returns {ExecutorComponent}
	 */
	endIf() {
		this._enqueue(CMD_END_IF);
		return this;
	}

	/**
	 * Adds a new component to given game object
	 * @param {GameObject} gameObj 
	 * @param {Component} component 
	 * @returns {ExecutorComponent}
	 */
	addComponent(gameObj, component) {
		this._enqueue(CMD_ADD_COMPONENT, gameObj, component);
		return this;
	}

	/**
	 * Waits given amount of seconds
	 * @param {time} time number of seconds to wait 
	 * @returns {ExecutorComponent}
	 */
	waitTime(time) {
		this._enqueue(CMD_WAIT_TIME, time);
		return this;
	}

	/**
	 * Waits until given component isn't finished
	 * @param {Component} component 
	 * @returns {ExecutorComponent}
	 */
	waitForFinish(component) {
		this._enqueue(CMD_WAIT_FOR_FINISH, component);
		return this;
	}

	/**
	 * Waits until given function keeps returning true
	 * @param {Function} func 
	 * @returns {ExecutorComponent}
	 */
	waitUntil(func) {
		this._enqueue(CMD_WAIT_UNTIL, func);
		return this;
	}

	/**
	 * Waits given number of iterations of update loop
	 * @param {number} num 
	 * @returns {ExecutorComponent}
	 */
	waitFrames(num) {
		this._enqueue(CMD_WAIT_FRAMES, num);
		return this;
	}

	/**
	 * Waits until a message with given key isn't sent
	 * @param {String} action 
	 * @returns {ExecutorComponent}
	 */
	waitForMessage(action) {
		this._enqueue(CMD_WAIT_FOR_MESSAGE, action);
		return this;
	}

	/**
	 * Removes component from given game object
	 * @param {GameObject} gameObj 
	 * @param {Component} cmp 
	 * @returns {ExecutorComponent}
	 */
	removeComponent(gameObj, cmp) {
		this._enqueue(CMD_REMOVE_COMPONENT, gameObj, cmp);
		return this;
	}

	/**
	 * Removes a game object with given tag
	 * @param {String} tag 
	 * @returns {ExecutorComponent}
	 */
	removeGameObjectByTag(tag) {
		this._enqueue(CMD_REMOVE_GAME_OBJECT_BY_TAG, tag);
		return this;
	}

	/**
	 * Removes given game object
	 * @param {GameObject} obj 
	 * @returns {ExecutorComponent}
	 */
	removeGameObject(obj) {
		this._enqueue(CMD_REMOVE_GAME_OBJECT, obj);
		return this;
	}

	onmessage(msg) {
		this.helpParam2 = msg.action;
	}

	update(delta, absolute) {
		if (this.current == null) {
			this.current = this._dequeue();
		}

		if (this.current == null) {
			this.finish();
			return;
		}

		switch (this.current.key) {
			case CMD_BEGIN_REPEAT:
				this.scopeStack.push(this.current);
				this._gotoNextImmediately(delta, absolute);
				break;
			case CMD_END_REPEAT:
				let temp = this.scopeStack.pop();
				if (temp.param2 === undefined) {
					// save param1 (number of repetitions) into temp variable
					// that will decrease over time
					temp.param2 = temp.param1;
				}

				if (--temp.param2 > 0) {
					// jump to the beginning
					this.current = temp;
					this.update(delta, absolute);
				} else {
					// restore the variable
					temp.param2 = temp.param1;
					this._gotoNextImmediately();
				}
				break;
			case CMD_EXECUTE:
				this.current.param1(this);
				this._gotoNextImmediately();
				break;
			case CMD_BEGIN_WHILE:
				this.scopeStack.push(this.current);
				this._gotoNextImmediately();
				break;
			case CMD_END_WHILE:
				let temp2 = this.scopeStack.pop();
				if (temp2.param1()) {
					this.current = temp2;
					this.update(delta, absolute);
				} else {
					this._gotoNextImmediately();
				}
				break;
			case CMD_BEGIN_INTERVAL:
				if (this.helpParam == null) {
					// save the beginning to a help variable and wait
					this.helpParam = absolute;
				} else if (absolute - this.helpParam >= this.current.param1) {
					// proceed
					this.helpParam = null;
					this.scopeStack.push(this.current);
					this._gotoNextImmediately();
				}
				break;
			case CMD_END_INTERVAL:
				this.current = this.scopeStack.pop();
				this.update(delta, absolute);
				break;
			case CMD_BEGIN_IF:
				if (this.current.param1()) {
					// condition fulfilled 
					this._gotoNextImmediately();
					break;
				}

				// condition not fullfiled -> we need to jump to the next ELSE or END-IF node
				let deepCounter = 1;
				while (true) {
					this.current = this._dequeue();
					if (this.current.key == CMD_BEGIN_IF) {
						deepCounter++;
					}
					if (this.current.key == CMD_END_IF) {
						deepCounter--;
					}
					// we need to find the next ELSE of END of the current scope
					// thus, we have to skip all inner IF-ELSE branches
					if ((deepCounter == 1 && this.current.key == CMD_ELSE) ||
						deepCounter == 0 && this.current.key == CMD_END_IF) {
						this._gotoNext();
						break;
					}
				}
				this.update(delta, absolute);
				break;
			case CMD_ELSE:
				// jump to the first END_IF block of the current branch
				let deepCounter2 = 1;
				while (true) {
					this.current = this._dequeue();
					if (this.current.key == CMD_BEGIN_IF) {
						deepCounter2++;
					}
					if (this.current.key == CMD_END_IF) {
						deepCounter2--;
					}
					if (deepCounter2 == 0 && this.current.key == CMD_END_IF) {
						this._gotoNext();
						break;
					}
				}
				this.update(delta, absolute);
				break;
			case CMD_END_IF:
				this._gotoNextImmediately();
				break;
			case CMD_WAIT_TIME:
				if (this.helpParam == null) {
					this.helpParam = absolute;
				} else if (absolute - this.helpParam >= this.current.param1) {
					this.helpParam = null;
					this._gotoNextImmediately();
				}
				break;
			case CMD_ADD_COMPONENT:
				this.current.param1.addComponent(this.current.param2);
				this._gotoNextImmediately();
				break;
			case CMD_WAIT_FOR_FINISH:
				if (this.current.param1.isFinished) {
					this._gotoNextImmediately();
				}
				break;
			case CMD_WAIT_UNTIL:
				if (!this.current.param1()) {
					this._gotoNext();
				}
				break;
			case CMD_WAIT_FRAMES:
				if (this.helpParam == null) {
					this.helpParam = 0;
				} else if (++this.helpParam >= this.current.param1) {
					this.helpParam = null;
					this._gotoNext();
				}
				break;
			case CMD_WAIT_FOR_MESSAGE:
				// helpParam indicates that this component has already subscribed the message
				if (this.helpParam == true) {
					if (this.helpParam2 == this.current.param1) {
						// got message -> unsubscribe and proceed
						this.unsubscribe(this.current.param1);
						this.helpParam = this.helpParam2 = null;
						this._gotoNextImmediately();
					}
				} else {
					// just subscribe and wait
					this.helpParam = true;
					this.helpParam2 = null;
					this.subscribe(this.current.param1);
				}
				break;
			case CMD_REMOVE_COMPONENT:
				this.current.param1.removeComponentByName(this.current.param2);
				this._gotoNextImmediately();
				break;
			case CMD_REMOVE_GAME_OBJECT_BY_TAG:
				let obj = this.scene.findFirstGameObjectByTag(this.current.param1);
				if (obj != null) {
					obj.remove();
				}
				this._gotoNextImmediately();
				break;
			case CMD_REMOVE_GAME_OBJECT:
				this.current.param1.remove();
				this._gotoNextImmediately();
				break;
		}
	}

	_enqueue(key, param1, param2) {
		var node = {
			key,
			param1,
			param2,
			next: null,
		};

		if (this.current != null && this.current != this.head) {
			// already running -> append to the current node
			let temp = this.current.next;
			this.current.next = node;
			node.next = temp;
			node.previous = this.current;
			temp.previous = node;
		} else {
			// not yet running -> append to the tail
			if (this.head == null) {
				this.head = this.tail = node;
			} else {
				this.tail.next = node;
				node.previous = this.tail;
				this.tail = node;
			}

			if (this.current == null) {
				this.current = this.head;
			}
		}
	}

	_dequeue() {
		if (this.current == null || this.current.next == null) {
			return null;
		} else {
			this.current = this.current.next;
		}
		return this.current;
	}

	_gotoNext() {
		this.current = this.current.next;
	}

	_gotoNextImmediately(delta, absolute) {
		this.current = this.current.next;
		this.update(delta, absolute);
	}
}