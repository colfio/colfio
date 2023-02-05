/* eslint-disable @typescript-eslint/no-unused-vars */
import { Message } from './message';
import type { Scene } from './scene';
import type { Container } from './game-objects/container';

export enum ComponentState {
	NEW = 0,
	INITIALIZED = 1,
	RUNNING = 2,
	DETACHED = 3,
	FINISHED = 4,
	REMOVED = 5,
}

/**
 * Component that defines a functional behavior of an entity it is attached to
 */
export class Component<T = void> {
	private static idCounter = 0;

	// owner object of this component
	owner: Container;
	// link to scene
	scene: Scene;
	// properties
	props: T;
	// fixed-update frequency
	fixedFrequency?: number;
	// number of last update, is set automatically by its owner
	_lastFixedUpdate: number;
	// component state
	_cmpState: ComponentState = ComponentState.NEW;

	// auto-incremented id
	protected _id = 0;
	protected _name: string | undefined;

	constructor(props: T | void) {
		this._id = Component.idCounter++;
		this._lastFixedUpdate = 0;
		// TODO fixme workaround
		this.props = props || (null as any);
		this.scene = (null as any);
		this.owner = (null as any);
	}

	public get id() {
		return this._id;
	}

	public get name() {
		return this._name || this.constructor.name;
	}

	public get cmpState() {
		return this._cmpState;
	}

	public get isCompleted() {
		return this._cmpState === ComponentState.FINISHED || this._cmpState === ComponentState.REMOVED;
	}


	/**
	 * Called when the component is being added to a new object FOR THE FIRST TIME
	 */
	onInit() {
		// override
	}

	/**
	 * Called when the component is being added to the scene
	 */
	onAttach() {
		// override
	}

	/**
	 * Handles incoming message
	 */
	onMessage(msg: Message): any | void {
		// override
	}

	/**
	 * Handles fixed update loop
	 * Called ONLY if fixedFrequency is set
	 */
	onFixedUpdate(delta: number, absolute: number) {
		// override
	}

	/**
	 * Handles update loop
	 */
	onUpdate(delta: number, absolute: number) {
		// override
	}

	/**
	 * Called before the owner object gets detached from the scene
	 */
	onDetach() {
		// override
	}

	/**
	 * Called before the component gets removed from its owner object
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
	 * Subscribes itself as a listener for an action of a given key
	 */
	subscribe(...actions: string[]) {
		for (const action of actions) {
			this.scene._subscribeComponent(action, this);
		}
	}

	/**
	 * Unsubscribes itself from given action (or a set of actions)
	 */
	unsubscribe(...actions: string[]) {
		for (const action of actions) {
			this.scene._unsubscribeComponent(action, this);
		}
	}

	/**
	 * Sends a message to all subscribers
	 */
	sendMessage(action: string, data?: any, tagFilter?: string[]): Message | null {
		const msg = new Message(action, this, this.owner, data);
		this.scene.sendMessage(msg, tagFilter);
		return msg;
	}

	/**
	 * Aborts the component and immediately removes it from its object
	 * Will call onFinish(), onDetach() and onRemove()
	 */
	finish() {
		if (this.owner && this._cmpState === ComponentState.RUNNING) {
			this.onFinish();
			this._cmpState = ComponentState.FINISHED;
			this.owner.removeComponent(this);
		}
	}
}
