
/**
 * Game object entity that aggregates generic attributes and components
 * Overall behavior of the game entity is defined by its components
 */
class GameObject {

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
		this._componentsToRemove = new Array();
		// temporary collection that keeps objects for adding -> objects should be added
		// at the end of the update cycle since we are sure there aren't any running components
		this._objectsToAdd = new Array();
		this._componentsToAdd = new Array();
	}

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

		this._removePendingComponents();
		this._removePendingGameObjects(!recursively);

		// update other collections
		if (recursively) {
			for (let [key, val] of this.children) {
				val.submitChanges(true);
			}
		}
	}

	addState(state) {
		this.state |= state;
	}

	hasState(state) {
		return (this.state & state) == state;
	}

	removeState(state) {
		this.state &= (1 << state / 2); // todo fix this
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

	// gets root object
	getRoot() {
		return this.scene.root;
	}

	/**
	 * Sends message to all components in the scope of this object
	 * @param {Msg} msg message to sent 
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

	// adds a new game object into the scene
	addGameObject(obj) {
		obj.scene = this.scene;
		obj.parent = this;
		this._objectsToAdd.push(obj);
	}

	// removes given game object as soon as the update cycle finishes
	removeGameObject(obj) {
		obj.state = STATE_INACTIVE;
		this._objectsToRemove.push(obj);
	}

	addComponent(component) {
		component.owner = this;
		component.scene = this.scene;
		this._componentsToAdd.push(component);
	}

	removeComponent(component) {
		this._componentsToRemove.push(obj);
	}

	removeComponentByName(name){
		for(let cmp of this.components){
			if(cmp.constructor.name == name){
				this.removeComponent(cmp);
				return true;
			}
		}
		// try also the pending collection
		let cntr = 0;
		for(let cmp of this._componentsToAdd){
			if(cmp.constructor.name == name){
				this._componentsToAdd.splice(cntr);
				return true;
			}
			cntr++;
		}
		return false;
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

	findComponent(name) {
		for (let cmp of this.components) {
			if (cmp.constructor.name == name) return cmp;
		}
		for (let cmp of this._componentsToAdd) {
			if (cmp.constructor.name == name) return cmp;
		}
		return null;
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

	draw(ctx) {
		if (this.hasState(STATE_DRAWABLE)) {
			for (let component of this.components) {
				component.draw(ctx)
			}
		}
		// children are drawn via scene
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

	// removes pending objects;
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

	// removes all components that are to be removed
	_removePendingComponents() {
		for (let component of this._componentsToRemove) {
			component.finalize();

			for (var i = 0; i < this.components.length; i++) {
				if (this.components[i] == component) {
					this.components.splice(i, 1);
					this.scene._removeComponent(component);
					break;
				}
			}
		}
		this._componentsToRemove = [];
	}
}
GameObject.idCounter = 0; // static idCounter
