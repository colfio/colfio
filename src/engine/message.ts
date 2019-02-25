import Component from './component';
import { PIXICmp } from './pixi-object';

/**
 * Message that stores type of action, a relevant component, a relevant game object and custom data if needed
 */
export default class Message {

  /**
   * Data payload
   */
  data: any = null;

  /**
   * Action type identifier
   */
  private _action: string = null;

  /**
   * Component that sent this message
   */
  private _component: Component = null;

  /**
   * GameObject attached to this message
   */
  private _gameObject: PIXICmp.GameObject = null;

  /*
   * If any handler sets this flag to true, the message will no longer be handled
   */
  private _expired: boolean = false;

  constructor(action: string, component: Component, gameObject: PIXICmp.GameObject, data: any = null) {
    this._action = action;
    this._component = component;
    this._gameObject = gameObject;
    this.data = data;
  }

  get expired() {
    return this._expired;
  }

  expire() {
    this._expired = true;
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