/**
 * @file Component-based micro-engine, implements ECS pattern (Entity-Component-System)
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */


// message that is sent when a new object is added
const MSG_OBJECT_ADDED = "OBJECT_ADDED";
// message that is sent when an existing object is removed
const MSG_OBJECT_REMOVED = "OBJECT_REMOVED";
// special message for global subscribers, usually for debugging
const MSG_ALL = "ALL";

// state for inactive components
const STATE_INACTIVE = 0;
// state for updatable components
const STATE_UPDATABLE = 2 ^ 0;
// state for drawable components
const STATE_DRAWABLE = 2 ^ 1;
// state for components that listen to some messages
const STATE_LISTENING = 2 ^ 2;

// unit size in px - all attributes are calculated against this size
var UNIT_SIZE = 1;

/**
 * A scene that keeps a collection of all game objects
 * and calls draw/update functions on them
 */
class Scene {

	/**
	 * @param {Canvas} canvas 
	 */
	constructor(canvas) {
		if (Scene.scene) {
			return Scene.scene;
		}

		Scene.scene = this;

		/**
		 * Link to canvas
		 * @type {Canvas}
		 */
		this.canvas = canvas;
		/**
		 * Link to canvas rendering context
		 * @type {CanvasRenderingContext2D}
		 */
		this.canvasCtx = canvas.getContext('2d');

		/**
		 * Function is called before update
		 * @type {(number, number) => {}}
		 */
		this.beforeUpdate = null;
		/**
		 * Function is called after update
		 * @type {(number, number) => {}}
		 */
		this.afterUpdate = null;
		/**
		 * Function is called before draw
		 * @type {() => {}}
		 */
		this.beforeDraw = null;
		/**
		 * Function is called after draw
		 * @type {() => {}}
		 */
		this.afterDraw = null;

		this.clearScene();
	}

	/**
	 * Submits changes and applies added or removed objects components
	 */
	submitChanges() {
		// submit upon the root recursively
		this.root.submitChanges(true);
	}

	/**
	 * Adds a new function that will be invoked after given amount of time
	 * @param {number} delay delay in seconds 
	 * @param {Function} action () => {} a function pointer with no arguments
	 */
	addPendingInvocation(delay, action) {
		this.pendingInvocations.push({
			delay: delay,
			time: 0,
			action: action
		});
	}

	/**
	 * Adds a new global component
	 * @param {Component} cmp 
	 */
	addGlobalComponent(cmp) {
		this.root.addComponent(cmp);
	}

	/**
	 * Removes an existing  global component
	 * @param {Component} cmp 
	 */
	removeGlobalComponent(cmp) {
		this.root.removeComponent(cmp);
	}

	/**
	 * Adds a new game object
	 * @param {GameObject} obj 
	 */
	addGlobalGameObject(obj) {
		this.root.addGameObject(obj);
	}

	/**
	 * Removes game object from the scene
	 * @param {GameObject} obj 
	 */
	removeGlobalGameObject(obj) {
		this.root.removeGameObject(obj);
	}

	/**
	 * Adds a new global attribute
	 * @param {string} key 
	 * @param {any} val 
	 */
	addGlobalAttribute(key, val) {
		this.root.addAttribute(key, val);
	}

	/**
	 * Gets global attribute by its key
	 * @param {string} key 
	 */
	getGlobalAttribute(key) {
		return this.root.getAttribute(key);
	}

	/**
	 * Removes global attribute by its key
	 * @param {string} key 
	 */
	removeGlobalAttribute(key) {
		this.root.removeAttribute(key);
	}

	/**
	 * Finds all game objects by their tag
	 * @param {String} tag tag of the object
	 * @returns {Array<GameObject>} 
	 */
	findAllObjectsByTag(tag) {
		let result = new Array();
		if (this.gameObjectTags.has(tag)) {
			for (let [key, gameObject] of this.gameObjectTags.get(tag)) {
				result.push(gameObject);
			}
		}

		return result;
	}

	/**
	 * Finds a first object with a given tag
	 * @param {String} tag
	 * @returns {GameObject} 
	 */
	findFirstObjectByTag(tag) {
		if (this.gameObjectTags.has(tag)) {
			for (let [key, gameObject] of this.gameObjectTags.get(tag)) {
				return gameObject; // return the first one
			}
		}
		return null;
	}

	/**
	 * Finds game object by secondary id
	 * @param {number} id 
	 * @returns {GameObject}
	 */
	findObjectBySecondaryId(id) {
		if (this.gameObjectSecIds.has(id)) {
			return this.gameObjectSecIds.get(id);
		}
		return null;
	}

	/**
	 * Finds all objects that have given flag set
	 * @param {number} flag 
	 * @returns {Array<GameObject>} 
	 */
	findAllObjectsByFlag(flag) {
		let result = new Array();
		for (let [key, gameObject] of this.gameObjects) {
			if (gameObject.hasFlag(flag)) {
				result.push(gameObject);
			}
		}
		return result;
	}

	/**
	 * Finds the first object that has given flag set
	 * @param {number} flag 
	 * @returns 
	 */
	findFirstObjectByFlag(flag) {
		for (let [key, gameObject] of this.gameObjects) {
			if (gameObject.hasFlag(flag)) {
				return gameObject;
			}
		}
	}

	/**
	 * Clears up the whole scene
	 */
	clearScene() {
		if (this.gameObjects !== undefined) {
			// call the finalization function
			for (let [key, gameObj] of this.gameObjects) {
				for (let component of gameObj.components) {
					component.finalize();
				}
			}
		}

		this.root = new GameObject("root");
		this.root.scene = this;
		this.root.mesh.width = this.canvas.width / UNIT_SIZE;
		this.root.mesh.height = this.canvas.height / UNIT_SIZE;

		// message action keys and all subscribers that listens to all these actions
		this.subscribers = new Map();
		// component ids and list of all actions they listen to
		this.subscribedMessages = new Map();
		// collection of all game objects, mapped by their tag and then by their ids
		this.gameObjectTags = new Map();
		// collection of all game objects, mapped by their ids
		this.gameObjects = new Map();
		// collection of all game object, mapped by their secondary ids
		this.gameObjectSecIds = new Map();
		// game objects sorted by z-index, used for drawing
		this.sortedObjects = new Array();

		// functions that should be invoked with some delay
		this.pendingInvocations = new Array();
	}

	getWidth() {
		return this.root.mesh.width;
	}

	setWidth(width) {
		this.root.mesh.width = width;
	}

	getHeight() {
		return this.root.mesh.height;
	}

	setHeight(height) {
		this.root.mesh.height = height;
	}

	/**
	 * Executes the update cycle
	 * @param {number} delta 
	 * @param {number} absolute 
	 */
	update(delta, absolute) {
		if (this.beforeUpdate != null) {
			this.beforeUpdate(delta, absolute);
		}

		// update
		this.root.update(delta, absolute);
		this.submitChanges(false);

		// execute pending invocations
		var i = this.pendingInvocations.length;
		while (i--) {
			let invocation = this.pendingInvocations[i];
			invocation.time += delta;

			if (invocation.time >= invocation.delay) {
				invocation.action();
				this.pendingInvocations.splice(i, 1);
			}
		}

		if (this.afterUpdate != null) {
			this.afterUpdate(delta, absolute);
		}
	}

	/**
	 * Executes the drawing cycle
	 */
	draw() {
		if (this.beforeDraw != null) {
			this.beforeDraw();
		}

		for (let gameObject of this.sortedObjects) {
			gameObject.draw(this.canvasCtx);
		}

		if (this.afterDraw != null) {
			this.afterDraw();
		}
	}

	/**
	 * Sends a message
	 * @param {string|number} action action key 
	 * @param {any} data any data 
	 */
	sendmsg(action, data) {
		this._sendmsg(new Msg(action, null, null, data));
	}

	// sends message to all subscribers
	_sendmsg(msg) {
		if (this.subscribers.has(msg.action)) {
			// get all subscribed components
			let subscribedComponents = this.subscribers.get(msg.action);
			for (let [key, component] of subscribedComponents) {
				// send message
				if (component.owner.hasState(STATE_LISTENING)) {
					component.onmessage(msg);
				}
			}
		}
		if (this.subscribers.has(MSG_ALL)) {
			let globalSubs = this.subscribers.get(MSG_ALL);
			for (let [key, component] of globalSubs) {
				if (component.owner.hasState(STATE_LISTENING)) {
					component.onmessage(msg);
				}
			}
		}
	}

	/**
	 * Subscribes given component for messaging system
	 * @param {string} msgKey 
	 * @param {Component} component 
	 */
	_subscribeComponent(msgKey, component) {
		var subs = this.subscribers.get(msgKey);
		if (subs === undefined) {
			subs = new Map();
			this.subscribers.set(msgKey, subs);
		}

		subs.set(component.id, component);

		// save into the second collection as well
		if (!this.subscribedMessages.has(component.id)) {
			this.subscribedMessages.set(component.id, new Array());
		}

		this.subscribedMessages.get(component.id).push(msgKey);
	}

	// adds a new game object internally
	_addGameObject(obj) {
		// fill all collections
		if (!this.gameObjectTags.has(obj.tag)) {
			this.gameObjectTags.set(obj.tag, new Map());
		}

		this.gameObjectTags.get(obj.tag).set(obj.id, obj);
		this.gameObjects.set(obj.id, obj);
		this.gameObjectSecIds.set(obj.secondaryId, obj);

		// keep the third collection sorted by z-index
		let fnd = this.sortedObjects.binaryFind(obj, (current, search) => {
			if (current.zIndex == search.zIndex)
				return 0;
			else if (current.zIndex > search.zIndex)
				return 1;
			else
				return -1;
		});

		this.sortedObjects.splice(fnd.index, 0, obj);

		// notify subscribers that a new object has been added to the scene
		this._sendmsg(new Msg(MSG_OBJECT_ADDED, null, obj));
	}

	// immediately removes a given game object
	_removeGameObject(obj) {
		this.gameObjectTags.get(obj.tag).delete(obj.id);
		this.gameObjectSecIds.delete(obj.secondaryId);
		this.gameObjects.delete(obj.id);

		for (let i = 0; i < this.sortedObjects.length; i++) {
			if (this.sortedObjects[i].id == obj.id) {
				this.sortedObjects.splice(i, 1);
				break;
			}
		}
		// send message that the game object has been removed
		this._sendmsg(new Msg(MSG_OBJECT_REMOVED, null, obj));
	}

	/**
	 * @param {Component} component 
	 * @param {string} action 
	 */
	_unsubscribeComponent(msgKey, component) {
		var subs = this.subscribers.get(msgKey);
		if (subs !== undefined) {
			subs.delete(component.id);
		}
		this.subscribedMessages.delete(component.id);
	}

	/**
	 * Removes a component and all subscribed links
	 * @param {Component} component 
	 */
	_removeComponent(component) {
		this.subscribedMessages.delete(component.id);

		if (this.subscribedMessages.has(component.id)) {
			let allMsgKeys = this.subscribedMessages.get(component.id);
			for (let msgKey of allMsgKeys) {
				this.subscribers.get(msgKey).delete(component.id);
			}
		}
		this.subscribedMessages.delete(component.id);
	}
}

/**
 * Bit array of flags
 */
class Flags {
	constructor() {
		// flag array 0-128
		this.flags1 = 0;
		this.flags2 = 0;
		this.flags3 = 0;
		this.flags4 = 0;
	}

	/**
	 * Returns true, if a flag is set
	 * @param {number} flag 
	 * @returns {Boolean} 
	 */
	hasFlag(flag) {
		let index = this._getFlagIndex(flag);
		let offset = this._getFlagOffset(flag);
		let binary = 1 << offset;

		if (index <= 3) {
			switch (index) {
				case 0: return (this.flags1 & binary) == binary;
				case 1: return (this.flags2 & binary) == binary;
				case 2: return (this.flags3 & binary) == binary;
				case 3: return (this.flags4 & binary) == binary;
			}
		} else {
			throw new Error("Flag values beyond 128 are not supported");
		}
	}

	/**
	 * Switches flag values
	 * @param {number} flag1 
	 * @param {number} flag2
	 */
	switchFlag(flag1, flag2) {
		let hasFlag2 = this.hasFlag(flag2);

		if (this.hasFlag(flag1)) this.setFlag(flag2);
		else this.resetFlag(flag2);

		if (hasFlag2) this.setFlag(flag1);
		else this.resetFlag(flag1);
	}

	/**
	 * Sets given flag
	 * @param {number} flag 
	 */
	setFlag(flag) {
		this._changeFlag(true, flag);
	}

	/**
	 * Resets given flag to 0
	 * @param {number} flag 
	 */
	resetFlag(flag) {
		this._changeFlag(false, flag);
	}

	_getFlagIndex(flag) {
		return parseInt(flag / 32); // sizeof 32bit int
	}

	_getFlagOffset(flag) {
		return flag % 32; // sizeof 32bit int
	}

	_changeFlag(set, flag) {
		let index = this._getFlagIndex(flag);
		let offset = this._getFlagOffset(flag);
		let binary = 1 << offset;

		if (index <= 3) {
			switch (index) {
				case 0: if (set) (this.flags1 |= binary); else (this.flags1 &= ~binary);
				case 1: if (set) (this.flags2 |= binary); else (this.flags2 &= ~binary);
				case 2: if (set) (this.flags3 |= binary); else (this.flags3 &= ~binary);
				case 3: if (set) (this.flags4 |= binary); else (this.flags4 &= ~binary);
			}
		} else {
			throw new Error("Flag values beyond 128 are not supported");
		}
	}
}

/**
 * Bounding boxes
 */
class BBox {

	/**
	 * @param {number} topLeftX 
	 * @param {number} topLeftY 
	 * @param {number} bottomRightX 
	 * @param {number} bottomRightY 
	 */
	constructor(topLeftX = 0, topLeftY = 0, bottomRightX = 0, bottomRightY = 0) {
		/**
		 * TopLeft absolute coordinate on X axis
		 * @type {number}
		 */
		this.topLeftX = topLeftX;
		/**
		 * TopLeft absolute coordinate on Y axis
		 * @type {number}
		 */
		this.topLeftY = topLeftY;
		/**
		 * BottomRight coordinate on X axis
		 * @type {number}
		 */
		this.bottomRightX = bottomRightX;
		/**
		 * BottomRight coordinate on Y axis
		 * @type {number}
		 */
		this.bottomRightY = bottomRightY;
	}

	/**
	 * Gets size of the bounding box
	 * @returns {number}
	 */
	getSize() {
		return { width: (this.bottomRightX - this.topLeftX), height: (this.bottomRightY - this.topLeftY) };
	}

	/**
	 * Gets center of the bounding box
	 * @returns {{posX: number, posY: number}}
	 */
	getCenter() {
		let size = this.getSize();
		return { posX: (this.topLeftX + size.width / 2), posY: (this.topLeftY + size.height / 2) };
	}

	/**
	 * Returns true, if the box intersects with another box
	 * @param {BBox} other other bounding box 
	 * @param {number} tolerance tolerance in number of units
	 * @returns {Boolean}
	 */
	intersects(other, tolerance = 0) {
		return this.horizontalIntersection(other) >= -tolerance && this.verticalIntersection(other) >= -tolerance;
	}

	/**
	 * Calculates horizontal intersection with another bounding box
	 * @param {BBox} other 
	 * @returns {number}
	 */
	horizontalIntersection(other) {
		return Math.min(other.bottomRightX, this.bottomRightX) - Math.max(other.topLeftX, this.topLeftX);
	}

	/**
	 * Calculates vertical intersection with another bounding box
	 * @param {BBox} other 
	 * @returns {number}
	 */
	verticalIntersection(other) {
		return Math.min(other.bottomRightY, this.bottomRightY) - Math.max(other.topLeftY, this.topLeftY);
	}

	/**
	 * Updates the bounding box according to the transformation entity
	 * @param {Trans} trans 
	 * @param {Mesh} mesh 
	 */
	update(trans, mesh) {
		if (trans.absRotation != 0) {
			let boxWidth = mesh.width * Math.abs(Math.cos(trans.absRotation)) + mesh.height * Math.abs(Math.sin(trans.absRotation));
			let boxHeight = mesh.height * Math.abs(Math.cos(trans.absRotation)) + mesh.width * Math.abs(Math.sin(trans.absRotation));

			let parentTrans = trans;

			let absPosX = parentTrans.absPosX - parentTrans.rotationOffsetX + mesh.width / 2;
			let absPosY = parentTrans.absPosY - parentTrans.rotationOffsetY + mesh.height / 2;
			let distX = (absPosX - parentTrans.absPosX);
			let distY = (absPosY - parentTrans.absPosY);
			let length = Math.sqrt(distX * distX + distY * distY);

			let angle = parentTrans.absRotation + Math.atan2(distY, distX);
			let rotPosX = length * Math.cos(angle);
			let rotPosY = length * Math.sin(angle);

			absPosX = parentTrans.absPosX + rotPosX;
			absPosY = parentTrans.absPosY + rotPosY;

			this.topLeftX = absPosX - boxWidth / 2;
			this.topLeftY = absPosY - boxHeight / 2;
			this.bottomRightX = this.topLeftX + boxWidth;
			this.bottomRightY = this.topLeftY + boxHeight;
		} else {
			this.topLeftX = trans.absPosX - trans.rotationOffsetX;
			this.topLeftY = trans.absPosY - trans.rotationOffsetY;
			this.bottomRightX = this.topLeftX + mesh.width;
			this.bottomRightY = this.topLeftY + mesh.height;
		}
	}
}

/**
 * Base class for all meshes
 */
class Mesh {
	/**
	 * @param {number} width 
	 * @param {number} height 
	 */
	constructor(width, height) {
		/**
		 * Alpha value 
		 * @type {number}
		 */
		this.alpha = 1.0;
		/**
		 * Relative width of the mesh 
		 * @type {number}
		 */
		this.width = width;
		/**
		 * Relative height of the mesh
		 * @type {number}
		 */
		this.height = height;
	}

	_updateTransform(trans) {
		// override where necessary
	}
}

/**
 * Mesh for rectangles
 */
class RectMesh extends Mesh {
	constructor(fillStyle, width, height) {
		super(width, height);
		/**
		 * HTML5-Canvas fillstyle
		 * @type {string}
		 */
		this.fillStyle = fillStyle;
	}
}

/**
 * Mesh for texts
 */
class TextMesh extends Mesh {
	constructor(text = "", font = "24px Verdana", fillStyle, width, height) {
		super(width, height);
		/**
		 * HTML5-Canvas fillstyle
		 * @type {string}
		 */
		this.fillStyle = fillStyle;
		/**
		 * HTML5-Canvas font
		 * @type {string}
		 */
		this.font = font;
		/**
		 * Text content
		 * @type {string}
		 */
		this.text = text;
		/**
		 * Text alignment
		 * @type {string}
		 */
		this.textAlign = "left";
	}
}

/**
 * Mesh for images
 */
class ImageMesh extends Mesh {
	constructor(image) {
		super(image.width / UNIT_SIZE, image.height / UNIT_SIZE);
		/**
		 * Texture mage
		 * @type {HTML5ImageElement}
		 */
		this.image = image;
	}
}

/**
 * Mesh for sprites
 */
class SpriteMesh extends Mesh {
	constructor(offsetX, offsetY, width, height, image) {
		super(width, height);

		/**
		 * X axis offset of the sprite in the texture in PX
		 * @type {number}
		 */
		this.offsetX = offsetX;
		/**
		 * Y axis offset of the sprite in the texture in PX
		 * @type {number}
		 */
		this.offsetY = offsetY;
		/**
		 * Sprite mage
		 * @type {HTML5ImageElement}
		 */
		this.image = image;
	}
}

/**
 * Mesh for sprites taken from atlases
 */
class MultiSprite extends SpriteMesh {
	constructor(id, trans, offsetX, offsetY, width, height, image) {
		super(offsetX, offsetY, width, height, image);
		/**
		 * Identifier
		 * @type {number}
		 */
		this.id = id;
		/**
		 * Transformation entity
		 * @type {Trans}
		 */
		this.trans = trans;
	}

	_updateTransform(parentTrans) {
		super._updateTransform(parentTrans);
		this.trans._updateTransform(parentTrans);
	}
}

/**
 * Mesh for a collection of sprites
 */
class MultiSpriteCollection extends Mesh {
	constructor(atlas) {
		super(1, 1);
		/**
		 * Sprite atlas
		 * @type {HTML5ImageElement}
		 */
		this.atlas = atlas;
		/**
		 * Collection of sprites
		 * @type {Map<number, MultiSprite>}
		 */
		this.sprites = new Map();
	}

	addSprite(sprite) {
		if (!sprite instanceof MultiSprite) {
			throw new Error("Sprite must be instance of MultiSprite class");
		}

		this.sprites.set(sprite.id, sprite);
	}
}

/**
 * Transformation entity
 */
class Trans {
	constructor(posX = 0, posY = 0, rotation = 0, rotationOffsetX = 0, rotationOffsetY = 0) {
		/**
		 * Relative position on X axis
		 * @type {number}
		 */
		this.posX = posX;
		/**
		 * Relative position on Y axis
		 * @type {number}
		 */
		this.posY = posY;
		/**
		 * Relative rotation
		 * @type {number}
		 */
		this.rotation = rotation;
		/**
		 * Rotation offset on X axis
		 * @type {number}
		 */
		this.rotationOffsetX = rotationOffsetX;
		/**
		 * Rotation offset on Y axis
		 * @type {number}
		 */
		this.rotationOffsetY = rotationOffsetY;

		/**
		 * Absolute position on X axis
		 * @type {number}
		 */
		this.absPosX = 0;
		/**
		 * Absolute position on Y axis
		 * @type {number}
		 */
		this.absPosY = 0;
		/**
		 * Absolute rotation
		 * @type {number}
		 */
		this.absRotation = 0;

		this.pendingAbsPosX = null;
		this.pendingAbsPosY = null;
	}

	/**
	 * @param {number} posX 
	 * @param {number} posY 
	 */
	setPosition(posX, posY) {
		this.posX = posX;
		this.posY = posY;
	}

	/**
	 * @param {number} rotOffsetX 
	 * @param {number} rotOffsetY 
	 */
	changeRotationOffset(rotOffsetX, rotOffsetY) {
		// TODO this works only when rotation is 0 !
		let deltaX = this.rotationOffsetX - rotOffsetX;
		let deltaY = this.rotationOffsetY - rotOffsetY;
		this.posX -= deltaX;
		this.posY -= deltaY;
		this.rotationOffsetX = rotOffsetX;
		this.rotationOffsetY = rotOffsetY;
	}

	/**
	 * Clones the entity
	 * @returns {Trans}
	 */
	clone() {
		return new Trans(this.posX, this.posY, this.rotation, this.rotationOffsetX, this.rotationOffsetY);
	}

	_updateTransform(parentTrans) {

		if (this.pendingAbsPosX != null && this.pendingAbsPosY != null) {
			// calculate local position from absolute position
			this.absPosX = this.pendingAbsPosX;
			this.absPosY = this.pendingAbsPosY;
			if (parentTrans != null) {
				// TODO!! Abs-to-loc transformations
			} else {
				this.posX = this.absPosX;
				this.posY = this.absPosY;
				this.absRotation = this.rotation;
			}
			this.pendingAbsPosX = null;
			this.pendingAbsPosY = null;
		} else {
			if (parentTrans != null) {

				this.absPosX = this.posX + parentTrans.absPosX;
				this.absPosY = this.posY + parentTrans.absPosY;
				this.absRotation = this.rotation + parentTrans.absRotation;

				if (parentTrans.absRotation != 0) {

					let distX = (this.absPosX - (parentTrans.absPosX));
					let distY = (this.absPosY - (parentTrans.absPosY));

					let length = Math.sqrt(distX * distX + distY * distY);
					// always use atan2 if you don't want to deal with cos/sin freaking signs
					let angle = parentTrans.absRotation + Math.atan2(distY, distX);
					let rotPosX = length * Math.cos(angle);
					let rotPosY = length * Math.sin(angle);
					this.absPosX = parentTrans.absPosX + rotPosX;
					this.absPosY = parentTrans.absPosY + rotPosY;
				}
			} else {
				this.absPosX = this.posX;
				this.absPosY = this.posY;
				this.absRotation = this.rotation;
			}
		}
	}
}

/**
 * Game object entity that aggregates generic attributes and components
 * Overall behavior of the game entity is defined by its components
 */
class GameObject {

	/**
	 * @param {string} tag name of the object (doesn't need to be unique) 
	 * @param {number} secondaryId helping identifier
	 */
	constructor(tag, secondaryId = -10000) {
		/**
		 * Primary identifier, set automatically
		 * @type {number}
		 */
		this.id = GameObject.idCounter++;
		/**
		 * Secondary identifier
		 * @type {number}
		 */
		this.secondaryId = secondaryId;
		/**
		 * Name
		 * @type {string}
		 */
		this.tag = tag;
		/**
		 * Parent game object
		 * @type {GameObject}
		 */
		this.parent = null;
		/**
		 * List of inner components
		 * @type {Array<Component>}
		 */
		this.components = new Array();
		/**
		 * Z-Index
		 * @type {number}
		 */
		this.zIndex = 0;
		/**
		 * Rendering entity
		 * @type {Mesh}
		 */
		this.mesh = new Mesh(0, 0);
		/**
		 * Bounding box
		 * @type {BBox}
		 */
		this.bbox = new BBox();
		/**
		 * Game scene
		 * @type {Scene}
		 */
		this.scene = null;
		/**
		 * Transformation entity
		 * @type {Trans}
		 */
		this.trans = new Trans();
		/**
		 * Object states
		 * @type {number}
		 */
		this.state = STATE_DRAWABLE | STATE_LISTENING | STATE_UPDATABLE;
		/**
		 * List of attributes, mapped by their ids
		 * @type {Map<number, Any>}
		 */
		this.attributes = new Map();

		/**
		 * Collection of children
		 * @type {Map<number, GameObject>}
		 */
		this.children = new Map();

		// temporary collection that keeps objects for removal -> objects should be removed
		// at the end of the update cycle since we are sure there aren't any running components
		this._objectsToRemove = new Array();
		// temporary collection that keeps objects for adding -> objects should be added
		// at the end of the update cycle since we are sure there aren't any running components
		this._objectsToAdd = new Array();
		this._componentsToAdd = new Array();
	}

	/**
	 * Submits changes to the object
	 * @param {Boolean} recursively if true, submits changes to children as well
	 */
	submitChanges(recursively = false) {

		this.trans._updateTransform(this.parent == null ? null : this.parent.trans);
		this.mesh._updateTransform(this.trans);
		this.bbox.update(this.trans, this.mesh);

		this._addPendingGameObjects(!recursively);

		// add game objects first 
		if (recursively) {
			for (let [key, val] of this.children) {
				val._addPendingGameObjects();
			}
		}

		// components should be added after all game objects
		this._addPendingComponents();

		this._removePendingGameObjects(!recursively);

		// update other collections
		if (recursively) {
			for (let [key, val] of this.children) {
				val._addPendingComponents();
				val._removePendingGameObjects(true);
			}
		}
	}

	/**
	 * Adds a state by using bit-wise operation
	 * @param {Number} state 
	 */
	addState(state) {
		this.state |= state;
	}

	/**
	 * Checks whether a state is set
	 * @param {Number} state 
	 * @returns {Boolean}
	 */
	hasState(state) {
		return (this.state & state) == state;
	}

	/**
	 * Removes numeric state
	 * @param {Number} state 
	 */
	removeState(state) {
		this.state &= (1 << state / 2); // todo fix this
	}

	/**
	 * Returns true if given flag is set
	 * @param {Number} flag 
	 * @returns {Boolean}
	 */
	hasFlag(flag) {
		return this.flags.hasflag(flag);
	}

	/**
	 * Sets a flag
	 * @param {Number} flag 
	 */
	setFlag(flag) {
		this.flags.setFlag(flag);
	}

	/**
	 * Resets a flag
	 * @param {Number} flag 
	 */
	resetFlag(flag) {
		this.flags.resetFlag(flag);
	}

	/**
	 * Switches values of two flags
	 * @param {Number} flag1 
	 * @param {Number} flag2 
	 */
	switchFlag(flag1, flag2) {
		this.flags.switchFlag(flag1, flag2);
	}

	/**
	 * Removes itself from its parent
	 */
	remove() {
		this.parent.removeGameObject(this);
	}

	/**
	 * Gets the root object
	 * @returns {GameObject}
	 */
	getRoot() {
		return this.scene.root;
	}

	/**
	 * Sends message to all components in the scope of this object
	 * @param {Msg} msg message to send
	 * @param {boolean} applyToChildren if true, will send the message recursively 
	 */
	sendmsgToComponents(msg, applyToChildren = false) {
		// todo optimize and send only to subscribers!
		for (let component of this.components) {
			if (component.owner.hasState(STATE_LISTENING)) {
				component.onmessage(msg);
			}
		}

		if (applyToChildren) {
			for (let child of this.children) {
				child.sendmsg(msg, applyToChildren);
			}
		}
	}

	/**
	 * Adds a new game object into the scene
	 * @param {GameObject} obj 
	 */
	addGameObject(obj) {
		obj.scene = this.scene;
		obj.parent = this;
		this._objectsToAdd.push(obj);
	}

	/**
	 * Removes given game object as soon as the update cycle ends
	 * @param {GameObject} obj 
	 */
	removeGameObject(obj) {
		obj.state = STATE_INACTIVE;
		this._objectsToRemove.push(obj);
	}

	/**
	 * Adds a new component and attaches it to the game object in the next loop
	 * @param {Component} component 
	 */
	addComponent(component) {
		component.owner = this;
		component.scene = this.scene;
		this._componentsToAdd.push(component);
	}

	/**
	 * Removes a component by name
	 * @param {string} name 
	 * @returns {Boolean} true if the component has been found
	 */
	removeComponentByName(name) {
		for (let cmp of this.components) {
			if (cmp.constructor.name == name) {
				removeComponent(cmp);
				return true;
			}
		}
		// try also the pending collection
		let cntr = 0;
		for (let cmp of this._componentsToAdd) {
			if (cmp.constructor.name == name) {
				this._componentsToAdd.splice(cntr);
				return true;
			}
			cntr++;
		}
		return false;
	}

	/**
	 * Instantly removes all components
	 * @param {Component} component
	 */
	removeAllComponents() {
		for (let cmp of this.components) {
			this.removeComponent(cmp);
		}
	}

	/**
	 * Instantly removes a component
	 * @param {Component}
	 */
	removeComponent(component) {
		for (var i = 0; i < this.components.length; i++) {
			if (this.components[i] == component) {
				this.components.splice(i, 1);
				if (this.scene != null) {
					this.scene._removeComponent(component);
				}
				return true;
			}
		}
		return false;
	}

	/**
	 * Finds a component by name
	 * @param {string} name name of the component 
	 * @returns {Component}
	 */
	findComponent(name) {
		for (let cmp of this.components) {
			if (cmp.constructor.name == name) return cmp;
		}
		for (let cmp of this._componentsToAdd) {
			if (cmp.constructor.name == name) return cmp;
		}
		return null;
	}

	/**
	 * Adds a new attribute
	 * @param {string} key attribute key 
	 * @param {any} val any value
	 */
	addAttribute(key, val) {
		this.attributes.set(key, val);
	}

	/**
	 * Gets an attribute by a key
	 * @param {string} key 
	 * @returns 
	 */
	getAttribute(key) {
		return this.attributes.get(key);
	}

	/**
	 * Removes an existing attribute
	 * @param {string} key 
	 */
	removeAttribute(key) {
		this.attributes.delete(key);
	}

	/**
	 * Executes update loop
	 * @param {number} delta delta time since the last tick 
	 * @param {number} absolute absolute time since the start of the engine
	 */
	update(delta, absolute) {
		if (this.hasState(STATE_UPDATABLE)) {
			this.submitChanges(false);

			for (let component of this.components) {
				component.update(delta, absolute);
			}

			for (let [key, val] of this.children) {
				val.update(delta, absolute);
			}
		}
	}

	/**
	 * Executes drawing process upon every component
	 * @param {CanvasRenderingContext2D} ctx 
	 */
	draw(ctx) {
		if (this.hasState(STATE_DRAWABLE)) {
			for (let component of this.components) {
				component.draw(ctx)
			}
		}
	}

	// adds pending objects
	_addPendingGameObjects(submitChanges = true) {
		for (let obj of this._objectsToAdd) {
			// set it in both addGameObject and _addPendingGameObject since
			// the parent might not had its scene assigned
			obj.scene = this.scene;
			obj.parent = this;
			this.children.set(obj.id, obj);
			this.scene._addGameObject(obj);

			if (submitChanges) {
				obj.submitChanges(false);
			}
		}

		this._objectsToAdd = [];
	}

	// removes pending objects
	_removePendingGameObjects(submitChanges = true) {
		for (let obj of this._objectsToRemove) {
			obj.removeAllComponents();
			obj.submitChanges(false);
			this.scene._removeGameObject(obj);
			this.children.delete(obj.id);
			obj.parent = null;
			obj.scene = null;

			if (submitChanges) {
				obj.submitChanges(false);
			}
		}

		this._objectsToRemove = [];
	}

	_addPendingComponents() {
		for (let obj of this._componentsToAdd) {
			obj.owner = this;
			obj.scene = this.scene;
			this.components.push(obj);
			obj.oninit();
		}

		this._componentsToAdd = [];
	}

}
GameObject.idCounter = 0; // static idCounter


/**
 * Message entity that stores custom payload
 */
class Msg {
	/**
	 * @param {string} action key of an action
	 * @param {Component} component sending component 
	 * @param {GameObject} gameObject owner
	 * @param {any} data any data
	 */
	constructor(action, component, gameObject, data) {
		/**
		 * Action type identifier
		 * @type {any}
		 */
		this.action = action;
		/**
		 * Component that has sent this message
		 * @type {Component}
		 */
		this.component = component;
		/**
		 * GameObject attached to this message
		 * @type {GameObject}
		 */
		this.gameObject = gameObject;
		/**
		 * Data payload
		 * @type {any}
		 */
		this.data = data;
	}
}

/**
 * Component that defines functional behavior of a game object to which it is attached
 */
class Component {

	constructor() {
		/**
		 * Component identifier, set automatically
		 * @type {number}
		 */
		this.id = Component.idCounter++;
		/**
		 * Owner game object
		 * @type {GameObject}
		 */
		this.owner = null;
		/**
		 * Game scene
		 * @type {Scene}
		 */
		this.scene = null;
		/**
		 * A custom action invoked upon finish
		 * @type {action}
		 */
		this.onFinished = null; // onFinished event
		/**
		 * @type {boolean}
		 */
		this.isFinished = false;
	}

	// called whenever the component is added to the scene
	oninit() {
		// override
	}

	/**
	 * Subscribes itself as a listener for action with given key
	 * @param {string} action 
	 */
	subscribe(action) {
		this.scene._subscribeComponent(action, this);
	}

	/**
	 * Unsubscribes itself from an action
	 * @param {string} action 
	 */
	unsubscribe(action) {
		this.scene._unsubscribeComponent(action, this);
	}

	/**
	 * Sends a message to all subscriber
	 * @param {string} action 
	 * @param {any} data 
	 */
	sendmsg(action, data) {
		this.scene._sendmsg(new Msg(action, this, this.owner, data));
	}

	/**
	 * Handles incoming message
	 * @param {Msg} msg message 
	 */
	onmessage(msg) {
		// override
	}

	/**
	 * Invokes udpate cycle
	 * @param {delta} delta number of seconds since the last update
	 * @param {absolute} absolute number of seconds since the game has started 
	 */
	update(delta, absolute) {
		// override
	}

	// invokes drawing cycle
	draw(ctx) {
		// override
	}

	// called whenever the component is to be removed
	finalize() {
		// override
	}

	// finishes this component
	finish() {
		this.owner.removeComponent(this);

		if (this.onFinished != null) {
			this.onFinished(this); // call the event
		}
		this.isFinished = true;
	}
}

Component.idCounter = 0;

/**
 * Builder for game objects
 */
class GameObjectBuilder {
	constructor(name) {
		this.gameObj = new GameObject(name);
		this.isGlobal = false;
	}

	withSecondaryId(id) {
		this.gameObj.secondaryId = id;
		return this;
	}

	withComponent(cmp) {
		this.gameObj.addComponent(cmp);
		return this;
	}

	withAttribute(key, attr) {
		this.gameObj.addAttribute(key, attr);
		return this;
	}

	withParent(parent) {
		this.parent = parent;
		return this;
	}

	withTransform(trans) {
		this.gameObj.trans = trans;
		return this;
	}

	withPosition(posX, posY) {
		this.gameObj.trans.setPosition(posX, posY);
		return this;
	}

	withRotation(rot, offsetX = 0, offsetY = 0) {
		this.gameObj.trans.rotation = rot;
		this.gameObj.trans.rotationOffsetX = offsetX;
		this.gameObj.trans.rotationOffsetY = offsetY;
		return this;
	}

	withCenteredOrigin() {
		this.gameObj.trans.rotationOffsetX = this.gameObj.mesh.width / 2;
		this.gameObj.trans.rotationOffsetY = this.gameObj.mesh.height / 2;
		return this;
	}

	withZIndex(zIndex) {
		this.gameObj.zIndex = zIndex;
		return this;
	}

	withMesh(mesh) {
		this.gameObj.mesh = mesh;
		return this;
	}

	asGlobal() {
		this.isGlobal = true;
		return this;
	}

	build(scene) {
		if (this.isGlobal) {
			scene.addGlobalGameObject(this.gameObj);
		} else {
			this.parent.addGameObject(this.gameObj);
		}

		return this.gameObj;
	}
}