
const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;

class Context {
	constructor(canvas) {
		this.canvas = canvas;
		this.canvasHeight = canvas.height;
		this.canvasWidth = canvas.width;
	}
}

class Scene {

	constructor(context) {
		if (Scene.scene) {
			return Scene.scene;
		}

		Scene.scene = this;

		this.context = context;
		// list of global attributes attached to whole game
		this.globalAttributes = new Map();

		// messages keys and all subscribers that listens to specific keys
		this.subscribers = new Map();
		// component ids and list of all message keys they listen to
		this.subscribedMessages = new Map();
		// collection of all game objects, mapped by their tag and then by their ids
		this.gameObjectTags = new Map();
		// collection of all game objects, mapped by their id
		this.gameObjects = new Map();
		// game objects sorted by z-index, used for drawing
		this.sortedObjects = new Array();

		this.objectsToRemove = new Array();
		this.componentsToRemove = new Array();
	}
	
	addGlobalAttribute(key, val) {
		this.globalAttributes.set(key, val);
	}

	getGlobalAttribute(key) {
		return this.globalAttributes.get(key);
	}

	removeGlobalAttribute(key) {
		this.globalAttributes.delete (key);
	}

	// adds a new game object into scene
	addGameObject(obj) {
		obj.scene = this;
				
		// initialize all components
		for (let component of obj.components) {
			component.owner = obj;
			component.scene = this;
			component.oninit();
		}

		if (!this.gameObjectTags.has(obj.tag)) {
			this.gameObjectTags.set(obj.tag, new Map());
		}

		// add game object into the collection
		this.gameObjectTags.get(obj.tag).set(obj.id, obj);
		this.gameObjects.set(obj.id, obj);

		// keep the third collection sorted by z-index
		let fnd = this.sortedObjects.binaryFind(obj, (current, search) => {
			if(current.zIndex == search.zIndex) return 0;
			else if(current.zIndex > search.zIndex) return 1;
			else return -1;
		});
		
		this.sortedObjects.splice(fnd.index, 0, obj);
		
		this._sendmsg(new Msg(MSG_OBJECT_ADDED, null, obj));
	}

	removeGameObject(obj) {
		// will be removed at the end of the update loop
		this.objectsToRemove.push(obj);
	}

	findAllObjectsByTag(tag) {
		let result = new Array();
		if (this.gameObjectTags.has(tag)) {
			for (let[key, gameObject]of this.gameObjectTags.get(tag)) {
				result.push(gameObject);
			}
		}
		return result;
	}

	// sends message to all subscribers
	_sendmsg(msg) {
		if (this.subscribers.has(msg.action)) {
			// get all subscribed components
			let subscribedComponents = this.subscribers.get(msg.action);
			for (let[key, component]of subscribedComponents) {
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

	_removeGameObjectImmediately(obj) {
		for (let component of obj.components) {
			this._removeComponentImmediately(component);
		}

		this.gameObjectTags.get(obj.tag).delete (obj.id);
		this.gameObjects.delete (obj.id);
		
		for(let i=0; i<this.sortedObjects.length; i++){
			if(this.sortedObjects[i].id == obj.id){
				this.sortedObjects.splice(i,1);
				break;
			}
		}
		
		
		this._sendmsg(new Msg(MSG_OBJECT_REMOVED, null, obj));
	}

	// removes all game objects;
	_removePendingGameObjects() {
		for (let obj of this.objectsToRemove) {
			this._removeGameObjectImmediately(obj);
		}

		this.objectsToRemove = [];
	}

	_removeComponent(component) {
		this.componentsToRemove.push(obj);
	}

	_removeComponentImmediately(component) {
		this.subscribedMessages.delete (component.id);

		if(this.subscribedMessages.has(component.id)) {
			let allMsgKeys = this.subscribedMessages.get(component.id);
			for (let msgKey of allMsgKeys) {
				this.subscribers.get(msgKey).delete (component.id);
			}	
		}
	}

	_removePendingComponents() {
		for (let component of this.componentsToRemove) {
			this._removeComponentImmediately(component);
		}
		this.componentsToRemove = [];

	}
	
	
	update(delta, absolute) {
		for (let[key, gameObject]of this.gameObjects) {
			gameObject.update(delta, absolute);
		}

		this._removePendingComponents();
		this._removePendingGameObjects();
	}

	draw(ctx) {
		for(let gameObject of this.sortedObjects){
			gameObject.draw(ctx);
		}
	}
}

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
		this.attributes = new Map();
	}

	addComponent(component) {
		this.components.push(component);
		if (this.scene != null) {
			this.scene.addComponent(component);
		}
	}

	removeComponent(component) {
		for (var i = 0; i < components.length; i++) {
			if (components[i] == component) {
				this.components.splice(i, 1);
				if (this.scene != null) {
					this.scene.removeComponent(component);
				}
				return true;
			}
		}
		return false;
	}

	addAttribute(key, val) {
		this.attributes.set(key, val);
	}

	getAttribute(key) {
		return this.attributes.get(key);
	}

	removeAttribute(key) {
		this.attributes.delete (key);
	}

	update(delta, absolute) {
		for (let component of this.components) {
			component.update(delta, absolute);
		}
	}

	draw(ctx) {
		for (let component of this.components) {
			component.draw(ctx)
		}
	}
}
GameObject.idCounter = 0;

class Msg {
	constructor(action, component, gameObject, data) {
		this.action = action;
		this.component = component;
		this.gameObject = gameObject;
		this.data = data;
	}
}

class Component {

	constructor() {
		this.id = Component.idCounter++;
		this.owner = null;
		this.scene = null;
	}

	oninit() {
		// will be overridden
	}

	subscribe(action) {
		this.scene._subscribeComponent(action, this);
	}

	sendmsg(action, data) {
		this.scene._sendmsg(new Msg(action, this, this.owner, data));
	}

	onmessage(msg) {
		// will be overridden
	}

	update(delta, absolute) {
		// will be overridden
	}

	draw(ctx) {
		// will be overridden
	}

}

Component.idCounter = 0;

class InputManager extends Component {

	oninit() {
		this.lastTouch = null;

		let context = this.scene.context;
		let canvas = context.canvas;
		canvas.addEventListener("touchstart", (evt) => {
			this.handleStart(evt);
		}, false);
		canvas.addEventListener("touchend", (evt) => {
			this.handleEnd(evt);
		}, false);
		canvas.addEventListener("mousedown", (evt) => {
			this.handleStart(evt);
		}, false);
		canvas.addEventListener("mouseup", (evt) => {
			this.handleEnd(evt);
		}, false);
	}

	handleStart(evt) {
		evt.preventDefault();
		if (typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
			// only single-touch
			this.lastTouch = evt.changedTouches[0];
		} else {
			this.lastTouch = evt;
		}
	}

	handleEnd(evt) {
		evt.preventDefault();
		var posX,
		posY;

		if (typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
			posX = evt.changedTouches[0].pageX;
			posY = evt.changedTouches[1].pageY;

		} else {
			// mouse
			posX = evt.pageX;
			posY = evt.pageY;
		}

		if (Math.abs(this.lastTouch.pageX - posX) < 10 &&
			Math.abs(this.lastTouch.pageY - posY) < 10) {
			this.sendmsg(MSG_TOUCH, [posX, posY]);
		}
	}

}
