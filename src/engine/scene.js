
// Scene that keeps collection of all game
// objects and calls draw and update upon them
class Scene {

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
	 * @param {action} action () => {} a function pointer with no arguments
	 */
	addPendingInvocation(delay, action) {
		this.pendingInvocations.push({
			delay: delay,
			time: 0,
			action: action
		});
	}

	addGlobalComponent(cmp) {
		this.root.addComponent(cmp);
	}

	removeGlobalComponent(cmp) {
		this.root.removeComponent(cmp);
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

	findObjectBySecondaryId(id) {
		if (this.gameObjectSecIds.has(id)) {
			return this.gameObjectSecIds.get(id);
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

	// executes the update cycle
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

	// executes the draw cycle
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
	 * Finds a first object with a given tag
	 * @param {string|number} action action key 
	 * @param {data} data any data 
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

	_unsubscribeComponent(msgKey, component) {
		var subs = this.subscribers.get(msgKey);
		if (subs !== undefined) {
			subs.delete(component.id);
		}

		this.subscribedMessages.delete(component.id);
	}

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