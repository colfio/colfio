import GameObjectProxy from './game-object-proxy';
import Component from './component';
import Scene from './scene';
import * as PIXI from 'pixi.js';

/**
 * Namespace for all PIXI objects that are to be
 * integrated with the component architecture
 */
export namespace PIXICmp {

  /**
   * PIXI object attached to the component architecture
   */
  export interface GameObject {
    // unique identifier
    id: number;
    // name of the object
    name: string;
    // state of the object
    stateId: number;
    // tags of this object
    tags: Set<string>;
    // wrapped pixi object
    pixiObj: PIXI.Container;
    // parent game object
    parentGameObject: PIXICmp.GameObject;
    // scene
    scene: Scene;
    // Link to proxy object, <<<shouldn't be used from within any custom component>>>
    _proxy: GameObjectProxy;

    /*
     * Casts itself to Sprite (works only if the object is an actual sprite!)
     */
    asSprite(): PIXICmp.Sprite;

    /*
     * Casts itself to Text (works only if the object is an actual text!)
     */
    asText(): PIXICmp.Text;

    /*
     * Casts itself to BitmapText (works only if the object is an actual bitmap text!)
     */
    asBitmapText(): PIXICmp.BitmapText;

    /*
     * Casts itself to Graphics (works only if the object is an actual graphics!)
     */
    asGraphics(): PIXICmp.Graphics;


    /**
     * Adds a new component
     */
    addComponent(component: Component, runInstantly?: boolean): void;
    /**
     * Removes an existing component
     */
    removeComponent(component: Component): void;
    /**
     * Removes component by given class name
     */
    removeComponentByName(name: string);
    /**
     * Tries to find a component by its class
     */
    findComponentByName<T extends Component>(name: string): T;
    /**
     * Adds or changes generic attribute
     */
    assignAttribute(key: string, val: any): void;
    /**
     * Returns an attribute by its key
     */
    getAttribute<T>(key: string): T;
    /**
     * Removes an existing attribute
     * Returns true if the attribute was successfully removed
     */
    removeAttribute(key: string): boolean;
    /**
     * Add a new tag
     */
    addTag(tag: string);
    /**
     * Removes tag
     */
    removeTag(tag: string);
    /**
     * Returns true if given tag is set
     */
    hasTag(tag: string): boolean;
    /**
     * Sets flag at given index
     */
    setFlag(flag: number): void;
    /**
     * Resets flag at given index
     */
    resetFlag(flag: number): void;
    /**
     * Returns true, if there is a flag set at given index
     */
    hasFlag(flag: number): boolean;
    /**
     * Inverts a flag at given index
     */
    invertFlag(flag: number): void;
    /**
     * Removes itself from its parent
     */
    remove(): void;
  }


  /**
   * Wrapper for PIXI.Graphics
   */
  export class Graphics extends PIXI.Graphics implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '') {
      super();
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      throw new Error('Can\'t cast this object to sprite!');
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      return this;
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }


  /**
   * Wrapper for PIXI.Container
   */
  export class Container extends PIXI.Container implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '') {
      super();
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      throw new Error('Can\'t cast this object to sprite!');
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }

  /**
   * Wrapper for PIXI.ParticleContainer
   */
  export class ParticleContainer extends PIXI.ParticleContainer implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '') {
      super();
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      throw new Error('Can\'t cast this object to sprite!');
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }


  /**
   * Wrapper for PIXI.Sprite
   */
  export class Sprite extends PIXI.Sprite implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '', texture?: PIXI.Texture) {
      super(texture);
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      return this;
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }



  /**
   * Wrapper for PIXI.Sprite
   */
  export class TilingSprite extends PIXI.TilingSprite implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '', texture?: PIXI.Texture, width?: number, height?: number) {
      super(texture, width, height);
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      return this;
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }

  /**
   * Wrapper for PIXI.Text
   */
  export class Text extends PIXI.Text implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '', text: string = '') {
      super(text);
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      throw new Error('Can\'t cast this object to sprite!');
    }

    asText(): PIXICmp.Text {
      return this;
    }

    asBitmapText(): PIXICmp.BitmapText {
      throw new Error('Can\'t cast this object to bitmap text!');
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }

  /**
   * Wrapper for PIXI.BitmapText
   */
  export class BitmapText extends PIXI.BitmapText implements GameObject {
    _proxy: GameObjectProxy;

    constructor(name: string = '', text: string = '', fontName: string, fontSize: number, fontColor: number = 0xFFFFFF) {
      super(text, { font: { name: fontName, size: fontSize }, tint: fontColor });
      this._proxy = new GameObjectProxy(name, this);
    }

    get id(): number {
      return this._proxy.id;
    }

    get pixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }

    get scene(): Scene {
      return this._proxy.scene;
    }

    get parentGameObject(): PIXICmp.GameObject {
      return <PIXICmp.GameObject><any>this.parent;
    }

    asSprite(): PIXICmp.Sprite {
      throw new Error('Can\'t cast this object to sprite!');
    }

    asText(): PIXICmp.Text {
      throw new Error('Can\'t cast this object to text!');
    }

    asBitmapText(): PIXICmp.BitmapText {
      return this;
    }

    asGraphics(): PIXICmp.Graphics {
      throw new Error('Can\'t cast this object to graphics');
    }

    // overrides pixijs function
    addChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let newChild = super.addChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildAdded(cmpObj._proxy);
        }
      }

      return newChild;
    }

    // overrides pixijs function
    addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
      let newChild = super.addChildAt(child, index);
      let cmpObj = <GameObject><any>newChild;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
      return newChild;
    }

    // overrides pixijs function
    removeChild<T extends PIXI.DisplayObject[]>(
      ...children: T
    ): T[0] {
      let removed = super.removeChild(...children);
      for (let child of children) {
        let cmpObj = <GameObject><any>child;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }

      return removed;
    }

    // overrides pixijs function
    removeChildAt(index: number): PIXI.DisplayObject {
      let removed = super.removeChildAt(index);
      let cmpObj = <GameObject><any>removed;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
      return removed;
    }

    // overrides pixijs function
    removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
      let removed = super.removeChildren(beginIndex, endIndex);
      for (let removedObj of removed) {
        let cmpObj = <GameObject><any>removedObj;
        if (cmpObj && cmpObj._proxy) {
          this._proxy.onChildRemoved(cmpObj._proxy);
        }
      }
      return removed;
    }

    addComponent(component: Component, runInstantly: boolean = false) {
      this._proxy.addComponent(component, runInstantly);
    }
    removeComponent(component: Component) {
      this._proxy.removeComponent(component);
    }
    removeComponentByName(name: string) {
      this._proxy.removeComponentByName(name);
    }
    findComponentByName<T extends Component>(name: string): T {
      return this._proxy.findComponentByName<T>(name);
    }
    assignAttribute(key: string, val: any) {
      this._proxy.assignAttribute(key, val);
    }
    getAttribute<T>(key: string): T {
      return this._proxy.getAttribute<T>(key);
    }
    removeAttribute(key: string): boolean {
      return this._proxy.removeAttribute(key);
    }
    addTag(tag: string) {
      this._proxy.addTag(tag);
    }
    removeTag(tag: string) {
      this._proxy.removeTag(tag);
    }
    hasTag(tag: string): boolean {
      return this._proxy.hasTag(tag);
    }
    get tags() {
      return this._proxy.tags;
    }
    setFlag(flag: number) {
      this._proxy.setFlag(flag);
    }
    resetFlag(flag: number) {
      this._proxy.resetFlag(flag);
    }
    hasFlag(flag: number): boolean {
      return this._proxy.hasFlag(flag);
    }
    invertFlag(flag: number) {
      this._proxy.invertFlag(flag);
    }
    get stateId(): number {
      return this._proxy.stateId;
    }
    set stateId(state: number) {
      this._proxy.stateId = state;
    }
    getPixiObj(): PIXI.Container {
      return this._proxy.pixiObj;
    }
    remove() {
      this.parent.removeChild(this);
    }
    getScene(): Scene {
      return this._proxy.scene;
    }
  }
}