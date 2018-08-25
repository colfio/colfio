import GameObject from '../engine/GameObject';
import Msg from '../engine/Msg';
import Component from '../engine/Component';

const CMD_BEGIN_REPEAT = 1;
const CMD_END_REPEAT = 2;
const CMD_EXECUTE = 3;
const CMD_BEGIN_WHILE = 4;
const CMD_END_WHILE = 5;
const CMD_BEGIN_INTERVAL = 6;
const CMD_END_INTERVAL = 7;
const CMD_BEGIN_IF = 8;
const CMD_ELSE = 9;
const CMD_END_IF = 10;
const CMD_WAIT_TIME = 11;
const CMD_ADD_COMPONENT = 12;
const CMD_ADD_COMPONENT_AND_WAIT = 13;
const CMD_WAIT_FOR_FINISH = 14;
const CMD_WAIT_UNTIL = 15;
const CMD_WAIT_FRAMES = 16;
const CMD_WAIT_FOR_MESSAGE = 17;
const CMD_REMOVE_COMPONENT = 18;
const CMD_REMOVE_GAME_OBJECT_BY_TAG = 19;
const CMD_REMOVE_GAME_OBJECT = 20;
const CMD_REMOVE_PREVIOUS = 21;

/**
 * Simple stack
 */
class Stack {
    topNode: ExNode = null;
    size = 0;

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
    pop() : ExNode {
        let temp = this.topNode;
        this.topNode = this.topNode.previous;
        this.size -= 1;
        return temp;
    }

    /**
     * Returns the node on the top
     */
    top() : ExNode {
        return this.topNode;
    }
}

class ExNode {
    key = 0;
    param1: any = null;
    param2: any = null;
    param3: any = null;
    param1A: any = null;
    param2A: any = null;
    param3A: any = null;
    cached: boolean = false;
    next: ExNode = null;
    previous: ExNode = null;

    constructor(key: number, param1 : any = null, param2 : any = null, param3 : any = null) {
        this.key = key;
        this.param1 = param1;
        this.param2 = param2;
        this.param3 = param3;

        this.param1A = null;
        this.param2A = null;
        this.param3A = null;
    }

    cacheParams() {
        if (!this.cached) {
            if (this.param1 != null) {
                this.param1A = typeof (this.param1) == "function" ? this.param1() : this.param1;
            }

            if (this.param2 != null) {
                this.param2A = typeof (this.param2) == "function" ? this.param2() : this.param2;
            }

            if (this.param3 != null) {
                this.param3A = typeof (this.param3) == "function" ? this.param3() : this.param3;
            }

            this.cached = true;
        }
    }

    getParam1() {
        if (!this.cached) {
            this.cacheParams();
        }
        return this.param1A;
    }

    setParam1(val) {
        this.param1A = val;
    }

    getParam2() {
        if (!this.cached) {
            this.cacheParams();
        }
        return this.param2A;
    }

    setParam2(val) {
        this.param2A = val;
    }

    getParam3() {
        if (!this.cached) {
            this.cacheParams();
        }
        return this.param3A;
    }

    setParam3(val) {
        this.param3A = val;
    }

    resetCache() {
        this.param1A = this.param2A = this.param3A = null;
        this.cached = false;
    }
}

/**
 * Component that executes a chain of commands during the update loop
 */
export default class ExecutorComponent extends Component {
    scopeStack = new Stack();
    current: ExNode = null;
    // linked list
    head: ExNode = null;
    tail: ExNode = null;
    // custom parameters
    helpParam: any = null;
    helpParam2: any = null;

    /**
     * Repeats the following part of the chain until endRepeat()
     * @param {number|function} num number of repetitions, 0 for infinite loop; or function that returns that number
     */
    beginRepeat(param: number | Func<void, number>) : ExecutorComponent {
        if(typeof(param) !== `number` && typeof(param) !== `function`){
            throw Error("Invalid type. Expected number or function");
        }
        this._enqueue(CMD_BEGIN_REPEAT, param, param == 0);
        return this;
    }

    /**
     * Enclosing element for beginRepeat() command
     */
    endRepeat() : ExecutorComponent {
        this._enqueue(CMD_END_REPEAT);
        return this;
    }

    /**
     * Executes a closure
     * @param {action} func function to execute 
     */
    execute(func: Action<Component>) : ExecutorComponent {
        if(typeof(func) !== `function`){
            throw Error("Invalid type. Expected function");
        }
        this._enqueue(CMD_EXECUTE, func);
        return this;
    }

    /**
     * Repeats the following part of the chain up to the endWhile() 
     * till the func() keeps returning true 
     * @param {function} func function that returns either true or false
     */
    beginWhile(func: Func<void, boolean>) : ExecutorComponent {
        if(typeof(func) !== `function`){
            throw Error("Invalid type. Expected function");
        }
        this._enqueue(CMD_BEGIN_WHILE, func);
        return this;
    }

    /**
     * Enclosing command for beginWhile()
     */
    endWhile() : ExecutorComponent {
        this._enqueue(CMD_END_WHILE);
        return this;
    }

    /**
     * Starts an infinite loop that will repeat every num second  
     * @param {number|function} num number of seconds to wait or function that returns that number
     */
    beginInterval(num : number | Func<void, number>) : ExecutorComponent {
        if(typeof(num) !== `number` && typeof(num) !== `function`){
            throw Error("Invalid type. Expected number or function");
        }
        this._enqueue(CMD_BEGIN_INTERVAL, num);
        return this;
    }

    /**
     * Enclosing command for beginInterval()
     */
    endInterval() : ExecutorComponent {
        this._enqueue(CMD_END_INTERVAL);
        return this;
    }

    /**
     * Checks an IF condition returned by 'func' and jumps to the next element,
     * behind the 'else' element or behind the 'endIf' element, if the condition is not met
     * @param {function} func function that returns either true or false 
     */
    beginIf(func : Func<void, boolean>) : ExecutorComponent {
        if(typeof(func) !== `function`){
            throw Error("Invalid type. Expected function");
        }
        this._enqueue(CMD_BEGIN_IF, func);
        return this;
    }

    /**
     * Defines a set of commands that are to be executed if the condition of the current
     * beginIf() command is not met
     */
    else() : ExecutorComponent {
        this._enqueue(CMD_ELSE);
        return this;
    }

    /**
     * Enclosing command for beginIf()
     */
    endIf() : ExecutorComponent {
        this._enqueue(CMD_END_IF);
        return this;
    }

    /**
     * Adds a new component to a given game object (or to an owner if not specified)
     * @param {Component|function} component component or function that returns a component
     * @param {GameObject|function} gameObj game object or function that returns a game object 
     */
    addComponent(component : Component | Func<void, Component>, gameObj : GameObject | Func<void, GameObject> = null) : ExecutorComponent {
        if(typeof(component) == `object` && (!(component instanceof Component)) ||
        (gameObj != null && typeof(gameObj) == `object` && !(gameObj instanceof GameObject))){
            throw Error("Wrong type. Expected Component and GameObject");
        }
        this._enqueue(CMD_ADD_COMPONENT, component, gameObj);
        return this;
    }

    /**
     * Adds a new component to a given game object (or to an owner if not specified) 
     * and waits until its finished
     * @param {Component|function} component component or function that returns a component 
     * @param {GameObject|function} gameObj game object or function that returns a game object 
     */
    addComponentAndWait(component : Component | Func<void, Component>, gameObj : GameObject | Func<void, GameObject> = null) : ExecutorComponent {
        if(typeof(component) == `object` && (!(component instanceof Component)) ||
        (gameObj != null && typeof(gameObj) == `object` && !(gameObj instanceof GameObject))){
            throw Error("Wrong type. Expected Component and GameObject");
        }
        this._enqueue(CMD_ADD_COMPONENT_AND_WAIT, component, gameObj);
        return this;
    }

    /**
     * Waits given amount of seconds
     * @param {time|function} time number of seconds to wait; or function that returns this number 
     */
    waitTime(time : number | Func<void, number>) : ExecutorComponent {
        if(typeof(time) !== `number` && typeof(time) !== `function`){
            throw Error("Invalid type. Expected number or function");
        }
        this._enqueue(CMD_WAIT_TIME, time);
        return this;
    }

    /**
     * Waits until given component isn't finished
     * @param {Component|function} component or function that returns this component 
     */
    waitForFinish(component : Component | Func<void, Component>) : ExecutorComponent {
        if(typeof(component) == `object` && (!(component instanceof Component))){
            throw Error("Wrong type. Expected Component");
        }
        this._enqueue(CMD_WAIT_FOR_FINISH, component);
        return this;
    }

    /**
     * Waits until given function keeps returning true
     * @param {Function} func 
     */
    waitUntil(func : Func<void, boolean>) : ExecutorComponent {
        if(typeof(func) !== `function`){
            throw Error("Invalid type. Expected function");
        }
        this._enqueue(CMD_WAIT_UNTIL, func);
        return this;
    }

    /**
     * Waits given number of iterations of update loop
     * @param {number} num number of frames 
     */
    waitFrames(num: number) : ExecutorComponent {
        if(typeof(num) !== `number`){
            throw Error("Invalid type. Expected number");
        }
        this._enqueue(CMD_WAIT_FRAMES, num);
        return this;
    }

    /**
     * Waits until a message with given key isn't sent
     * @param {String} msg message key 
     */
    waitForMessage(msg : string) : ExecutorComponent {
        if(typeof(msg) !== `string`){
            throw Error("Invalid type. Expected string");
        }
        this._enqueue(CMD_WAIT_FOR_MESSAGE, msg);
        return this;
    }

    /**
     * Removes component from given game object (or the owner if null)
     * @param {String} cmp name of the component or the component itself
     * @param {GameObject} gameObj 
     */
    removeComponent(cmp : string, gameObj : GameObject = null) : ExecutorComponent {
        if((gameObj != null && typeof(gameObj) == `object` && !(gameObj instanceof GameObject))){
            throw Error("Wrong type. Expected GameObject");
        }
        this._enqueue(CMD_REMOVE_COMPONENT, cmp, gameObj);
        return this;
    }

    /**
     * Removes a game object with given tag
     * @param {String} tag 
     */
    removeGameObjectByTag(tag: string) : ExecutorComponent {
        if(typeof(tag) !== `string`){
            throw Error("Invalid type. Expected string");
        }
        this._enqueue(CMD_REMOVE_GAME_OBJECT_BY_TAG, tag);
        return this;
    }

    /**
     * Removes given game object
     * @param {GameObject} obj 
     */
    removeGameObject(obj: GameObject) : ExecutorComponent {
        if(typeof(obj) == `object` && (!(obj instanceof GameObject))){
            throw Error("Wrong type. Expected GameObject");
        }
        this._enqueue(CMD_REMOVE_GAME_OBJECT, obj);
        return this;
    }

    /**
     * Removes previous node from the chain
     */
    removePrevious() : ExecutorComponent {
        this._enqueue(CMD_REMOVE_PREVIOUS);
        return this;
    }

    onmessage(msg : Msg) {
        this.helpParam2 = msg.action;
    }

    update(delta: number, absolute: number) {
        if (this.current == null) {
            this.current = this._dequeue();
        }

        if (this.current == null) {
            this.finish();
            return;
        }

        switch (this.current.key) {
            case CMD_BEGIN_REPEAT:
                this.current.cacheParams();
                this.scopeStack.push(this.current);
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_END_REPEAT:
                let temp = this.scopeStack.pop();

                temp.setParam1(temp.getParam1() - 1);
                if (temp.getParam2() == true || // infinite loop
                    temp.getParam1() > 0) {
                    // jump to the beginning
                    this.current = temp;
                    this.update(delta, absolute);
                } else {
                    // reset values to their original state
                    temp.resetCache();
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_EXECUTE:
                this.current.param1(this);
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_BEGIN_WHILE:
                this.scopeStack.push(this.current);
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_END_WHILE:
                let temp2 = this.scopeStack.pop();
                if (temp2.param1()) {
                    this.current = temp2;
                    this.update(delta, absolute);
                } else {
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_BEGIN_INTERVAL:
                if (!this.current.cached) {
                    this.current.cacheParams();
                }
                if (this.helpParam == null) {
                    // save the beginning to a help variable and wait
                    this.helpParam = absolute;
                } else if ((absolute - this.helpParam) >= this.current.getParam1()) {
                    this.helpParam = null;
                    this.current.resetCache();
                    this.scopeStack.push(this.current);
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_END_INTERVAL:
                this.current = this.scopeStack.pop();
                this.update(delta, absolute);
                break;
            case CMD_BEGIN_IF:
                if (this.current.param1()) {
                    // condition fulfilled 
                    this._gotoNextImmediately(delta, absolute);
                    break;
                }

                // condition not fullfiled -> we need to jump to the next ELSE or END-IF node
                let deepCounter = 1;
                while (true) {
                    this.current = this._dequeue();
                    if (this.current.key == CMD_BEGIN_IF) {
                        deepCounter++;
                    }
                    if (this.current.key == CMD_END_IF) {
                        deepCounter--;
                    }
                    // we need to find the next ELSE of END of the current scope
                    // thus, we have to skip all inner IF-ELSE branches
                    if ((deepCounter == 1 && this.current.key == CMD_ELSE) ||
                        deepCounter == 0 && this.current.key == CMD_END_IF) {
                        this._gotoNext();
                        break;
                    }
                }
                this.update(delta, absolute);
                break;
            case CMD_ELSE:
                // jump to the first END_IF block of the current branch
                let deepCounter2 = 1;
                while (true) {
                    this.current = this._dequeue();
                    if (this.current.key == CMD_BEGIN_IF) {
                        deepCounter2++;
                    }
                    if (this.current.key == CMD_END_IF) {
                        deepCounter2--;
                    }
                    if (deepCounter2 == 0 && this.current.key == CMD_END_IF) {
                        this._gotoNext();
                        break;
                    }
                }
                this.update(delta, absolute);
                break;
            case CMD_END_IF:
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_WAIT_TIME:
                this.current.cacheParams();

                if (this.helpParam == null) {
                    this.helpParam = absolute;
                }

                if ((absolute - this.helpParam) > this.current.getParam1()) {
                    this.helpParam = null;
                    this.current.resetCache();
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_ADD_COMPONENT:
                let gameObj = this.current.getParam2() != null ? this.current.getParam2() : this.owner;
                gameObj.addComponent(this.current.getParam1());
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_ADD_COMPONENT_AND_WAIT:
                if (!this.current.cached) {
                    // add only once
                    this.current.cacheParams();
                    let gameObj = this.current.getParam2() != null ? this.current.getParam2() : this.owner;
                    gameObj.addComponent(this.current.getParam1());
                }
                // wait for finish
                if (this.current.getParam1().isFinished) {
                    this.helpParam = null;
                    this.current.resetCache();
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_WAIT_FOR_FINISH:

                if (!this.current.cached) {
                    this.current.cacheParams();
                }
                if (this.current.getParam1().isFinished) {
                    this.current.resetCache();
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_WAIT_UNTIL:
                if (!this.current.param1()) {
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_WAIT_FRAMES:
                if (this.helpParam == null) {
                    this.helpParam = 0;
                }

                if (++this.helpParam > this.current.param1) {
                    this.helpParam = null;
                    this._gotoNextImmediately(delta, absolute);
                }
                break;
            case CMD_WAIT_FOR_MESSAGE:
                // helpParam indicates that this component has already subscribed the message
                if (this.helpParam == true) {
                    if (this.helpParam2 == this.current.param1) {
                        // got message -> unsubscribe and proceed
                        this.unsubscribe(this.current.param1);
                        this.helpParam = this.helpParam2 = null;
                        this._gotoNextImmediately(delta, absolute);
                    }
                } else {
                    // just subscribe and wait
                    this.helpParam = true;
                    this.helpParam2 = null;
                    this.subscribe(this.current.param1);
                }
                break;
            case CMD_REMOVE_COMPONENT:
                let gameObj2 = this.current.param2 != null ? this.current.param2 : this.owner;
                gameObj2.removeComponentByName(this.current.param1);
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_REMOVE_GAME_OBJECT_BY_TAG:
                let obj = this.scene.findFirstObjectByTag(this.current.param1);
                if (obj != null) {
                    obj.remove();
                }
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_REMOVE_GAME_OBJECT:
                this.current.param1.remove();
                this._gotoNextImmediately(delta, absolute);
                break;
            case CMD_REMOVE_PREVIOUS:
                if (this.current.previous != null) {
                    if (this.current.previous.previous != null) {
                        this.current.previous.previous.next = this.current;
                    }
                    this.current.previous = this.current.previous.previous;
                }
                this._gotoNextImmediately(delta, absolute);
                break;
        }
    }

    _enqueue(key: number, param1:any = null, param2:any = null) {
        var node = new ExNode(key, param1, param2);

        if (this.current != null && this.current != this.head) {
            // already running -> append to the current node
            let temp = this.current.next;
            this.current.next = node;
            node.next = temp;
            node.previous = this.current;
            temp.previous = node;
        } else {
            // not yet running -> append to the tail
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
    }

    /**
     * Dequeues a new node
     *  @returns {ExNode} 
     */
    _dequeue() : ExNode {
        if (this.current == null || this.current.next == null) {
            return null;
        } else {
            this.current = this.current.next;
        }
        return this.current;
    }

    _gotoNext() {
        this.current = this.current.next;
    }

    _gotoNextImmediately(delta: number, absolute: number) {
        this.current = this.current.next;
        this.update(delta, absolute);
    }
}