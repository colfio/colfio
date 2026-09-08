import { GameObjectProxy } from '../game-object-proxy';
import type { Component } from '../component';
import type { Scene } from '../scene';
import { isGameObject } from '../game-object';
import type { GameObject } from '../game-object';

import type { AnimatedSprite } from './animated-sprite';
import type { BitmapText } from './bitmap-text';
import type { Graphics } from './graphics';
import type { Mesh } from './mesh';
import type { NineSlicePlane } from './nine-slice-plane';
import type { ParticleContainer } from './particle-container';
import type { SimpleMesh } from './simple-mesh';
import type { SimplePlane } from './simple-plane';
import type { SimpleRope } from './simple-rope';
import type { Sprite } from './sprite';
import type { Text } from './text';
import type { TilingSprite } from './tiling-sprite';

import * as PIXI from 'pixi.js';

/**
 * Wrapper for PIXI.Container
 */
export class Container extends PIXI.Container implements GameObject {
	_proxy: GameObjectProxy;

	get name(): string {
		return this.label;
	}
	set name(value: string) {
		this.label = value;
	}

	constructor(name = '') {
		super();
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
		return this.parent as Container;
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
		throw new Error('Can\'t cast to this object!');
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
		throw new Error('Can\'t cast to this object!');
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
	addChild<T extends PIXI.Container[]>(...children: T): T[0] {
		const newChild = super.addChild(...children);
		for (const child of children) {
			if (isGameObject(child)) {
				this._proxy.onChildAdded(child._proxy);
			}
		}

		return newChild;
	}

	// overrides pixijs function
	addChildAt<T extends PIXI.Container>(child: T, index: number): T {
		const newChild = super.addChildAt(child, index);
		if (isGameObject(newChild)) {
			this._proxy.onChildAdded(newChild._proxy);
		}
		return newChild;
	}

	// overrides pixijs function
	removeChild<T extends PIXI.Container[]>(...children: T): T[0] {
		const removed = super.removeChild(...children);
		for (const child of children) {
			if (isGameObject(child)) {
				this._proxy.onChildDetached(child._proxy);
			}
		}

		return removed;
	}

	// overrides pixijs function
	removeChildAt<U extends PIXI.ContainerChild>(index: number): U {
		const removed = super.removeChildAt<U>(index);
		if (isGameObject(removed)) {
			this._proxy.onChildDetached(removed._proxy);
		}
		return removed;
	}

	// overrides pixijs function
	removeChildren(beginIndex?: number, endIndex?: number): PIXI.Container[] {
		const removed = super.removeChildren(beginIndex, endIndex);
		for (const removedObj of removed) {
			if (isGameObject(removedObj)) {
				this._proxy.onChildDetached(removedObj._proxy);
			}
		}
		return removed;
	}

	destroyChild<T extends PIXI.Container[]>(...children: T): T[0] {
		const removed = super.removeChild(...children);
		if (isGameObject(removed)) {
			this._proxy.onChildDestroyed(removed._proxy);
		}
		return removed;
	}
	addComponent<T extends Component<any>>(component: T): T {
		this._proxy.addComponent(component, false);
		return component;
	}
	addComponentAndRun<T extends Component<any>>(component: T): T {
		this._proxy.addComponent(component, true);
		return component;
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
		this.parent?.removeChild(this);
	}
	destroy(): void {
		if (this.parentGameObject) {
			this.parentGameObject.destroyChild(this);
		}
		super.destroy({ children: true, texture: true });
	}
	destroyChildren(): void {
		for (const child of [...this.children]) {
			child.destroy();
		}
	}
}
