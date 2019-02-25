import Message from './message';
import Scene from './scene';
import { PIXICmp } from './pixi-object';

/**
 * Component that defines a functional behavior of an entity which is attached to
 */
export default class Component {
  private static idCounter = 0;
  private isFinished = false;

  // auto-incremented id
  protected _id = 0;
  // owner object of this component
  protected _owner: PIXICmp.GameObject = null;
  // link to scene
  protected _scene: Scene = null;

  protected _name: string;

  constructor() {
    this._id = Component.idCounter++;
  }

  public get id() {
    return this._id;
  }

  public get name() {
    return this._name || this.constructor.name;
  }

  public get owner() {
    return this._owner;
  }

  public set owner(owner: PIXICmp.GameObject) {
    this._owner = owner;
  }

  public get scene() {
    return this._scene;
  }

  public set scene(scene: Scene) {
    this._scene = scene;
  }

  public get isRunning {
    return !this.isFinished;
  }

  /**
   * Called when the component is being added to the scene
   */
  onInit() {
    // override
  }

  /**
   * Handles incoming message
   */
  onMessage(msg: Message) {
    // override
  }

  /**
   * Handles update loop
   */
  onUpdate(delta: number, absolute: number) {
    // override
  }

  /**
   * Called before removal from scene
   */
  onRemove() {
    // override
  }

  /**
   * Called after finish()
   */
  onFinish() {
    // override
  }

  /**
   * Subscribes itself as a listener for action with given key
   */
  subscribe(action: string, ...actions: string[]) {
    this.scene._subscribeComponent(action, this);
    for (let action of actions) {
      this.scene._subscribeComponent(action, this);
    }
  }

  /**
   * Unsubscribes itself
   */
  unsubscribe(action: string) {
    this.scene._unsubscribeComponent(action, this);
  }

  /**
   * Sends a message to all subscribers
   */
  sendMessage(action: string, data: any = null) {
    this.scene.sendMessage(new Message(action, this, this.owner, data));
  }

  /**
   * Detaches component from scene
   */
  finish() {
    this.owner.removeComponent(this);
    this.onFinish();
    this.isFinished = true;
  }
}


