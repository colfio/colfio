
class Sprite {
	constructor(atlas, offsetX, offsetY, width, height) {
		this.atlas = atlas;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.width = width;
		this.height = height;
	}
}

const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;

class Context {
	constructor(canvas){
		this.canvas = canvas;
	}
}

class Scene {

	constructor(context) {
		if (Scene.scene) {
			return Scene.scene;
		}

		Scene.scene = this;
		
		this.context = context;
		
		// messages keys and all subscribers that listens to specific keys
		this.subscribers = new Map();
		// component ids and list of all message keys they listen to
		this.subscribedMessages = new Map();
		// collection of all game objects, mapped by their tag and then by their ids
		this.gameObjectTags = new Map();
		// collection of all game objects, mapped by their id
		this.gameObjects = new Map();

		this.objectsToRemove = new Array();
		this.componentsToRemove = new Array();
	}

	// adds a new game object into scene
	addGameObject(obj) {
		// initialize all components
		for (let component of obj.components) {
			component.owner = obj;
			component.scene = this;
			component.oninit();
		}
		
		obj.scene = this;
		
		if (!this.gameObjectTags.has(obj.tag)) {
			this.gameObjectTags.set(obj.tag, new Map());
		}

		// add game object into the collection
		this.gameObjectTags.get(obj.tag).set(obj.id, obj);
		this.gameObjects.set(obj.id, obj);

		this._sendmsg(new Msg(MSG_OBJECT_ADDED, null, obj));
	}

	removeGameObject(obj) {
		// will be removed at the end of the update loop
		this.objectsToRemove.push(obj);
	}

	findAllObjectsByTag(tag) {
		let result = new Array();
		if (this.gameObjectTags.has(tag)) {
			for (let [key, gameObject] of this.gameObjectTags.get(tag)) {
				result.push(gameObject);
			}
		}
		return result;
	}

	// sends message to all subscribers
	_sendmsg(msg) {
		if (this.subscribers.has(msg.messageKey)) {
			// get all subscribed components
			let subscribedComponents = this.subscribers.get(msg.messageKey);
			for (let component of subscribedComponents) {
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
		let allMsgKeys = this.subscribedMessages.get(component.id);
		this.subscribedMessages.delete (component.id);

		for (let msgKey of allMsgKeys) {
			this.subscribers.get(msgKey).delete (component.id);
		}
	}

	_removePendingComponents() {
		for (let component of this.componentsToRemove) {
			this._removeComponentImmediately(component);
		}
		this.componentsToRemove = [];

	}

	update(delta, absolute) {
		for (let [key, gameObject] of this.gameObjects) {
			gameObject._update(delta, absolute);
		}

		this._removePendingComponents();
		this._removePendingGameObjects();
	}

	draw(ctx) {
		for (let [key, gameObject] of this.gameObjects) {
			gameObject._draw(ctx);
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
		this.sprite = null;
		this.scene = null;
		this.attributes = new Map();
	}

	addComponent(component) {
		this.components.push(component);
		if(this.scene != null){
			this.scene.addComponent(component);
		}
	}

	removeComponent(component) {
		for (var i = 0; i < components.length; i++) {
			if (components[i] == component) {
				this.components.splice(i, 1);
				if(this.scene != null){
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

	_update(delta, absolute) {
		for (let component of this.components) {
			component.update(delta, absolute);
		}
	}

	_draw(ctx) {
		for (let component of this.components) {
			component.draw(ctx)
		}
	}
}
GameObject.idCounter = 0;

class Msg {
	constructor(messageKey, component, gameObject, data) {
		this.messageKey = messageKey;
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

	subscribe(messageKey) {
		this.scene._subscribe(messageKey, this);
	}

	sendmsg(messageKey, data) {
		this.scene._sendmsg(new Msg(messageKey, this, this.owner, data));
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

class Renderer extends Component {
	draw(ctx) {
		if (this.owner.sprite != null) {
			ctx.drawImage(this.owner.sprite.atlas, this.owner.sprite.offsetX, this.owner.sprite.offsetY,
				this.owner.sprite.width, this.owner.sprite.height, this.owner.posX, this.owner.posY, this.owner.sprite.width, this.owner.sprite.height);
		}
	}
}
