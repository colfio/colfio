import GenericComponent from '../components/generic-component';
import Component from './component';
import Scene from './scene';
import { PIXICmp } from './pixi-object';
import Flags from './flags';


/**
 * Game entity that aggregates generic attributes and components
 * Is used as a proxy by objects directly inherited from PIXI objects
 */
export default class GameObjectProxy {
  private static idCounter = 0;

  // auto-incremented identifier
  protected _id = 0;
  // state of this object
  protected _stateId = 0;
  // game object this proxy is attached to
  protected _pixiObj: PIXI.Container = null;
  // link to scene
  protected _scene: Scene = null;
  // collection of tags
  protected _tags: Set<string> = new Set();
  // bit-array of flags
  protected flags = new Flags();
  // set of all components, mapped by their id
  protected components = new Map<number, Component>();
  // generic attributse
  protected attributes: Map<string, any> = new Map<string, any>();
  // list of components that will be added at the end of update loop
  protected componentsToAdd = new Array<Component>();

  constructor(name: string, pixiObj: PIXICmp.GameObject) {
    this._id = GameObjectProxy.idCounter++;
    this._pixiObj = <PIXI.Container><any>pixiObj;
    this._pixiObj.name = name;
  }

  public get id() {
    return this._id;
  }

  public get cmpObj() {
    return <PIXICmp.GameObject><any>this._pixiObj;
  }

  public get pixiObj() {
    return this._pixiObj;
  }

  public get scene() {
    return this._scene;
  }

  public set scene(scene: Scene) {
    this._scene = scene;
  }

  public get rawAttributes() {
    return this.attributes;
  }

  public get rawComponents() {
    return this.components;
  }

  public get tags() {
    return new Set(this._tags);
  }

  /**
   * Adds a new component
   */
  addComponent(component: Component, runInstantly: boolean = false) {
    if(runInstantly) {
      this.initComponent(component);
      component.onUpdate(this.scene.currentDelta, this.scene.currentAbsolute);
    } else {
      this.componentsToAdd.push(component);
    }
  }

  /**
   * Removes an existing component
   */
  removeComponent(component: Component) {
    component.onRemove();
    this.components.delete(component.id);
    this.scene._onComponentRemoved(component, this);
  }

  /**
   * Removes a component by class if it exists
   * Returns true if the component was removed
   */
  removeComponentByName(name: string) {
    for (let [, cmp] of this.components) {
      if (cmp.name === name) {
        this.removeComponent(cmp);
        return;
      }
    }
  }

  /**
   * Removes all components
   */
  removeAllComponents() {
    for (let [, cmp] of this.components) {
      this.removeComponent(cmp);
    }
  }

  /**
   * Tries to find a component by given class name
   */
  findComponentByName<T extends Component>(name: string): T {
    for (let [, cmp] of this.components) {
      if (cmp.constructor.name === name) {
        return cmp as T;
      }
    }
    return null;
  }

  /**
   * Inserts a new attribute to the map
   */
  addAttribute(key: string, val: any) {
    this.attributes.set(key, val);
  }

  /**
   * Gets an attribute by its key
   */
  getAttribute<T>(key: string): T {
    return this.attributes.get(key);
  }

  /**
   * Removes an existing attribute
   */
  removeAttribute(key: string): boolean {
    return this.attributes.delete(key);
  }

  /**
   * Add a new tag
   */
  addTag(tag: string) {
    this._tags.add(tag);
    this.scene._onTagAdded(tag, this);
  }

  /**
   * Removes tag
   */
  removeTag(tag: string) {
    this._tags.delete(tag);
    this.scene._onTagRemoved(tag, this);
  }

  /**
   * Returns true if given tag is set
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag);
  }

  /**
   * Sets flag at given index
   */
  setFlag(flag: number) {
    this.flags.setFlag(flag);
    this.scene._onFlagChanged(flag, true, this);
  }

  /**
   * Resets flag at given index
   */
  resetFlag(flag: number) {
    this.flags.resetFlag(flag);
    this.scene._onFlagChanged(flag, false, this);
  }

  /**
   * Returns true, if a flag at given index is set
   */
  hasFlag(flag: number): boolean {
    return this.flags.hasFlag(flag);
  }

  /**
   * Inverts a flag at given index
   */
  invertFlag(flag: number) {
    this.flags.invertFlag(flag);
    this.scene._onFlagChanged(flag, this.flags.hasFlag(flag), this);
  }

  /**
   * Gets state of this object
   */
  get stateId(): number {
    return this._stateId;
  }

  /**
   * Sets state of this object
   */
  set stateId(state: number) {
    let previous = this.stateId;
    this._stateId = state;
    this.scene._onStateChanged(previous, state, this);
  }

  /**
   * Processes a new child
   */
  onChildAdded(object: GameObjectProxy) {
    this.scene._addGameObject(object);
  }

  /**
   * Processes a removed child
   */
  onChildRemoved(object: GameObjectProxy) {
    this.scene._removeGameObject(object);
  }

  update(delta: number, absolute: number) {
    // update all my components
    for (let [, cmp] of this.components) {
      cmp.onUpdate(delta, absolute);
    }

    // update all my children
    for (let child of this.pixiObj.children) {
      let cmpChild = <PIXICmp.GameObject><any>child;
      if (cmpChild && cmpChild._proxy) { // some object may be regular PIXI objects, not PIXICmp
        cmpChild._proxy.update(delta, absolute);
      }
    }

    if (this.componentsToAdd.length !== 0) {
      // add components that are to be updated
      this.componentsToAdd.forEach(cmp => this.initComponent(cmp));
      this.componentsToAdd = new Array<Component>();
    }
  }

  private initComponent(component: Component) {
    this.components.set(component.id, component);
    this.scene._onComponentAdded(component, this);
  }
}