/**
 * @file Component-based micro-engine, partially implements ECS pattern (Entity-Component-System)
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;

const STATE_INACTIVE = 0;
const STATE_UPDATABLE = 2 ^ 0;
const STATE_DRAWABLE = 2 ^ 1;
const STATE_LISTENING = 2 ^ 2;


// Scene that keeps collection of all game
// objects and calls draw and update upon them
class Scene {

	constructor(canvas) {
		if (Scene.scene) {
			return Scene.scene;
		}

		Scene.scene = this;

		this.canvas = canvas;
		this.canvasCtx = canvas.getContext('2d');
		this.clearScene();
	}

	submitChanges() {
		// submit upon the root recursively
		this.root.submitChanges(true);
	}

	// stores a new function that should be invoked after given amount of time
	addPendingInvocation(delay, action) {
		this.pendingInvocations.push({
			delay: delay,
			time: 0,
			action: action
		});
	}

	addGlobalGameObject(obj) {
		this.root.addGameObject(obj);
	}

	removeGlobalGameObject(obj) {
		this.root.removeGameObject(obj);
	}

	// adds a new global attribute
	addGlobalAttribute(key, val) {
		this.root.addAttribute(key, val);
	}

	// gets a global attribute by its key
	getGlobalAttribute(key) {
		return this.root.getAttribute(key);
	}

	// removes a global attribute by its key
	removeGlobalAttribute(key) {
		this.root.removeAttribute(key);
	}

	// finds all game objects by their tag
	findAllObjectsByTag(tag) {
		let result = new Array();
		if (this.gameObjectTags.has(tag)) {
			for (let [key, gameObject] of this.gameObjectTags.get(tag)) {
				result.push(gameObject);
			}
		}

		return result;
	}

	// finds a first object with a given tag
	findFirstObjectByTag(tag) {
		if (this.gameObjectTags.has(tag)) {
			for (let [key, gameObject] of this.gameObjectTags.get(tag)) {
				return gameObject; // return the first one
			}
		}
		return null;
	}

	findAllObjectsByFlag(flag) {
		let result = new Array();
		for (let [key, gameObject] of this.gameObjects) {
			if (gameObject.hasFlag(flag)) {
				result.push(gameObject);
			}
		}
		return result;
	}

	findFirstObjectByFlag(flag) {
		for (let [key, gameObject] of this.gameObjects) {
			if (gameObject.hasFlag(flag)) {
				return gameObject;
			}
		}
	}

	// clears the whole scene, all game objects, attributes and components
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

		// message action keys and all subscribers that listens to all these actions
		this.subscribers = new Map();
		// component ids and list of all actions they listen to
		this.subscribedMessages = new Map();
		// collection of all game objects, mapped by their tag and then by their ids
		this.gameObjectTags = new Map();
		// collection of all game objects, mapped by their ids
		this.gameObjects = new Map();
		// game objects sorted by z-index, used for drawing
		this.sortedObjects = new Array();

		// functions that should be invoked with some delay
		this.pendingInvocations = new Array();
	}

	// executes the update cycle
	update(delta, absolute) {
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
	}



	// executes the draw cycle
	draw() {
		for (let gameObject of this.sortedObjects) {
			gameObject.draw(this.canvasCtx);
		}
	}

	// sends message to all subscribers
	_sendmsg(msg) {
		if (this.subscribers.has(msg.action)) {
			// get all subscribed components
			let subscribedComponents = this.subscribers.get(msg.action);
			for (let [key, component] of subscribedComponents) {
				// send message
				if (component.owner.state & STATE_LISTENING == STATE_LISTENING) {
					component.onmessage(msg);
				}
			}
		}
	}


	// subscribes given component for messaging system
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

	_addGameObject(obj) {
		// fill all collections
		if (!this.gameObjectTags.has(obj.tag)) {
			this.gameObjectTags.set(obj.tag, new Map());
		}

		this.gameObjectTags.get(obj.tag).set(obj.id, obj);
		this.gameObjects.set(obj.id, obj);

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


	_removeComponent(component) {
		this.subscribedMessages.delete(component.id);

		if (this.subscribedMessages.has(component.id)) {
			let allMsgKeys = this.subscribedMessages.get(component.id);
			for (let msgKey of allMsgKeys) {
				this.subscribers.get(msgKey).delete(component.id);
			}
		}
	}
}

// bit array for flags
class Flags {
	constructor() {
		// flag array 0-128
		this.flags1 = 0;
		this.flags2 = 0;
		this.flags3 = 0;
		this.flags4 = 0;
	}

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
			throw Error("Flag values beyond 128 are not supported");
		}
	}

	switchFlag(flag1, flag2) {
		if (this.hasFlag(flag1)) this.setFlag(flag2);
		else this.resetFlag(flag2);

		if (this.hasFlag(flag2)) this.setFlag(flag1);
		else this.resetFlag(flag1);
	}

	setFlag(flag) {
		this._changeFlag(true, flag);
	}

	resetFlag(flag) {
		this._changeFlag(false, flag);
	}

	_getFlagIndex(flag) {
		return flag / 4; // sizeof 32bit int
	}

	_getFlagOffset(flag) {
		return flag % 4; // sizeof 32bit int
	}

	_changeFlag(set, flag) {
		let index = this._getFlagIndex(flag);
		let offset = this._getFlagOffset(flag);
		let binary = 1 << offset;

		if (index <= 3) {
			switch (index) {
				case 0: if (set) (this.flags1 |= binary); else (this.flags1 ^= binary);
				case 1: if (set) (this.flags2 |= binary); else (this.flags2 ^= binary);
				case 2: if (set) (this.flags3 |= binary); else (this.flags3 ^= binary);
				case 3: if (set) (this.flags4 |= binary); else (this.flags4 ^= binary);
			}
		} else {
			throw Error("Flag values beyond 128 are not supported");
		}
	}
}

// simple bounding box
class BBox {
	constructor() {
		this.topLeftX = 0;
		this.topLeftY = 0;
		this.bottomRightX = 0;
		this.bottomRightY = 0;
	}

	getSize() {
		return { "width": (this.bottomRightX - this.topLeftX), "height": (this.bottomRightY - this.topLeftY) };
	}

	getCenter() {
		let size = this.getSize();
		return { "posX": (this.topLeftX + size.width / 2), "posY": (this.topLeftY + size.height / 2) };
	}

	intersects(other) {
		return this.horizontalIntersection(other) >= 0 && this.verticalIntersection(other) >= 0;
	}

	horizontalIntersection(other) {
		return Math.min(other.bottomRightX, this.bottomRightX) - Math.max(other.topLeftX, this.topLeftX);
	}

	verticalIntersection(other) {
		return Math.min(other.bottomLeftY, this.bottomLeftY) - Math.max(other.topLeftY, this.topLeftY);
	}
}

class Mesh {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.bbox = new BBox();
	}

	updateBoundingBox(trans) {
		this.bbox.topLeftX = trans.posX;
		this.bbox.topLeftY = trans.posY;
		this.bbox.bottomRightX = trans.posX + this.width;
		this.bbox.bottomRightY = trans.posY + this.height;
	}
}

class Sprite extends Mesh {
	constructor(offsetX, offsetY, width, height, image) {
		super(width, height);
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.image = image;
	}
}

// transformation entity
class Trans {
	constructor(posX = 0, posY = 0, rotation = 0) {
		this.posX = 0;
		this.posY = 0;
		this.rotation = 0;
		this.rotationOffsetX = 0;
		this.rotationOffsetY = 0;

		this.absPosX = 0;
		this.absPosY = 0;
		this.absRotation = 0;
	}

	_updateTransform(owner, parent) {
		
		if (parent != null) {
			let ownerMesh = owner.mesh;
			let parentTrans = parent.trans;

			this.absPosX = this.posX + parentTrans.absPosX;
			this.absPosY = this.posY + parentTrans.absPosY;
			this.absRotation = this.rotation + parent.trans.absRotation;

			if (parentTrans.absRotation != 0) {
				// rotate 
				let unitSize = owner.scene.unitSize;
				let parentOffsetX = parentTrans.rotationOffsetX;
				let parentOffsetY = parentTrans.rotationOffsetY;
				let ownerOffsetX = this.rotationOffsetX;
				let ownerOffsetY = this.rotationOffsetY;
	
				let distX = (this.absPosX + ownerOffsetX - (parentTrans.absPosX + parentOffsetX));
				let distY = (this.absPosY + ownerOffsetY - (parentTrans.absPosY + parentOffsetY));

				let length = Math.sqrt(distX * distX + distY * distY);
				let angle = parentTrans.absRotation + Math.atan2(distY, distX);
				let rotPosX = length * Math.cos(angle);
				let rotPosY = length * Math.sin(angle);
				this.absPosX = parentTrans.absPosX + parentOffsetX + rotPosX - ownerOffsetX;
				this.absPosY = parentTrans.absPosY + parentOffsetY + rotPosY - ownerOffsetY;
			}
		} else {
			this.absPosX = this.posX;
			this.absPosY = this.posY;
			this.absRotation = this.rotation;
		}
	}
}

// Game object entity that aggregates generic attributes and components
// Overall behavior of the game entity is defined by its components
class GameObject {

	constructor(tag) {
		this.id = GameObject.idCounter++;
		this.tag = tag;
		this.parent = null;
		this.components = new Array();
		this.zIndex = 0;
		this.mesh = new Mesh(0, 0);
		this.scene = null;
		this.trans = new Trans();
		this.state = STATE_DRAWABLE | STATE_LISTENING | STATE_UPDATABLE;
		this.attributes = new Map();

		// temporary collection that keeps objects for removal -> objects should be removed
		// at the end of the update cycle since we are sure there aren't any running components
		this.objectsToRemove = new Array();
		this.componentsToRemove = new Array();
		// temporary collection that keeps objects for adding -> objects should be added
		// at the end of the update cycle since we are sure there aren't any running components
		this.objectsToAdd = new Array();
		this.componentsToAdd = new Array();

		this.children = new Map();
	}

	submitChanges(recursively = false) {
		// start with game objects
		this._addPendingGameObjects(!recursively);

		if (recursively) {
			for (let [key, val] of this.children) {
				val.submitChanges(true);
			}
		}

		// components should be added after all game objects
		this._addPendingComponents();

		this._removePendingComponents();
		this._removePendingGameObjects(!recursively);
	}

	hasFlag(flag) {
		return this.flags.hasflag(flag);
	}

	setFlag(flag) {
		this.flags.setFlag(flag);
	}

	resetFlag(flag) {
		this.flags.resetFlag(flag);
	}

	switchFlag(flag1, flag2) {
		this.flags.switchFlag(flag1, flag2);
	}

	remove() {
		this.parent.removeGameObject(this);
	}

	// adds a new game object into the scene
	addGameObject(obj) {
		obj.scene = this.scene;
		obj.parent = this;
		this.objectsToAdd.push(obj);
	}

	// removes given game object as soon as the update cycle finishes
	removeGameObject(obj) {
		obj.state = STATE_INACTIVE;
		this.objectsToRemove.push(obj);
	}


	addComponent(component, owner) {
		component.owner = this;
		component.scene = this.scene;
		this.componentsToAdd.push(component);
	}

	removeComponent(component) {
		this.componentsToRemove.push(obj);
	}

	removeAllComponents() {
		for (let cmp of this.components) {
			this.removeComponent(cmp);
		}
	}

	// removes an existing component
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

	// adds a new attribute
	addAttribute(key, val) {
		this.attributes.set(key, val);
	}

	// gets attribute by key
	getAttribute(key) {
		return this.attributes.get(key);
	}

	// removes an existing attribute
	removeAttribute(key) {
		this.attributes.delete(key);
	}

	update(delta, absolute) {
		if (this.state & STATE_UPDATABLE == STATE_UPDATABLE) {
			this.submitChanges(false);

			this.mesh.updateBoundingBox(this.trans);

			this.trans._updateTransform(this, this.parent);

			for (let component of this.components) {
				component.update(delta, absolute);
			}

			for (let [key, val] of this.children) {
				val.update(delta, absolute);
			}
		}
	}

	draw(ctx) {
		if (this.state & STATE_DRAWABLE == STATE_DRAWABLE) {
			for (let component of this.components) {
				component.draw(ctx)
			}
		}
		// children are drawn via scene
	}

	// adds pending objects
	_addPendingGameObjects(submitChanges = true) {
		for (let obj of this.objectsToAdd) {
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

		this.objectsToAdd = [];
	}

	// removes pending objects;
	_removePendingGameObjects(submitChanges = true) {
		for (let obj of this.objectsToRemove) {
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

		this.objectsToRemove = [];
	}

	_addPendingComponents() {
		for (let obj of this.componentsToAdd) {
			obj.owner = this;
			obj.scene = this.scene;
			this.components.push(obj);
			obj.oninit();
		}

		this.componentsToAdd = [];
	}

	// removes all components that are to be removed
	_removePendingComponents() {
		for (let component of this.componentsToRemove) {
			component.finalize();

			for (var i = 0; i < this.components.length; i++) {
				if (this.components[i] == component) {
					this.components.splice(i, 1);
					this.scene._removeComponent(component);
					break;
				}
			}
		}
		this.componentsToRemove = [];
	}
}
GameObject.idCounter = 0; // static idCounter


// Message entity that keeps custom data, a source object and component
class Msg {
	constructor(action, component, gameObject, data) {
		this.action = action;
		this.component = component;
		this.gameObject = gameObject;
		this.data = data;
	}
}

// Component that defines functional behavior of the game object (or its part)
class Component {

	constructor() {
		this.id = Component.idCounter++;
		this.owner = null;
		this.scene = null;
	}

	// called whenever the component is added to the scene
	oninit() {
		// override
	}

	// subscribes itself as a listener for action with given key
	subscribe(action) {
		this.scene._subscribeComponent(action, this);
	}

	// sends message to all subscribers
	sendmsg(action, data) {
		this.scene._sendmsg(new Msg(action, this, this.owner, data));
	}

	// handles incoming message
	onmessage(msg) {
		// override
	}

	// invokes update cycle
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
	}
}

Component.idCounter = 0;
