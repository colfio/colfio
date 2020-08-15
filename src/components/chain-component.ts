import Message from '../engine/message';
import Component, { ComponentState } from '../engine/component';
import { Container } from '../engine/game-object';
import { QueryCondition, queryConditionCheck } from '../utils/query-condition';

const CMD_BEGIN_REPEAT = 1;
const CMD_END_REPEAT = 2;
const CMD_CALL = 3;
const CMD_BEGIN_WHILE = 4;
const CMD_END_WHILE = 5;
const CMD_BEGIN_INTERVAL = 6;
const CMD_END_INTERVAL = 7;
const CMD_BEGIN_IF = 8;
const CMD_ELSE = 9;
const CMD_END_IF = 10;
const CMD_WAIT_TIME = 11;
const CMD_ADD_COMPONENT = 12;
const CMD_WAIT_FOR_ALL_TO_FINISH = 14;
const CMD_WAIT_FOR_FIRST_TO_FINISH = 15;
const CMD_WAIT_UNTIL = 16;
const CMD_WAIT_FRAMES = 17;
const CMD_WAIT_FOR_MESSAGE = 18;
const CMD_WAIT_FOR_MESSAGE_CONDITION = 19;
const CMD_REMOVE_COMPONENT = 20;
const CMD_REMOVE_GAME_OBJECTS_BY_QUERY = 21;
const CMD_REMOVE_GAME_OBJECT = 22;
const CMD_SEND_MESSAGE = 24;

// a function that doesn't return anything
interface Action<T> {
	(item: T): void;
}

// a function that has a return type
interface Func<T, TResult> {
	(item: T): TResult;
}


/**
 * Simple stack
 */
class Stack {
	protected topNode: ExNode = null;
	protected size = 0;

	constructor() {
		this.topNode = null;
		this.size = 0;
	}

	/**
	 * Pushes a new node onto the stack
	 */
	push(node: ExNode) {
		this.topNode = node;
		this.size += 1;
	}

	/**
	 * Pops the current node from the stack
	 */
	pop(): ExNode {
		let temp = this.topNode;
		this.topNode = this.topNode.previous;
		this.size -= 1;
		return temp;
	}

	/**
	 * Returns the node on the top
	 */
	top(): ExNode {
		return this.topNode;
	}
}

/**
 * Node for ChainComponent, represents a command context
 */
export class ExNode {
	// key taken from CMD_XXX constants
	key = 0;
	// custom parameters
	param1: any = null;
	param2: any = null;
	// cached custom parameters
	param1A: any = null;
	param2A: any = null;
	cached: boolean = false;
	// link to previous and next node
	next: ExNode = null;
	previous: ExNode = null;

	constructor(key: number, param1: any = null, param2: any = null) {
		this.key = key;
		this.param1 = param1;
		this.param2 = param2;

		this.param1A = null;
		this.param2A = null;
	}

	/**
	 * Caches params or their results (if a corresponding parameter is a function) into param<num>A variables
	 */
	cacheParams() {
		if (!this.cached) {
			if (this.param1 != null) {
				this.param1A = typeof (this.param1) === 'function' ? this.param1() : this.param1;
			}

			if (this.param2 != null) {
				this.param2A = typeof (this.param2) === 'function' ? this.param2() : this.param2;
			}

			this.cached = true;
		}
	}

	/**
	 * Gets result of param 1
	 */
	getParam1() {
		if (!this.cached) {
			this.cacheParams();
		}
		return this.param1A;
	}

	setParam1(val: any) {
		this.param1A = val;
	}

	/**
	 * Gets result of param 2
	 */
	getParam2() {
		if (!this.cached) {
			this.cacheParams();
		}
		return this.param2A;
	}

	setParam2(val: any) {
		this.param2A = val;
	}

	resetCache() {
		this.param1A = this.param2A = null;
		this.cached = false;
	}
}

/**
 * Component that executes a chain of commands during the update loop
 */
export default class ChainComponent extends Component<void> {

	// stack of current scope
	protected scopeStack = new Stack();
	// current node
	protected current: ExNode = null;
	// linked list
	protected head: ExNode = null;
	protected tail: ExNode = null;
	// help parameters used for processing one node
	protected tmpParam: any = null;
	protected tmpParam2: any = null;

	protected interruptChecks: Func<void, boolean>[] = [];

	constructor(name: string = 'Chain') {
		super();
		this._name = name;
	}

	mergeAtBeginning(other: ChainComponent): ChainComponent {
		if (other.cmpState === ComponentState.RUNNING) {
			throw new Error('Can\'t merge running component!');
		}
		if (this.head) {
			other.tail.next = this.head;
			this.head = other.head;
		} else {
			this.head = other.head;
			this.tail = other.tail;
		}
		this.current = this.head;
		other.head = other.tail = null;
		return this;
	}

	mergeWith(other: ChainComponent): ChainComponent {
		if (other.cmpState === ComponentState.RUNNING) {
			throw new Error('Can\'t merge running component!');
		}
		if (this.tail) {
			this.tail.next = other.head;
			this.tail = other.tail;
		} else {
			this.tail = other.tail;
			this.head = other.head;
		}
		other.head = other.tail = null;
		return this;
	}

	/**
	 * Repeats the following part of the chain until endRepeat()
	 * @param num number of repetitions, 0 for infinite loop; or function that returns that number
	 */
	beginRepeat(param: number | Func<void, number>): ChainComponent {
		this.enqueue(CMD_BEGIN_REPEAT, param, param === 0);
		return this;
	}

	/**
	 * Enclosing element for beginRepeat() command
	 */
	endRepeat(): ChainComponent {
		this.enqueue(CMD_END_REPEAT);
		return this;
	}

	sendMessageDelayed(action: string, data: any = null): ChainComponent {
		this.enqueue(CMD_SEND_MESSAGE, action, data);
		return this;
	}

	/**
	 * Executes a closure
	 * @param {action} func function to execute
	 */
	call(func: Action<ChainComponent>): ChainComponent {
		this.enqueue(CMD_CALL, func);
		return this;
	}

	/**
	 * Attaches itself to a game objects and executes the pipeline
	 */
	executeUpon(obj: Container): ChainComponent {
		obj.addComponentAndRun(this);
		return this;
	}

	/**
	 * Repeats the following part of the chain up to the endWhile()
	 * till the func() keeps returning true
	 * @param func function that returns either true or false
	 */
	beginWhile(func: Func<void, boolean>): ChainComponent {
		this.enqueue(CMD_BEGIN_WHILE, func);
		return this;
	}

	/**
	 * Enclosing command for beginWhile()
	 */
	endWhile(): ChainComponent {
		this.enqueue(CMD_END_WHILE);
		return this;
	}

	/**
	 * Starts an infinite loop that will repeat every num second
	 * @param num number of seconds to wait or function that returns that number
	 */
	beginInterval(num: number | Func<void, number>): ChainComponent {
		this.enqueue(CMD_BEGIN_INTERVAL, num);
		return this;
	}

	/**
	 * Enclosing command for beginInterval()
	 */
	endInterval(): ChainComponent {
		this.enqueue(CMD_END_INTERVAL);
		return this;
	}

	/**
	 * Checks an IF condition returned by 'func' and jumps to the next element,
	 * behind the 'else' element or behind the 'endIf' element, if the condition is not met
	 * @param func function that returns either true or false
	 */
	beginIf(func: Func<void, boolean>): ChainComponent {
		this.enqueue(CMD_BEGIN_IF, func);
		return this;
	}

	/**
	 * Defines a set of commands that are to be executed if the condition of the current
	 * beginIf() command is not met
	 */
	else(): ChainComponent {
		this.enqueue(CMD_ELSE);
		return this;
	}

	/**
	 * Enclosing command for beginIf()
	 */
	endIf(): ChainComponent {
		this.enqueue(CMD_END_IF);
		return this;
	}

	/**
	 * Adds a new component to a given game object (or to an owner if not specified)
	 * @param component component or function that returns a component
	 * @param gameObj game object or function that returns a game object
	 */
	addComponent(component: Component<any> | Func<void, Component<any>>, gameObj: Container | Func<void, Container> = null): ChainComponent {
		this.enqueue(CMD_ADD_COMPONENT, component, gameObj);
		return this;
	}


	/**
	 * Waits given amount of seconds
	 * @param time number of seconds to wait; or function that returns this number
	 */
	waitTime(time: number | Func<void, number>): ChainComponent {
		this.enqueue(CMD_WAIT_TIME, time);
		return this;
	}

	/**
	 * Waits until given component has finished
	 * If provided component doesn't have an owner, it will be attached to the owner of this chain-component
	 * @param component or function that returns this component
	 */
	waitFor(component: Component<any> | Component<any>[] | Func<void, Component<any>> | Func<void, Component<any>[]>): ChainComponent {
		this.enqueue(CMD_WAIT_FOR_ALL_TO_FINISH, component);
		return this;
	}

	/**
	 * Waits until first component has finished. The others are interrupted
	 * @param components or a function that returns a set of components
	 */
	waitForFirst(components: Component<any>[] | Func<void, Component<any>[]>): ChainComponent {
		this.enqueue(CMD_WAIT_FOR_FIRST_TO_FINISH, components);
		return this;
	}

	/**
	 * Waits until given function keeps returning true
	 * @param func
	 */
	waitUntil(func: Func<void, boolean>): ChainComponent {
		this.enqueue(CMD_WAIT_UNTIL, func);
		return this;
	}

	/**
	 * Waits given number of iterations of update loop
	 * @param num number of frames
	 */
	waitFrames(num: number): ChainComponent {
		this.enqueue(CMD_WAIT_FRAMES, num);
		return this;
	}

	/**
	 * Waits until a message with given key isn't sent
	 * @param msg message key
	 */
	waitForMessage(msg: string): ChainComponent {
		this.enqueue(CMD_WAIT_FOR_MESSAGE, msg);
		return this;
	}

	/**
	 * Waits until a message with given key and a specific condition isn't sent
	 */
	waitForMessageConditional(msg: string, condition: QueryCondition) {
		this.enqueue(CMD_WAIT_FOR_MESSAGE_CONDITION, msg, condition);
		return this;
	}

	/**
	 * Removes component from given game object (or the owner if null)
	 * @param cmp name of the component or the component itself
	 * @param gameObj
	 */
	removeComponent(cmp: string, gameObj: Container = null): ChainComponent {
		this.enqueue(CMD_REMOVE_COMPONENT, cmp, gameObj);
		return this;
	}

	/**
	 * Removes game objects that meets given condition
	 */
	removeGameObjectsByQuery(query: QueryCondition): ChainComponent {
		this.enqueue(CMD_REMOVE_GAME_OBJECTS_BY_QUERY, query);
		return this;
	}

	/**
	 * Removes given game object
	 * @param obj
	 */
	removeGameObject(obj: Container): ChainComponent {
		this.enqueue(CMD_REMOVE_GAME_OBJECT, obj);
		return this;
	}

	/**
	 * Interrupts this component whenever a condition is true
	 * The condition is checked every loop
	 * @param obj
	 */
	interruptIf(func: Func<void, boolean>): ChainComponent {
		this.interruptChecks.push(func);
		return this;
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

		if (this.interruptChecks.length !== 0) {
			// always check for conditions for interrupt
			for (let check of this.interruptChecks) {
				if (check()) {
					this.finish();
					return;
				}
			}
		}

		if (this.current == null) {
			// take next item
			this.current = this.dequeue();
		}

		if (this.current == null) {
			// no more items -> finish
			this.finish();
			return;
		}

		switch (this.current.key) {
			case CMD_BEGIN_REPEAT:
				// push context and go to the next item
				this.current.cacheParams();
				this.scopeStack.push(this.current);
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_END_REPEAT:
				// pop context and jump
				let temp = this.scopeStack.pop();

				temp.setParam1(temp.getParam1() - 1); // decrement number of repetitions
				if (temp.getParam2() === true || // infinite loop check
					temp.getParam1() > 0) {
					// jump to the beginning
					this.current = temp;
					this.onUpdate(delta, absolute);
				} else {
					// reset values to their original state
					temp.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_CALL:
				// execute a function and go to the next item
				this.current.param1(this);
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_BEGIN_WHILE:
				// push context and go to the next item
				this.scopeStack.push(this.current);
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_END_WHILE:
				// pop contex and check condition
				let temp2 = this.scopeStack.pop();
				if (temp2.param1()) { // check condition inside while()
					// condition is true -> jump to the beginning
					this.current = temp2;
					this.onUpdate(delta, absolute);
				} else {
					// condition is false -> go to the next item
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_BEGIN_INTERVAL:
				if (!this.current.cached) {
					this.current.cacheParams();
				}
				if (this.tmpParam == null) {
					// save the time into a variable and wait to the next update cycle
					this.tmpParam = absolute;
				} else if ((absolute - this.tmpParam) >= this.current.getParam1()) {
					// push context and go to the next ite
					this.tmpParam = null;
					this.current.resetCache();
					this.scopeStack.push(this.current);
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_END_INTERVAL:
				// pop context and jump to the beginning
				this.current = this.scopeStack.pop();
				this.onUpdate(delta, absolute);
				break;
			case CMD_BEGIN_IF:
				if (this.current.param1()) {
					// condition met -> go to then ext item
					this.gotoNextImmediately(delta, absolute);
					break;
				}
				// condition not met -> we need to jump to the next ELSE or END-IF node
				let deepCounter = 1;
				while (true) {
					// search for the next node we might jump into
					this.current = this.dequeue();
					if (this.current.key === CMD_BEGIN_IF) {
						deepCounter++;
					}
					if (this.current.key === CMD_END_IF) {
						deepCounter--;
					}
					// we need to find the next ELSE of END of the current scope
					// thus, we have to skip all inner IF-ELSE branches
					if ((deepCounter === 1 && this.current.key === CMD_ELSE) ||
						deepCounter === 0 && this.current.key === CMD_END_IF) {
						this.gotoNext();
						break;
					}
				}
				this.onUpdate(delta, absolute);
				break;
			case CMD_ELSE:
				// jump to the first END_IF block of the current branch
				let deepCounter2 = 1;
				while (true) {
					this.current = this.dequeue();
					if (this.current.key === CMD_BEGIN_IF) {
						deepCounter2++;
					}
					if (this.current.key === CMD_END_IF) {
						deepCounter2--;
					}
					if (deepCounter2 === 0 && this.current.key === CMD_END_IF) {
						this.gotoNext();
						break;
					}
				}
				this.onUpdate(delta, absolute);
				break;
			case CMD_END_IF:
				// nothing to do here, just go to the next item
				this.gotoNextImmediately(delta, absolute);
				break;
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
			case CMD_ADD_COMPONENT:
				// pop the object and its component, do the zamazingo thingy and go to the next item
				let gameObj = (this.current.getParam2() != null ? this.current.getParam2() : this.owner) as Container;
				gameObj.addComponent(this.current.getParam1());
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_SEND_MESSAGE:
				this.sendMessage(this.current.getParam1(), this.current.getParam2());
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_WAIT_FOR_ALL_TO_FINISH:
				// wait until isFinished is true
				const checkInit = !this.current.cached;
				if (!this.current.cached) {
					this.current.cacheParams();
				}
				const cmp = this.current.getParam1();
				const isArray = Array.isArray(cmp);

				// attach component to this game object if they don't have an owner yet
				if (checkInit) {
					if (!isArray && (cmp as Component<any>).cmpState === ComponentState.NEW) {
						this.owner.addComponentAndRun(cmp);
					} else if (isArray) {
						(cmp as Component<any>[]).filter(cmp => cmp.cmpState === ComponentState.NEW).forEach(cmp => this.owner.addComponentAndRun(cmp));
					}
				}

				if ((!isArray && (cmp as Component<any>).isCompleted) || (isArray && (cmp as Component<any>[]).filter(c => c._cmpState === ComponentState.RUNNING).length === 0)) {
					this.current.resetCache();
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_WAIT_FOR_FIRST_TO_FINISH:
				// wait until isFinished is true for at least one case
				const checkInitFirst = !this.current.cached;
				if (!this.current.cached) {
					this.current.cacheParams();
				}
				const cmps = this.current.getParam1() as Component<any>[];
				if (checkInitFirst) {
					cmps.filter(cmp => cmp._cmpState === ComponentState.NEW).forEach(cmp => this.owner.addComponentAndRun(cmp));
				}
				if (cmps.filter(c => c.isCompleted).length !== 0) {
					this.current.resetCache();
					// finish the other ones
					cmps.forEach(cmp => cmp.finish());
					this.gotoNextImmediately(delta, absolute);
				}
				break;
			case CMD_WAIT_UNTIL:
				if (!this.current.param1()) {
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
			case CMD_REMOVE_COMPONENT:
				// pop the object, the name of the component, remove it and go to the next item
				let gameObj2 = (this.current.param2 != null ? this.current.param2 : this.owner) as Container;
				gameObj2.removeComponent(gameObj2.findComponentByName(this.current.param1));
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_REMOVE_GAME_OBJECTS_BY_QUERY:
				let objects = this.scene.findObjectsByQuery(this.current.param1);
				for (let obj of objects) {
					obj.destroy();
				}
				this.gotoNextImmediately(delta, absolute);
				break;
			case CMD_REMOVE_GAME_OBJECT:
				(this.current.param1 as Container).destroy();
				this.gotoNextImmediately(delta, absolute);
				break;
		}
	}

	protected enqueue(key: number, param1: any = null, param2: any = null) {
		let node = new ExNode(key, param1, param2);

		/*
		  // update 200411: I must have been mad back then to implement this behavior... ALWAYS ADD TO THE TAIL!
		  if (this.current != null && this.current !== this.head) {
			// already running -> append to the current node
			let temp = this.current.next;
			this.current.next = node;
			node.next = temp;
			node.previous = this.current;
			temp.previous = node;
		}*/

		if (this.head == null) {
			this.head = this.tail = node;
		} else {
			this.tail.next = node;
			node.previous = this.tail;
			this.tail = node;
		}

		if (this.current == null) {
			this.current = this.head;
		}
	}

	// dequeues a next node
	protected dequeue(): ExNode {
		if (this.current == null || this.current.next == null) {
			return null;
		} else {
			this.current = this.current.next;
		}
		return this.current;
	}

	// goes to the next node
	protected gotoNext() {
		this.current = this.current.next;
	}

	// goes to the next node and re-executes the update loop
	protected gotoNextImmediately(delta: number, absolute: number) {
		this.current = this.current.next;
		this.onUpdate(delta, absolute);
	}
}