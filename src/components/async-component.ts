import Message from '../engine/message';
import Component from '../engine/ecs-component';
import Container from '../engine/game-objects/container';
import { QueryCondition, queryConditionCheck } from '../utils/query-condition';
import CmdNode from '../utils/cmd-node';
import { Func } from '../utils/helpers';

const CMD_WAIT_TIME = 1;
const CMD_ADD_COMPONENT_AND_WAIT = 2;
const CMD_WAIT_FOR_FINISH = 3;
const CMD_WAIT_FRAMES = 4;
const CMD_WAIT_FOR_MESSAGE = 5;
const CMD_WAIT_FOR_MESSAGE_CONDITION = 6;
const CMD_ADD_COMPONENTS_AND_WAIT = 7;

/**
 * Component that executes a chain of commands during the update loop by using JavaScript generators
 * =================================####### WARNING #######==========================================
 * This component is heavily experimental. If you wanna use chain of commands, use chain-component instead
 * =================================####### WARNING #######========================================== 
 */
export default class AsyncComponent<T> extends Component<T> {

	// current node
	protected current: CmdNode = null;
	protected currentGenerator: Generator<any>;
	// help parameters used for processing one node
	protected tmpParam: any = null;
	protected tmpParam2: any = null;

	// root generator from which we can call all other functions
	protected rootGenerator: Generator<any, void, unknown>;

	constructor(generator: (cmp: AsyncComponent<T>) => Generator<any, void, unknown>, props?: T) {
		super(props);
		this.rootGenerator = generator(this);
	}

	onInit() {
		super.onInit();
		// execute the root generator
		this.rootGenerator.next();
	}

	/**
	 * Adds a new component to a given game object (or to an owner if not specified)
	 * and waits until its finished
	 * @param component component or function that returns a component
	 * @param gameObj game object or function that returns a game object
	 */
	addComponentAndWait(component: Component<any> | Func<void, Component<any>>, gameObj: Container | Func<void, Container> = null): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_ADD_COMPONENT_AND_WAIT, component, gameObj);
		return this.currentGenerator;
	}

	/**
	 * Adds a set of new components to a given game object (or to an owner if not specified)
	 * and waits until all of them are finished
	 * @param components list of components
	 * @param gameObj game object or function that returns a game object
	 */
	addComponentsAndWait(components: Component<any>[], gameObj: Container | Func<void, Container> = null): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_ADD_COMPONENTS_AND_WAIT, components, gameObj);
		return this.currentGenerator;
	}

	/**
	 * Waits given amount of miliseconds
	 * @param time number of miliseconds to wait; or function that returns this number
	 */
	waitTime(time: number | Func<void, number>): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_WAIT_TIME, time);
		return this.currentGenerator;
	}

	/**
	 * Waits until given component hasn't finished
	 * @param component or function that returns this component
	 */
	waitForFinish(component: Component<any> | Component<any>[] | Func<void, Component<any>> | Func<void, Component<any>[]>): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_WAIT_FOR_FINISH, component);
		return this.currentGenerator;
	}

	/**
	 * Waits given number of iterations of update loop
	 * @param num number of frames
	 */
	waitFrames(num: number): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_WAIT_FRAMES, num);
		return this.currentGenerator;
	}

	/**
	 * Waits until a message with given key isn't sent
	 * @param msg message key
	 */
	waitForMessage(msg: string): IterableIterator<void> {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_WAIT_FOR_MESSAGE, msg);
		return this.currentGenerator;
	}

	/**
	 * Waits until a message with given key and a specific condition isn't sent
	 */
	waitForMessageConditional(msg: string, condition: QueryCondition) {
		this.currentGenerator = this.createGenerator();
		this.enqueue(CMD_WAIT_FOR_MESSAGE_CONDITION, msg, condition);
		return this.currentGenerator;
	}

	onMessage(msg: Message) {
		if (this.current && ((this.current.key === CMD_WAIT_FOR_MESSAGE && this.current.param1 === msg.action) || (
			this.current.key === CMD_WAIT_FOR_MESSAGE_CONDITION && this.current.param1 === msg.action &&
			queryConditionCheck(msg.gameObject, this.current.param2)))) {
			this.tmpParam2 = true; // set a flag that the message just arrived
		}
	}

	onUpdate(delta: number, absolute: number) {
		if (this.owner === null) {
			// one of the closures might have removed this component from its parent
			return;
		}

		if (this.current == null) {
			// no more items -> finish
			this.finish();
			return;
		}

		switch (this.current.key) {
			case CMD_WAIT_TIME:
				this.current.cacheParams();

				if (this.tmpParam == null) {
					// save the current time to a variable
					this.tmpParam = absolute;
				}

				if ((absolute - this.tmpParam) > this.current.getParam1()) {
					// it is time to go to the next item
					this.tmpParam = null;
					this.current.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_ADD_COMPONENT_AND_WAIT:
				if (!this.current.cached) {
					// add only once
					this.current.cacheParams();
					let gameObj = this.current.param2C != null ? this.current.param2C : this.owner;
					gameObj.addComponent(this.current.param1C);
				}
				// wait for finish
				if (!this.current.getParam1().isRunning) {
					this.tmpParam = null;
					this.current.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_ADD_COMPONENTS_AND_WAIT:
				if (!this.current.cached) {
					// add only once
					this.current.cacheParams();
					let gameObj = this.current.param2C != null ? this.current.param2C : this.owner;
					for (let component of this.current.param1C) {
						gameObj.addComponent(component);
					}
				}
				// wait for finish
				if (!(this.current.getParam1()).find(cmp => cmp.isRunning)) {
					this.tmpParam = null;
					this.current.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_WAIT_FOR_FINISH:
				// wait until isFinished is true
				if (!this.current.cached) {
					this.current.cacheParams();
				}
				const cmp = this.current.getParam1();
				const isArray = Array.isArray(cmp);
				if ((!isArray && !cmp.isRunning) || (isArray && (cmp as Component<any>[]).filter(c => !c.isCompleted).length === 0)) {
					this.current.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_WAIT_FRAMES:
				// wait given number of update cycles
				if (this.tmpParam == null) {
					this.tmpParam = 0;
				}

				if (++this.tmpParam > this.current.param1) {
					this.tmpParam = null;
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_WAIT_FOR_MESSAGE:
			case CMD_WAIT_FOR_MESSAGE_CONDITION:
				// tmpParam indicates that this component has already subscribed the message
				if (this.tmpParam === true) {
					if (this.tmpParam2 === true) { // tmpParam2 indicates that the message has already arrived
						// got message -> unsubscribe and proceed
						this.unsubscribe(this.current.param1);
						this.tmpParam = this.tmpParam2 = null;
						this.gotoNextImmediately(delta, absolute);
					}
				} else {
					// just subscribe and wait
					this.tmpParam = true;
					this.tmpParam2 = false;
					this.subscribe(this.current.param1);
				}
				break;
		}
	}

	protected enqueue(key: number, param1: any = null, param2: any = null) {
		let node = new CmdNode(key, param1, param2);
		this.current = node;
	}


	// goes to the next node and re-executes the update loop
	protected gotoNextImmediately(delta: number, absolute: number) {
		// generator created by createGenerator() function will obtain TRUE and exits its loop
		this.currentGenerator.next(); // execute generator for the first time
		const newVal = this.currentGenerator.next(true); // finish it

		if (newVal.done) {
			const res = this.rootGenerator.next();
			if (res.done) {
				this.finish();
			}
		} else {
			throw Error('Unexpected behavior while finishing an internal generator');
		}

		this.onUpdate(delta, absolute);
	}

	protected *createGenerator() {
		while (true) {
			const result = yield;
			if (result) {
				return;
			}
		}
	}
}