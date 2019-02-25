import GameObjectProxy from './game-object-proxy';
import Message from './message';
import Component from './component';
import * as PIXI from 'pixi.js';
import { Messages } from './constants';
import { PIXICmp } from './pixi-object';
import { LookupMap } from '../utils/lookup-map';
import DebugComponent from '../components/debug-component';


/**
 * Class for action that is to be executed with certain delay
 */
class Invocation {
  delay = 0; // time of invocation
  time = 0; // time of creation
  action: () => void = null; // action to execute
}

/**
 * Scene features
 * Note that every optimization consumes some memory as the data needs to be stored in maps and sets
 */
export interface SceneConfig {
  // enables searching by object flags
  flagsSearchEnabled?: boolean;
  // enables searching by object states
  statesSearchEnabled?: boolean;
  // enables searching by object tags
  tagsSearchEnabled?: boolean;
  // enables searching by object names
  namesSearchEnabled?: boolean;
  debugEnabled?: boolean;
}

/**
 * Scene that keeps collection of all game objects and component listeners
 */
export default class Scene {
  app: PIXI.Application;

  // PIXI stage object
  stage: PIXICmp.GameObject = null;
  // collection of actions that should be invoked with a delay
  private pendingInvocations: Invocation[];
  // message action keys and all subscribers that listens to all these actions
  private subscribers: LookupMap<string, Component>;
  // game objects mapped by their flags
  private gameObjectFlags: LookupMap<number, PIXICmp.GameObject>;
  // game objects mapped by their state
  private gameObjectStates: LookupMap<number, PIXICmp.GameObject>;
  // game objects mapped by their tags
  private gameObjectTags: LookupMap<string, PIXICmp.GameObject>;
  // game objects mapped by their names
  private gameObjectNames: LookupMap<string, PIXICmp.GameObject>;
  // collection of ALL game objects, mapped by their ids
  private gameObjects: Map<number, GameObjectProxy>;

  protected _currentDelta: number;
  protected _currentAbsolute: number;

  protected config: SceneConfig;

  constructor(app: PIXI.Application, config?: SceneConfig) {
    this.config = {
      flagsSearchEnabled: config && config.flagsSearchEnabled,
      namesSearchEnabled: config && config.namesSearchEnabled !== undefined ? config.namesSearchEnabled : true,
      tagsSearchEnabled: config && config.tagsSearchEnabled !== undefined ? config.tagsSearchEnabled : true,
      statesSearchEnabled: config && config.statesSearchEnabled,
      debugEnabled: config && config.debugEnabled
    };


    this.app = app;
    this.clearScene();
  }

  public get currentDelta() {
    return this._currentDelta;
  }

  public get currentAbsolute() {
    return this._currentAbsolute;
  }

  /**
   * Adds a new function that will be invoked after a given amount of time
   * @param delay delay in miliseconds
   * @param aaction function pointer with no arguments
   */
  invokeWithDelay(delay: number, action: () => void) {
    this.pendingInvocations.push({
      delay: delay,
      time: 0,
      action: action
    });
  }

  /**
   * Adds a component to the stage object
   */
  addGlobalComponent(cmp: Component, runInstantly: boolean = false) {
    this.stage.addComponent(cmp, runInstantly);
  }

  /**
   * Tries to find a global component by its class
   */
  findGlobalComponentByName(className: string): Component {
    return this.stage.findComponentByName(className);
  }

  /**
   * Removes a component from a stage object
   */
  removeGlobalComponent(cmp: Component) {
    this.stage.removeComponent(cmp);
  }

  /**
   * Inserts a global attribute
   */
  addGlobalAttribute(key: string, val: any) {
    this.stage.addAttribute(key, val);
  }

  /**
   * Gets a global attribute by its id
   */
  getGlobalAttribute<T>(key: string): T {
    return this.stage.getAttribute<T>(key);
  }

  /**
   * Removes a global attribute by its key
   */
  removeGlobalAttribute(key: string): boolean {
    return this.stage.removeAttribute(key);
  }

  /**
   * Finds all game objects by their name
   */
  findObjectsByName(name: string): Array<PIXICmp.GameObject> {
    if(!this.config.namesSearchEnabled) {
      throw new Error('Searching by name is not enabled. See SceneConfig');
    }
    return this.gameObjectNames.findAll(name);
  }

  /**
   * Finds a first object with a given name
   */
  findObjectByName(name: string): PIXICmp.GameObject {
    if(!this.config.namesSearchEnabled) {
      throw new Error('Searching by name is not enabled. See SceneConfig');
    }
    return this.gameObjectNames.findFirst(name);
  }

  /**
   * Finds all game objects by their tag
   */
  findObjectsByTag(tag: string): Array<PIXICmp.GameObject> {
    if(!this.config.tagsSearchEnabled) {
      throw new Error('Searching by tag is not enabled. See SceneConfig');
    }
    return this.gameObjectTags.findAll(tag);
  }

  /**
   * Finds a first object with a given tag
   */
  findObjectByTag(tag: string): PIXICmp.GameObject {
    if(!this.config.tagsSearchEnabled) {
      throw new Error('Searching by tag is not enabled. See SceneConfig');
    }
    return this.gameObjectTags.findFirst(tag);
  }

  /**
   * Finds all game objects by their flag
   */
  findObjectsByFlag(flag: number): Array<PIXICmp.GameObject> {
    if(!this.config.flagsSearchEnabled) {
      throw new Error('Searching by flags is not enabled. See SceneConfig');
    }
    return this.gameObjectFlags.findAll(flag);
  }

  /**
   * Finds a first object with a given flag
   */
  findObjectByFlag(flag: number): PIXICmp.GameObject {
    if(!this.config.flagsSearchEnabled) {
      throw new Error('Searching by flags is not enabled. See SceneConfig');
    }
    return this.gameObjectFlags.findFirst(flag);
  }

  /**
   * Finds all game objects by their state
   */
  findObjectsByState(state: number): Array<PIXICmp.GameObject> {
    if(!this.config.statesSearchEnabled) {
      throw new Error('Searching by states is not enabled. See SceneConfig');
    }
    return this.gameObjectStates.findAll(state);
  }

  /**
   * Finds a first object with a given state
   */
  findObjectByState(state: number): PIXICmp.GameObject {
    if(!this.config.statesSearchEnabled) {
      throw new Error('Searching by states is not enabled. See SceneConfig');
    }
    return this.gameObjectStates.findFirst(state);
  }


  /**
   * Sends message to all subscribers
   */
  sendMessage(msg: Message) {
    this.subscribers.findAll(msg.action).forEach(ent => {
      if(!msg.expired) {
        ent.onMessage(msg);
      }
    });

    // check global subscribers (expiration doesn't take place)
    this.subscribers.findAll(Messages.ANY).forEach(ent => ent.onMessage(msg));
  }

  /**
   * Removes all objects from scene
   */
  clearScene() {
    if (this.gameObjects != null) {
      // call the finalization function of all components
      for (let [, gameObj] of this.gameObjects) {
        for (let [, component] of gameObj.rawComponents) {
          component.onFinish();
          component.onRemove();
        }
      }
    }

    // reinitialize everything
    this.subscribers = new LookupMap();
    if(this.config.namesSearchEnabled) {
      this.gameObjectNames = new LookupMap();
    }
    if(this.config.statesSearchEnabled) {
      this.gameObjectStates = new LookupMap();
    }
    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags = new LookupMap();
    }
    if(this.config.flagsSearchEnabled) {
      this.gameObjectFlags = new LookupMap();
    }

    this.gameObjects = new Map<number, GameObjectProxy>();
    this.pendingInvocations = [];
    this._currentDelta = this._currentAbsolute = 0;

    let newStage = new PIXICmp.Container();
    this.app.stage = newStage; // reassign the default stage with our custom one (we need objects from PIXICmp namespace only)
    newStage._proxy.scene = this; // assign a scene
    this.stage = newStage;
    this._addGameObject(newStage._proxy);

    if(this.config.debugEnabled) {
      this.addGlobalComponent(new DebugComponent(), true);
    }
  }

  // ======================================================================================
  // methods that are supposed to be private but PIXICmp objects can invoke them internally
  // ======================================================================================

  // executes the update cycle
  _update(delta: number, absolute: number) {
    this._currentDelta = delta;
    this._currentAbsolute = absolute;

    // execute pending invocations
    let i = this.pendingInvocations.length;
    while (i--) {
      let invocation = this.pendingInvocations[i];
      invocation.time += delta;

      if (invocation.time >= invocation.delay) {
        // call the function and remove it from the collection
        this.pendingInvocations.splice(i, 1);
        invocation.action();
      }
    }

    // update root object and all other objects recursively
    this.stage._proxy.update(delta, absolute);
  }


  // subscribes given component for messaging system
  _subscribeComponent(msgKey: string, component: Component) {
    this.subscribers.insert(msgKey, component);
  }

  // unsubscribes given component
  _unsubscribeComponent(msgKey: string, component: Component) {
    this.subscribers.remove(msgKey, component);
  }

  _addGameObject(obj: GameObjectProxy) {
    let pixiObj = obj.cmpObj;
    // fill all collections
    if(this.config.namesSearchEnabled) {
      this.gameObjectNames.insert(pixiObj.name, pixiObj);
    }

    this.gameObjects.set(obj.id, obj);

    // assign scene to all components (must be done for the case when components were added beforehand
    for (let [, component] of obj.rawComponents) {
      component.scene = this;
    }

    // assign scene
    obj.scene = this;
    // notify listeners
    this.sendMessage(new Message(Messages.OBJECT_ADDED, null, pixiObj));
  }

  // immediately removes given game object
  _removeGameObject(obj: GameObjectProxy) {
    obj.removeAllComponents();
    let gameObj = obj.cmpObj;

    if(this.config.namesSearchEnabled) {
      this.gameObjectNames.remove(gameObj.name, gameObj);
    }

    if(this.config.flagsSearchEnabled) {
      this.gameObjectFlags.removeItem(gameObj);
    }

    if(this.config.statesSearchEnabled) {
      this.gameObjectStates.removeItem(gameObj);
    }

    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags.removeItem(gameObj);
    }

    this.gameObjects.delete(obj.id);

    // notify listeners
    this.sendMessage(new Message(Messages.OBJECT_REMOVED, null, gameObj));
  }

  _onComponentAdded(component: Component, obj: GameObjectProxy) {
    component.owner = obj.cmpObj;
    component.scene = this;
    component.onInit();
    this.sendMessage(new Message(Messages.COMPONENT_ADDED, component, obj.cmpObj));
  }

  _onComponentRemoved(component: Component, obj: GameObjectProxy) {
    this.subscribers.removeItem(component);
    this.sendMessage(new Message(Messages.COMPONENT_REMOVED, component, obj.cmpObj));
  }

  _onStateChanged(previous: number, current: number, obj: GameObjectProxy) {
    if(this.config.statesSearchEnabled) {
      this.gameObjectStates.remove(previous, obj.cmpObj);
      this.gameObjectStates.insert(current, obj.cmpObj);
    }
    this.sendMessage(new Message(Messages.STATE_CHANGED, null, obj.cmpObj, [previous, current]));
  }

  _onFlagChanged(flag: number, set: boolean, obj: GameObjectProxy) {
    if(this.config.flagsSearchEnabled) {
      if(set) {
        this.gameObjectFlags.insert(flag, obj.cmpObj);
      } else {
        this.gameObjectFlags.remove(flag, obj.cmpObj);
      }
    }
  }

  _onTagAdded(tag: string, obj: GameObjectProxy) {
    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags.insert(tag, obj.cmpObj);
    }
  }

  _onTagRemoved(tag: string, obj: GameObjectProxy) {
    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags.remove(tag, obj.cmpObj);
    }
  }
}