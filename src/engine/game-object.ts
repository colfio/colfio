import GameObjectProxy from './game-object-proxy';
import Component from './component';
import Scene from './scene';

import BitmapText from './game-objects/bitmap-text';
import Container from './game-objects/container';
import Graphics from './game-objects/graphics';
import Mesh from './game-objects/mesh';
import NineSlicePlane from './game-objects/nine-slice-plane';
import ParticleContainer from './game-objects/particle-container';
import Sprite from './game-objects/sprite';
import Text from './game-objects/text';
import TilingSprite from './game-objects/tiling-sprite';

import * as PIXI from 'pixi.js';

/**
 * PIXI object attached to the component architecture
 */
export default interface GameObject {
	// unique identifier
	id: number;
	// name of the object
	name: string;
	// state of the object
	stateId: number;
	// wrapped pixi object
	pixiObj: PIXI.Container;
	// parent game object
	parentGameObject: GameObject;
	// scene
	scene: Scene;
	// Link to proxy object, <<<shouldn't be used from within any custom component>>>
	_proxy: GameObjectProxy;

	/*
	* Casts itself to container (works only if the object is an actual container!)
	*/
	asContainer(): Container;

	/*
	 * Casts itself to particle container (works only if the object is an actual particle container!)
	 */
	asParticleContainer(): ParticleContainer;

	/*
	 * Casts itself to Sprite (works only if the object is an actual sprite!)
	 */
	asSprite(): Sprite;

	/*
	* Casts itself to TilingSprite (works only if the object is an actual tilingsprite!)
	*/
	asTilingSprite(): TilingSprite;

	/*
	 * Casts itself to Text (works only if the object is an actual text!)
	 */
	asText(): Text;

	/*
	 * Casts itself to BitmapText (works only if the object is an actual bitmap text!)
	 */
	asBitmapText(): BitmapText;

	/*
	 * Casts itself to Graphics (works only if the object is an actual graphics!)
	 */
	asGraphics(): Graphics;

	/*
	 * Casts itself to Mesh  (works only if the object is an actual Mesh!)
	 */
	asMesh(): Mesh;

	/**
	 * Adds a new component
	 */
	addComponent(component: Component<any>);

	/**
	 * Adds a new component and runs it instantly
	 */
	addComponentAndRun(component: Component<any>);
	/**
	 * Tries to find a component by its class
	 */
	findComponentByName<T extends Component<any>>(name: string): T;
	/**
	 * Removes an existing component
	 */
	removeComponent(component: Component<any>): void;
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
	 * Detaches itself from its parent but doesn't destroy the object
	 */
	detach(): void;
	/**
	 * Detaches itself from its parent and destroys the container
	 */
	destroy(): void;
	/**
	 * Destroys all children
	 */
	destroyChildren(): void;
}
