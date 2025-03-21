import { GameObjectProxy } from '../game-object-proxy';
import type { Component } from '../component';
import type { Scene } from '../scene';
import type { GameObject } from '../game-object';

import type { AnimatedSprite } from './animated-sprite';
import type { BitmapText } from './bitmap-text';
import type { Graphics } from './graphics';
import type { Mesh } from './mesh';
import type { NineSlicePlane } from './nine-slice-plane';
import type { ParticleContainer } from './particle-container';
import type { Container } from './container';
import type { SimpleMesh } from './simple-mesh';
import type { SimpleRope } from './simple-rope';
import type { Sprite } from './sprite';
import type { Text } from './text';
import type { TilingSprite } from './tiling-sprite';

import * as PIXI from 'pixi.js';

/**
 * Wrapper for PIXI.SimplePlane
 */
export class SimplePlane extends PIXI.SimplePlane implements GameObject {
	_proxy: GameObjectProxy;

	constructor(name = '', texture: PIXI.Texture, verticesX: number, verticesY: number) {
		super(texture, verticesX, verticesY);
		this._proxy = new GameObjectProxy(name, this);
	}

	get id(): number {
		return this._proxy.id;
	}

	get pixiObj(): PIXI.Container {
		return this;
	}

	get scene(): Scene {
		return this._proxy.scene;
	}

	get parentGameObject(): Container {
		return <Container><any>this.parent;
	}

	asAnimatedSprite(): AnimatedSprite {
		throw new Error('Can\'t cast to this object!');
	}
	asBitmapText(): BitmapText {
		throw new Error('Can\'t cast to this object!');
	}
	asContainer(): Container {
		return this;
	}
	asGraphics(): Graphics {
		throw new Error('Can\'t cast to this object!');
	}
	asMesh(): Mesh {
		return this;
	}
	asNineSlicePlane(): NineSlicePlane {
		throw new Error('Can\'t cast to this object!');
	}
	asParticleContainer(): ParticleContainer {
		throw new Error('Can\'t cast to this object!');
	}
	asSimpleMesh(): SimpleMesh {
		throw new Error('Can\'t cast to this object!');
	}
	asSimplePlane(): SimplePlane {
		return this;
	}
	asSimpleRope(): SimpleRope {
		throw new Error('Can\'t cast to this object!');
	}
	asSprite(): Sprite {
		throw new Error('Can\'t cast to this object!');
	}
	asText(): Text {
		throw new Error('Can\'t cast to this object!');
	}
	asTilingSprite(): TilingSprite {
		throw new Error('Can\'t cast to this object!');
	}

	// overrides pixijs function
	addChild<T extends PIXI.DisplayObject[]>(...children: T): T[0] {
		const newChild = super.addChild(...children);
		for (const child of children) {
			const cmpObj = <GameObject><any>child;
			if (cmpObj && cmpObj._proxy) {
				this._proxy.onChildAdded(cmpObj._proxy);
			}
		}

		return newChild;
	}

	// overrides pixijs function
	addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
		const newChild = super.addChildAt(child, index);
		const cmpObj = <GameObject><any>newChild;
		if (cmpObj && cmpObj._proxy) {
			this._proxy.onChildAdded(cmpObj._proxy);
		}
		return newChild;
	}

	// overrides pixijs function
	removeChild<T extends PIXI.DisplayObject[]>(...children: T): T[0] {
		const removed = super.removeChild(...children);
		for (const child of children) {
			const cmpObj = <GameObject><any>child;
			if (cmpObj && cmpObj._proxy) {
				this._proxy.onChildDetached(cmpObj._proxy);
			}
		}

		return removed;
	}

	// overrides pixijs function
	removeChildAt(index: number): PIXI.DisplayObject {
		const removed = super.removeChildAt(index);
		const cmpObj = <GameObject><any>removed;
		if (cmpObj && cmpObj._proxy) {
			this._proxy.onChildDetached(cmpObj._proxy);
		}
		return removed;
	}

	// overrides pixijs function
	removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
		const removed = super.removeChildren(beginIndex, endIndex);
		for (const removedObj of removed) {
			const cmpObj = <GameObject><any>removedObj;
			if (cmpObj && cmpObj._proxy) {
				this._proxy.onChildDetached(cmpObj._proxy);
			}
		}
		return removed;
	}

	destroyChild<T extends PIXI.DisplayObject[]>(...children: T): T[0] {
		const removed = super.removeChild(...children);
		const cmpObj = <GameObject><any>removed;
		if (cmpObj && cmpObj._proxy) {
			this._proxy.onChildDestroyed(cmpObj._proxy);
		}
		return removed;
	}

	addComponent(component: Component<any>) {
		this._proxy.addComponent(component, false);
	}
	addComponentAndRun(component: Component<any>) {
		this._proxy.addComponent(component, true);
	}
	findComponentByName<T extends Component<any>>(name: string): T | null {
		return this._proxy.findComponentByName<T>(name);
	}
	removeComponent(component: Component<any>) {
		this._proxy.removeComponent(component);
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
	detach(): void {
		this.parent.removeChild(this);
	}
	destroy(): void {
		if (this.parentGameObject) {
			this.parentGameObject.destroyChild(this);
		}
		super.destroy({ children: true });
	}
	destroyChildren(): void {
		for (const child of [...this.children]) {
			child.destroy();
		}
	}
}
