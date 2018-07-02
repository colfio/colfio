

// Component that defines functional behavior of the game object (or its part)
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

		this.isFinished = false;
	}

	// called whenever the component is added to the scene
	oninit() {
		// override
	}

	// subscribes itself as a listener for action with given key
	subscribe(action) {
		this.scene._subscribeComponent(action, this);
	}

	unsubscribe(action){
		this.scene._unsubscribeComponent(action, this);
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

		if (this.onFinished != null) {
			this.onFinished(this); // call the event
		}

		this.isFinished = true;
	}
}

Component.idCounter = 0;


