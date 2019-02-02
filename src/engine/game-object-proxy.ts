import { GenericComponent } from '../components/generic-component';
import Component from './component';
import Scene from './scene';
import { Message } from './message';
import { PIXICmp } from './pixi-object';
import Flags from './flags';
import { Messages } from './constants';


/**
 * Game entity that aggregates generic attributes and components
 * Is used as a proxy by objects directly inherited from PIXI objects
 */
export default class GameObjectProxy {
    private static idCounter = 0;

    // auto-incremented identifier
    protected _id = 0;
    // state of this object
    protected _numState = 0;
    // string tag
    protected _tag: string = null;
    // game object this proxy is attached to
    protected _pixiObj: PIXI.Container = null;
    // link to scene
    protected _scene: Scene = null;
    // bit-array of flags
    protected flags = new Flags();
    // set of all components, mapped by their id
    protected components = new Map<number, Component>();
    // generic attributse
    protected attributes: Map<string, any> = new Map<string, any>();
    // list of components that will be added at the end of update loop
    protected componentsToAdd = new Array<Component>();

    constructor(tag: string, pixiObj: PIXICmp.ComponentObject) {
        this._id = GameObjectProxy.idCounter++;
        this._tag = tag;
        this._pixiObj = <PIXI.Container><any>pixiObj;
    }

    public get id() {
        return this._id;
    }

    public get tag() {
        return this._tag;
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

    /**
     * Adds a new component
     */
    addComponent(component: Component) {
        this.componentsToAdd.push(component);
    }

    /**
     * Removes an existing component
     */
    removeComponent(component: Component) {
        component.onRemove();
        this.components.delete(component.id);
        this.scene._removeComponentSubscription(component);
        this.scene.sendMessage(new Message(Messages.COMPONENT_REMOVED, component, <PIXICmp.ComponentObject><any>this.pixiObj));
    }

    /**
     * Removes a component by class if it exists
     * Returns true if the component was removed
     */
    removeComponentByClass(name: string): boolean {
        for (let [key, cmp] of this.components) {
            // can be optimized by adding a new type-cmp map
            if (cmp.constructor.name === name) {
                this.removeComponent(cmp);
                return true;
            }
        }
        return false;
    }

    /**
     * Removes all components
     */
    removeAllComponents() {
        for (let [key, cmp] of this.components) {
            this.removeComponent(cmp);
        }
    }

    /**
     * Tries to find a component by given class name
     */
    findComponentByClass(name: string) {
        for (let [key, cmp] of this.components) {
            if (cmp.constructor.name === name || (cmp instanceof GenericComponent && cmp.name === name)) {
                return cmp;
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
     * Sets flag at given index
     */
    setFlag(flag: number) {
        this.flags.setFlag(flag);
    }

    /**
     * Resets flag at given index
     */
    resetFlag(flag: number) {
        this.flags.resetFlag(flag);
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
    }

    /**
     * Gets state of this object
     */
    get numState(): number {
        return this._numState;
    }

    /**
     * Sets state of this object
     */
    set numState(state: number) {
        let previous = this._numState;
        this._numState = state;
        this.scene.sendMessage(new Message(Messages.STATE_CHANGED, null, <PIXICmp.ComponentObject><any>this.pixiObj, [previous, state]));
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
        object.removeAllComponents();
        this.scene._removeGameObject(object);
    }

    update(delta: number, absolute: number) {
        // update all components
        for (let [key, cmp] of this.components) {
            cmp.onUpdate(delta, absolute);
        }

        // update all children
        for (let child of this.pixiObj.children) {
            let cmpChild = <PIXICmp.ComponentObject><any>child;
            cmpChild.proxy.update(delta, absolute);
        }

        if (this.componentsToAdd.length !== 0) {
            // add components that are to be updated
            for (let component of this.componentsToAdd) {
                component.owner = <PIXICmp.ComponentObject><any>this.pixiObj;
                component.scene = this.scene;
                this.components.set(component.id, component);
                component.onInit();
                this.scene.sendMessage(new Message(Messages.COMPONENT_ADDED, component, <PIXICmp.ComponentObject><any>this.pixiObj));
            }

            this.componentsToAdd = new Array<Component>();
        }
    }
}