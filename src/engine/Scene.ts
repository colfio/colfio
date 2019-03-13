import GameObjectProxy from './game-object-proxy';
import Message from './message';
import Component from './component';
import * as PIXI from 'pixi.js';
import { Messages, AttributeChangeMessage, StateChangeMessage, FlagChangeMessage, TagChangeMessage } from './constants';
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
  // enables notifying concerning attributes
  notifyAttributeChanges?: boolean;
  // enables notifying concerning states
  notifyStateChanges?: boolean;
  // enables notifying concerning flags
  notifyFlagChanges?: boolean;
  // enables notifying concerning tags
  notifyTagChanges?: boolean;
  // injects a debugging component and debugging HTML element
  debugEnabled?: boolean;
}

/**
 * Scene that keeps collection of all game objects and component listeners
 */
export default class Scene {
  app: PIXI.Application;
  name: string;
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
  private gameObjects: Map<number, PIXICmp.GameObject>;
  // COMPONENT_ADDED event will not be fired if a new object is being added to the scene
  private componentNotifyDisabled = false;
  protected _currentDelta: number;
  protected _currentAbsolute: number;

  protected config: SceneConfig;
  // indicator that will be reset upon first update
  protected sceneCleared: boolean;

  constructor(name: string, app: PIXI.Application, config?: SceneConfig) {
    this.name = name;

    this.initConfig(config);
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
    this.stage.assignAttribute(key, val);
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
   * Gets object by its id
   */
  getObjectById(id: number): PIXICmp.GameObject {
    if(this.gameObjects.has(id)) {
      return this.gameObjects.get(id);
    }
    return null;
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
  clearScene(newConfig?: SceneConfig) {
    if (this.gameObjects != null) {
      this.sendMessage(new Message(Messages.SCENE_CLEAR, null, null, this.name));
      // call the finalization function of all components
      for (let [, gameObj] of this.gameObjects) {
        for (let [, component] of gameObj._proxy.rawComponents) {
          component.onFinish();
          component.onRemove();
        }
      }
    }

    if(newConfig) {
      this.initConfig(newConfig);
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

    this.sceneCleared = true;
    this.gameObjects = new Map();
    this.pendingInvocations = [];
    this._currentDelta = this._currentAbsolute = 0;

    let newStage = new PIXICmp.Container('stage');
    this.app.stage = newStage; // reassign the default stage with our custom one (we need objects from PIXICmp namespace only)
    newStage._proxy.scene = this; // assign a scene
    this.stage = newStage;

    if(this.config.debugEnabled) {
      this.addGlobalComponent(new DebugComponent(), true);
    }

    this._addGameObject(newStage._proxy);
  }

  // ===============================================================================
  // methods that are supposed to be invoked only from within this library
  // ===============================================================================

  // executes the update cycle
  _update(delta: number, absolute: number) {
    if(this.sceneCleared) {
      this.sceneCleared = false;
    }

    this._currentDelta = delta;
    this._currentAbsolute = absolute;

    // update root object and all other objects recursively
    this.stage._proxy.update(delta, absolute);

    // execute pending invocations
    let i = this.pendingInvocations.length;
    while (i--) {
      let invocation = this.pendingInvocations[i];
      invocation.time += delta;

      if (invocation.time >= invocation.delay) {
        // call the function and remove it from the collection
        this.pendingInvocations.splice(i, 1);
        invocation.action();

        // check if the scene hasn't been cleared in the meantime
        if(this.sceneCleared) {
          break;
        }
      }
    }
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

    if(this.config.flagsSearchEnabled) {
      obj.getAllFlags().forEach(flag => this.gameObjectFlags.insert(flag, pixiObj));
    }

    if(this.config.tagsSearchEnabled) {
      obj.tags.forEach(tg => this.gameObjectTags.insert(tg, pixiObj));
    }

    if(this.config.statesSearchEnabled) {
      this.gameObjectStates.insert(pixiObj.stateId, pixiObj);
    }

    this.gameObjects.set(obj.id, obj.cmpObj);

    // assign scene
    obj.scene = this;
    this.componentNotifyDisabled = true;
    obj.initAllComponents();
    this.componentNotifyDisabled = false;

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
    if(!this.componentNotifyDisabled) {
      this.sendMessage(new Message(Messages.COMPONENT_ADDED, component, obj.cmpObj));
    }
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
    if(this.config.notifyStateChanges) {
      let data: StateChangeMessage = { previous, current };
      this.sendMessage(new Message(Messages.STATE_CHANGED, null, obj.cmpObj, data));
    }
  }

  _onAttributeAdded(key: string, value: any, obj: GameObjectProxy) {
    if(this.config.notifyAttributeChanges) {
      let data: AttributeChangeMessage = {
        key: key,
        type: Messages.ATTRIBUTE_ADDED,
        previousValue: null,
        currentValue: value
      };
      this.sendMessage(new Message(Messages.ATTRIBUTE_ADDED, null, obj.cmpObj, data));
    }
  }

  _onAttributeChanged(key: string, previousValue: any, currentValue: any, obj: GameObjectProxy) {
    if(this.config.notifyAttributeChanges) {
      let data: AttributeChangeMessage = {
        key: key,
        type: Messages.ATTRIBUTE_CHANGED,
        previousValue: previousValue,
        currentValue: currentValue
      };
      this.sendMessage(new Message(Messages.ATTRIBUTE_CHANGED, null, obj.cmpObj, data));
    }
  }

  _onAttributeRemoved(key: string, value: any, obj: GameObjectProxy) {
    if(this.config.notifyAttributeChanges) {
      let data: AttributeChangeMessage = {
        key: key,
        type: Messages.ATTRIBUTE_REMOVED,
        previousValue: value,
        currentValue: null
      };
      this.sendMessage(new Message(Messages.ATTRIBUTE_REMOVED, null, obj.cmpObj, data));
    }
  }

  _onFlagChanged(flag: number, set: boolean, obj: GameObjectProxy) {
    if(this.config.flagsSearchEnabled) {
      if(set) {
        this.gameObjectFlags.insert(flag, obj.cmpObj);
      } else {
        this.gameObjectFlags.remove(flag, obj.cmpObj);
      }
    }
    if(this.config.notifyFlagChanges) {
      let data: FlagChangeMessage = { flag, isSet: set };
      this.sendMessage(new Message(Messages.FLAG_CHANGED, null, obj.cmpObj, data));
    }
  }

  _onTagAdded(tag: string, obj: GameObjectProxy) {
    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags.insert(tag, obj.cmpObj);
    }
    if(this.config.notifyTagChanges) {
      let data: TagChangeMessage = { tag, type: Messages.TAG_ADDED };
      this.sendMessage(new Message(Messages.TAG_ADDED, null, obj.cmpObj, data));
    }
  }

  _onTagRemoved(tag: string, obj: GameObjectProxy) {
    if(this.config.tagsSearchEnabled) {
      this.gameObjectTags.remove(tag, obj.cmpObj);
    }
    if(this.config.notifyTagChanges) {
      let data: TagChangeMessage = { tag, type: Messages.TAG_REMOVED };
      this.sendMessage(new Message(Messages.TAG_REMOVED, null, obj.cmpObj, data));
    }
  }

  private initConfig(config?: SceneConfig) {
    this.config = {
      flagsSearchEnabled: config && config.flagsSearchEnabled,
      namesSearchEnabled: config && config.namesSearchEnabled !== undefined ? config.namesSearchEnabled : true,
      tagsSearchEnabled: config && config.tagsSearchEnabled !== undefined ? config.tagsSearchEnabled : true,
      statesSearchEnabled: config && config.statesSearchEnabled,
      notifyAttributeChanges: config && config.notifyAttributeChanges,
      notifyStateChanges: config && config.notifyStateChanges,
      notifyFlagChanges: config && config.notifyFlagChanges,
      notifyTagChanges: config && config.notifyTagChanges,
      debugEnabled: config && config.debugEnabled
    };
  }
}