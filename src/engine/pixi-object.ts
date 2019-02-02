import { GenericComponent } from '../components/generic-component';
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
    export interface ComponentObject {
        // state of the object
        numState: number;
        // Link to proxy object, <<<shouldn't be used from within any custom component>>>
        proxy: GameObjectProxy;
        // unique identifier
        id: number;
        // tag of this object
        tag: string;
        // wrapped pixi object
        pixiObj: PIXI.Container;
        // scene
        scene: Scene;

        /**
         * Adds a new component
         */
        addComponent(component: Component): void;
        /**
         * Removes an existing component
         */
        removeComponent(component: Component): void;
        /**
         * Removes component by given class name
         */
        removeComponentByClass(name: string): boolean;
        /**
         * Tries to find a component by its class
         */
        findComponentByClass(name: string): Component;
        /**
         * Adds a new generic attribute
         */
        addAttribute(key: string, val: any): void;
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
    export class Graphics extends PIXI.Graphics implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);

            for (let child of children) {
                cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }


    /**
     * Wrapper for PIXI.Container
     */
    export class Container extends PIXI.Container implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            for(let child of children) {
                let cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            for(let child of children) {
                let cmpObj = <ComponentObject><any>child;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }

            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }

    /**
     * Wrapper for PIXI.ParticleContainer
     */
    export class ParticleContainer extends PIXI.ParticleContainer implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            for(let child of children) {
                let cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            for(let child of children) {
                let cmpObj = <ComponentObject><any>child;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }

            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }


    /**
     * Wrapper for PIXI.Sprite
     */
    export class Sprite extends PIXI.Sprite implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "", texture?: PIXI.Texture) {
            super(texture);
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            for(let child of children) {
                let cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            for(let child of children) {
                let cmpObj = <ComponentObject><any>child;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }

            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }



    /**
     * Wrapper for PIXI.Sprite
     */
    export class TilingSprite extends PIXI.TilingSprite implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "", texture?: PIXI.Texture, width?: number, height?: number) {
            super(texture, width, height);
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            for(let child of children) {
                let cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            for(let child of children) {
                let cmpObj = <ComponentObject><any>child;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }

            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }

    /**
     * Wrapper for PIXI.Text
     */
    export class Text extends PIXI.Text implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "", text: string = "") {
            super(text);
            this.proxy = new GameObjectProxy(tag, this);
        }

        get id(): number {
            return this.proxy.id;
        }

        get tag(): string {
            return this.proxy.tag;
        }

        get pixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }

        get scene(): Scene {
            return this.proxy.scene;
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let newChild = super.addChild(...children);
            for(let child of children) {
                let cmbObj = <ComponentObject><any>child;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild<T extends PIXI.DisplayObject[]>(
            ...children: T
        ): T[0] {
            let removed = super.removeChild(...children);
            for(let child of children) {
                let cmpObj = <ComponentObject><any>child;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }

            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject {
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
            let removed = super.removeChildren(beginIndex, endIndex);
            for (let removedObj of removed) {
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string): boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string): Component {
            return this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute<T>(key: string): T {
            return this.proxy.getAttribute<T>(key);
        }
        removeAttribute(key: string): boolean {
            return this.proxy.removeAttribute(key);
        }
        setFlag(flag: number) {
            this.proxy.setFlag(flag);
        }
        resetFlag(flag: number) {
            this.proxy.resetFlag(flag);
        }
        hasFlag(flag: number): boolean {
            return this.proxy.hasFlag(flag);
        }
        invertFlag(flag: number) {
            this.proxy.invertFlag(flag);
        }
        get numState(): number {
            return this.proxy.numState;
        }
        set numState(state: number) {
            this.proxy.numState = state;
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.pixiObj;
        }
        remove() {
            this.parent.removeChild(this);
        }
        getScene(): Scene {
            return this.proxy.scene;
        }
    }

}