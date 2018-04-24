/**
 * @file Component-based micro-engine, partially implements ECS pattern (Entity-Component-System)
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;


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
		// list of global attributes attached to whole game
		this.globalAttributes = new Map();

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

		// temporary collection that keeps objects for removal -> objects should be removed
		// at the end of the update cycle since we are sure there aren't any running components
		this.objectsToRemove = new Array();
		this.componentsToRemove = new Array();

		// temporary collection that keeps objects for adding -> objects should be added
		// at the end of the update cycle since we are sure there aren't any running components
		this.objectsToAdd = new Array();
		this.componentsToAdd = new Array();
		

		// functions that should be invoked with some delay
		this.pendingInvocations = new Array();
	}

	// stores a new function that should be invoked after given amount of time
	addPendingInvocation(delay, action) {
		this.pendingInvocations.push({
			delay: delay,
			time: 0,
			action: action
		});
	}

	// adds a new global attribute
	addGlobalAttribute(key, val) {
		this.globalAttributes.set(key, val);
	}

	// gets a global attribute by its key
	getGlobalAttribute(key) {
		return this.globalAttributes.get(key);
	}

	// removes a global attribute by its key
	removeGlobalAttribute(key) {
		this.globalAttributes.delete(key);
	}

	// adds a new game object into the scene
	addGameObject(obj) {
		this.objectsToAdd.push(obj);
	}

	// removes given game object as soon as the update cycle finishes
	removeGameObject(obj) {
		this.objectsToRemove.push(obj);
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

	// clears the whole scene, all game objects, attributes and components
	clearScene() {

		// call the finalization function
		for (let [key, gameObj] of this.gameObjects) {
			for (let component of gameObj.components) {
				component.finalize();
			}
		}

		this.globalAttributes = new Map();
		this.subscribers = new Map();
		this.subscribedMessages = new Map();
		this.gameObjectTags = new Map();
		this.gameObjects = new Map();
		this.sortedObjects = new Array();
		this.objectsToRemove = new Array();
		this.componentsToRemove = new Array();
		this.objectsToAdd = new Array();
		this.componentsToAdd = new Array();
	}

	// executes the update cycle
	update(delta, absolute) {
		// update
		for (let [key, gameObject] of this.gameObjects) {
			gameObject.update(delta, absolute);
		}

		this.submitChanges();

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

	submitChanges(){
		// handle pending components and objects
		this._addPendingComponents();
		this._addPendingGameObjects();
		this._removePendingComponents();
		this._removePendingGameObjects();
		
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
				component.onmessage(msg);
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

	_addGameObjectImmediately(obj){
		obj.scene = this;

		// initialize all components
		for (let component of obj.components) {
			this._addComponent(component, obj);
			component.oninit();
		}

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
	_removeGameObjectImmediately(obj) {
		for (let component of obj.components) {
			this._removeComponentImmediately(component);
		}

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

	// adds pending objects
	_addPendingGameObjects(){
		for(let obj of this.objectsToAdd){
			this._addGameObjectImmediately(obj);
		}
		
		this.objectsToAdd = [];
	}

	// removes pending objects;
	_removePendingGameObjects() {
		for (let obj of this.objectsToRemove) {
			this._removeGameObjectImmediately(obj);
		}

		this.objectsToRemove = [];
	}

	// assignes a new component to a given object
	_addComponent(component, owner) {
		component.owner = owner;
		component.scene = this;
		this.componentsToAdd.push(component);
	}

	_addComponentImmediately(component, owner){
		component.owner = owner;
		component.scene = this;
		component.oninit();	
	}

	_addPendingComponents(){
		for (let obj of this.componentsToAdd) {
			this._addComponentImmediately(obj, obj.owner); // owner has been already set
		}

		this.componentsToAdd = [];
	}

	// removes existing component as soon as the update cycle finishes
	_removeComponent(component) {
		this.componentsToRemove.push(obj);
	}

	// immediately removes given component
	_removeComponentImmediately(component) {
		component.finalize();
		this.subscribedMessages.delete(component.id);

		if (this.subscribedMessages.has(component.id)) {
			let allMsgKeys = this.subscribedMessages.get(component.id);
			for (let msgKey of allMsgKeys) {
				this.subscribers.get(msgKey).delete(component.id);
			}
		}
	}

	// removes all components that are to be removed
	_removePendingComponents() {
		for (let component of this.componentsToRemove) {
			this._removeComponentImmediately(component);
		}
		this.componentsToRemove = [];

	}
}

// Game object entity that aggregates generic attributes and components
// Overall behavior of the game entity is defined by its components
class GameObject {

	constructor(tag) {
		this.id = GameObject.idCounter++;
		this.tag = tag;
		this.components = new Array();
		this.posX = 0;
		this.posY = 0;
		this.zIndex = 0;
		this.sprite = null;
		this.scene = null;
		this.visible = true;
		this.attributes = new Map();
	}

	// adds a new component
	addComponent(component) {
		this.components.push(component);
		if (this.scene != null) {
			this.scene._addComponent(component, this);
		}
	}

	// removes an existing component
	removeComponent(component) {
		for (var i = 0; i < this.components.length; i++) {
			if (this.components[i] == component) {
				this.components.splice(i, 1);
				if (this.scene != null) {
					this.scene._removeComponentImmediately(component);
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
		for (let component of this.components) {
			component.update(delta, absolute);
		}
	}

	draw(ctx) {
		if (this.visible) {
			for (let component of this.components) {
				component.draw(ctx)
			}
		}
	}

	// returns true, if the object intersects with another object
	intersects(other, tolerance = 0) {
		return this._horizontalIntersection(other) >= tolerance &&
			this._verticalIntersection(other) >= tolerance;
	}

	_horizontalIntersection(other) {
		return Math.min(other.posX + other.sprite.width, this.posX + this.sprite.width)
			- Math.max(other.posX, this.posX);
	}

	_verticalIntersection(other) {
		return -Math.max(other.posY - other.sprite.height, this.posY - this.sprite.height)
			+ Math.min(other.posY, this.posY);
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
