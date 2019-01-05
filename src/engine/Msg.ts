import Component from './Component';
import { PIXICmp } from './PIXIObject';

/**
 * Message that stores type of action, a relevant component, a relevant game object and custom data if needed
 */
export default class Msg {

    /**
    * Action type identifier
    */
    _action: string = null;

    /**
    * Component that sent this message
    */
    _component: Component = null;

    /**
    * GameObject attached to this message
    */
    _gameObject: PIXICmp.ComponentObject = null;
    
    /**
     * Data payload
     */
    data: any = null;

    constructor(action: string, component: Component, gameObject: PIXICmp.ComponentObject, data: any = null) {
        this._action = action;
        this._component = component;
        this._gameObject = gameObject;
        this.data = data;
    }

    get action() {
        return this._action;
    }

    get component() {
        return this._component;
    }

    get gameObject() {
        return this._gameObject;
    }
}