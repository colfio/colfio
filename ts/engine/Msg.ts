import Component from './Component';
import GameObject from './GameObject';

// Message entity that keeps custom data, a source object and component
export default class Msg {
    action: string = null;
    component: Component = null;
    gameObject: GameObject = null;
    data: any = null;

	constructor(action, component, gameObject, data = null) {
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