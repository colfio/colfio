

// Message entity that keeps custom data, a source object and component
class Msg {
	constructor(action, component, gameObject, data) {
		/**
         * Action type identifier
         * @type {any}
         */
		this.action = action;
		/**
         * Component that sent this message
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