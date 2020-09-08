# ECSLite

ECSLite is an experimental Entity-Component-System library written in JavaScript with educational intentions, hence it should be very easy to learn to make simple casual games.


## Features
- Built in TypeScript on top of [PixiJS](https://pixijs.com/) library
- object builder
- scene manager
- PIXI integration
- messaging pattern
- states, flags and tags
- simple debugging window
- keyboard/pointer handlers

## Goals
The goal for ECSLite is to be a lightweight and simple library that could be used for educational purposes. Therefore, it doesn't aim to provide complex features of HTML5 game engines. Instead, it should teach developers the basics of component-oriented programming

## Examples
- see the examples folder
- executor.html - an example how **ChainComponent** component works
- executor2.html - another ChainComponent example
- rotation.html - rotation animation


# Usage
- this library uses PixiJS and Parcel Bundler
- you need to have NodeJS 16+ version installed
- installation: `npm install`
- running: `npm start`
- for now, this library is not distributed as a NPM package, therefore you have to include the source code in your project
- you can find all examples at `localhost:1234`, e.g., `localhost:1234/executor.html`

- here is an example of a HTML code that will run the engine

```html
<!DOCTYPE html>
<html lang="en">

<head>
	<meta content="text/html;charset=utf-8" http-equiv="Content-Type">
	<meta content="utf-8" http-equiv="encoding">

</head>

<body>
	<canvas id="gameCanvas" width="600" height="400"></canvas>
	<script src="./index.ts"></script>
</body>
</html>
```

- and `index.ts`

```typescript

import * as ECS from '../src';

class MyGame {
  engine: ECS.Engine;

  constructor() {
    this.engine = new ECS.Engine();
    let canvas = (document.getElementById('gameCanvas') as HTMLCanvasElement);

    this.engine.init(canvas, { width: 800, height: 600 });

    this.engine.app.loader
        .reset()
        .add('spritesheet', './assets/spritesheet.png')
        .load(onAssetsLoaded);
  }

  onAssetsLoaded = () => {
      this.engine.scene.clearScene();
      const graphics = new ECS.Graphics();
      this.engine.scene.stage.addChild(graphics);
  }
}

export default new MyGame();
```


## How does it work?
- the logic is implemented inside components - you declare a component, attach it to a game object, and via its `onUpdate` method, you can update the state


### Components
- every functional behavior is implemented in components
- every component is attached to one game object
- global components are attached directly to the stage
- each component has the following lifecycle functions:
  - `onInit` - initializes the component
  - `onMessage` - sends a message to all subscribed components
  - `onAttach` - called when the component is being added to the scene 
  - `onDetach` - called when the component is being detached from the scene
  - `onFixedUpdate` - called with given frequency (only when `frequency` property is set)
  - `onUpdate` - called during the game loop, updates the component state
  - `onFinish` - called whenever this component has finished its execution
- if you want to add a new component to a game object, you have to call `addComponent` - it will add it to the queue of new components that will be added in the end of the loop
- any component can be terminated via `finish()` function

#### Lifecycle
- components are not added to objects instantly, but at the beginning of the update loop of their respective objects
  - immediate execution can be forced by calling addComponentAndRun instead of addComponent
- components can be reused - removed from an object and added to another one
- a component can be only attached to one game object at a time
- components can receive messages if they are running
- components can't receive message they had sent by themselves
- `finish()` will stop the components from execution and removes it from the scene
- if a game object is to be removed, all of its components will be finalized and removed as well
- if the parent game object gets detached from the scene (e.g. for later reuse), all of its components will be also detached and re-attached afterwards
  - `onAttach()` is called when a component is attached to the scene. It can happen in two cases:
    - a) component is added to an object that is already on the scene
    - b) a game object is attached to a scene (so will be its components)
  - if the component is detached, it won't update nor receive any messages
- **recommended**: if you don't need to react on detaching, use only `onInit()` for initialization and `onRemove()` for clean-up

![Components Workflow](./docs/components.png)

- example: creating a simple rectangle

```javascript
    let rect1Gfx = new ECS.Graphics();
    rect1Gfx.beginFill(0xfff012, 1);
    rect1Gfx.drawRect(0, 0, 100, 100);
    rect1Gfx.position.set(200, 200);
    rect1Gfx.pivot.set(50,50);
    rect1Gfx.addComponent(new RotationAnim());
    engine.scene.stage.addChild(rect1Gfx);
```

#### How to create a simple component
- create a new component
- initialize it in `onInit()`
- handle incoming messages in `onMessage()`
- handle update loop in `onUpdate(delta, absolute)`

```typescript
class Movement extends ECS.Component {

  onInit() {
    this.subscribe('STOP_EVERYTHING');
  }

  onMessage(msg:  ECS.Message) {
    if(msg.action === 'STOP_EVERYTHING') {
      this.finish();
    }
  }

  onUpdate(delta: number, absolute: number) {
    this.owner.pos.set(this.owner.pos.x + 20, this.owner.pos.y);
  }
}
```

### Game Objects
- game objects form a tree-like structure called Scene Graph. Any transformation of an object applies to its children as well
- the scene has one parent called `stage`. All objects are located in the structure of its descendants
- each object is added to the scene instantly
- every object has one main function: `onUpdate()` that calls all components attached to the object and calls respective functions upon them
- game objects have these important properties:
  - `name` - a string that identifies the object
  - `tags` - a set of tags
  - `attributes` - list of attributes that can be accessed via string keys
  - `stateId` - a numeric state
  - `flags` - a bit array of flags

![Game Objects Workflow](./docs/objects.png)

```typescript
let newObject = new ECS.Sprite('warrior', warriorTexture);

// we can store any number of attributes of any type
newObject.assignAttribute('speed', 20);

// we can store as many tags as we want
newObject.addTag('projectile');

// we can store flags within a range of 1-128
newObject.setFlag(FLAG_COLLIDABLE);

// a numeric state for a simple 
newObject.stateId = STATE_MOVING;
```

### Packages
- **Engine** - entry point to the library, accepts a configuration object and initializes PIXI game loop
- **Scene** - a scene manager, provides querying of components and game objects, manages global components
- **Component** - functional components of game objects. Global components are attached to the `stage` object
- **GameObject** - an interface that declares extension methods for PIXI containers
- **GameObjectProxy** - a delegate that contains implementation of methods in ECS.GameObject interface. It's used as a proxy by respective containers (because JavaScript doesn't have multi-inheritance facility)
- **Container, Sprite,...** -  PIXI containers that inherit from respective PIXI objects, implements ECS.GameObject interface and passes the implementation on to GameObjectProxy (in order to avoid duplicated code)


![Packages](./docs/packages.png)

## API
- this is a documentation of the most important parts. Since the engine is very small, you can investigate all functions on your own by taking a look at the codebase. Each function and property has a JSDoc

### Config
- to optimize query search in the scene, all components and objects are stored in hash maps, sets and array
- in order not to allocate too much memory, searching has to be enabled explicitly

```typescript
new ECS.Engine().init(canvas, {
    width: 800,
    height: 600,
    debugEnabled: true,
    flagsSearchEnabled: true,
    statesSearchEnabled: true,
}, true);
```

- `resizeToScreen` - if true, the game will be resized to fit the screen
- `transparent` - if true, the canvas will be trasparent
- `backgroundColor` - canvas background color
- `antialias` - enables antialiasing
- `width` - canvas virtual width
- `height` - canvas virtual height
- `resolution` - scale of displayed objects (1 by default)
- `gameLoopType` - type of the game loop (FIXED, VARIABLE)
- `gameLoopThreshold` - upper threshold of game loop in ms (300 by default)
- `gameLoopFixedTick` - period for fixed game loop (16ms by default)
- `speed` - speed of the game (1 by default)
- `flagsSearchEnabled` - enables searching by flags
- `statesSearchEnabled` - enables searching by states
- `tagsSearchEnabled` - enables searching by tags
- `namesSearchEnabled` - enables searching by names
- `notifyAttributeChanges` - enables notifying when an attribute changes
- `notifyStateChanges` - enables notifying when a state changes
- `notifyFlagChanges` - enables notifying when a flag changes
- `notifyTagChanges` - enables notifying when a tag changes
- `debugEnabled` - injects a debugging HTML element

#### Responsive mode
- if you want your game render in full-screen mode, scaling with the browser window, you have 2 options:
  - 1) set resizeToScreen to true while initializing the engine
  - 1) add ?responsive query string

### Scene
- `invokeWithDelay`
  - can call an action with a delay

```javascript
scene.invokeWithDelay(0.5, () => {
  playSound(ASSETS_SND_NEW_GAME);
});
```

- `app` - link to the PIXI.Application
- `name` - name of the scene
- `stage` - root game object, derived from PIXI.Container
- `currentDelta` - current delta time
- `currentAbsolute` - current game time
- `callWithDelay(number, function)` - invokes a function with a certain delay
- `addGlobalComponent(cmp)` - adds a global component (attached to the stage)
- `findGlobalComponentByName(name)` - finds a global component by name
- `removeGlobalComponent(component)` - removes a global component
- `assignGlobalAttribute(name, attr)` - assigns a global attribute to the stage
- `getGlobalAttribute(name)` - gets a global atribute by name
- `removeGlobalAttribute(string)` - removes a global attribute
- `findObjectById(id)` - finds objects by id
- `findObjectsByQuery(query)` - finds objects that meet conditions in the query
- `findObjectsByName(name)` - finds objects by name
- `findObjectByName(name)` - gets the first object of given name
- `findObjectsByTag(tag)` - finds objects that have given tag
- `findObjectByTag(tag)` - gets the first object that has given tag
- `findObjectsByFlag(flag)` - finds objects that have given flag set
- `findObjectByFlag(flag)` - gets the first object that has a given flag set
- `findObjectsByState(state)` - finds objects by numeric state
- `findObjectByState(state)` - gets the first object that has a numeric state set
- `sendMessage(message)` - sends a generic message
  - it's better to send message from within components (the message will carry their id)
- `clearScene(config)` - erases the whole scene

### Flags
- `flags` is a bit array you can use to your own needs
- example:

```javascript
myObject.setFlag(12);
myObject.hasFlag(12); // true
myObject.resetFlag(12);
myObject.hasFlag(12); // false
```

### GameObject
- game objects are only shells for components and attributes
- `stateId` is a numeric state you can use to implement a simple state machine
- `flags` is a bit array described above
- `tags` is a list of tags

### Message
- messaging system uses a class `Message` to store data
- `action` - action key (string), used by the components to subscribe for a certain group of messages
  - built-in messages: 
    - `ANY` - gets all messages (good for debugging)
    - `OBJECT_ADDED` - object was added to the scene
    - `OBJECT_REMOVED` - object was removed
    - `COMPONENT_ADDED` - component was added to an object
    - `COMPONENT_DETACHED` - component was detached from the scene (along with its owner)
    - `COMPONENT_REMOVED` - component was removed
    - `ATTRIBUTE_ADDED` - attribute was added (sent only when notifyAttributeChanges = true)
    - `ATTRIBUTE_CHANGED` - attribute has changed (sent only when notifyAttributeChanges = true)
    - `ATTRIBUTE_REMOVED` - attribute was removed (sent only when notifyAttributeChanges = true)
    - `STATE_CHANGED` - state of an object has changed (sent only when notifyStateChanges = true)
    - `FLAG_CHANGED` - flag of an object has changed (sent only when notifyFlagChanges = true)
    - `TAG_ADDED` - tag was added to an object (sent only when notifyTagChanges = true)
    - `TAG_REMOVED` - tag was removed from an object (sent only when notifyTagChanges = true)
    - `SCENE_CLEAR` - the whole scene was erased 
- `component` - a component that sent the message
- `gameObject` - a game object to which the component that sent the message belongs
- `data` - any custom payload

### Builder
- used to simplify game object creation

```javascript
new ECS.Builder(scene)
    .relativePos(0.5, 0.92)
    .anchor(0.5, 1)
    .withAttribute(Attributes.RANGE, 25)
    .withFlag(FLAG_COLLIDABLE)
    .withFlag(FLAG_RANGE)
    .withState(STATE_IDLE)
    .withComponent(new TowerComponent())
    .withComponent(new AimControlComponent())
    .withComponent(new ProjectileSpawner())
    .withName('tower')
    .asSprite(PIXI.Texture.from(Assets.TEX_TOWER))
    .withParent(rootObject)
.build();
```

- `anchor()` - set an anchor
- `virtualAnchor()` - sets an anchor only virtually to calculate positions
- `relativePos()` - relative position on the screen within [0, 1] range
- `localPos()` - local position
- `globalPos()` - global position
- `scale()` - local scale
- `withAttribute()` - adds an attribute
- `withComponent()` - adds a component
- `withFlag()` - adds a flag
- `withState()` - adds a state
- `withTag()` - adds a tag
- `withParent()` - sets a parent
- `withChild()` - sets a child Builder
- `withName()` - sets a name
- `asContainer()` - sets the target object as a container
- `asGraphics()` - sets the target object as graphics
- `asXYZ()` - sets the target object as XYZ (anything from PIXI object collection)
- `buildInto()` - puts the data into an existing object
- `build()` - builds a new object
- `clear()` - clears data


### Component
#### Component API
- `onInit` - initializes the component
- `subscribe(action)` - subscribes for messages with a given action
- `unsubscribe(action)` - unsubscribes a message
- `sendMessage` - sends a message
- `onAttach` - called when the component is being added to the scene 
- `onDetach` - called when the component is being detached from the scene
- `onFixedUpdate` - called with given frequency (only when `frequency` property is set)
- `onMessage` - called whenever the component receives a message
- `onRemove` - called before removal from the scene
- `onUpdate` - game loop, called each 16ms, used to update the component's state
- `onFinish` - called when the component is about to be finished and removed
- `finish()` - will terminate the component and remove it from the game object


### Built-in components
#### DebugComponent
- debug component will attach a debugging panel next to the canvas
- three ways:
  - 1) add DebugComponent to the stage
  - 2) add ?debug query string
  - 3) set debugEnabled to true while initializing the engine

![Debug Component](./docs/debugcomponent.png)


#### PointerInputComponent
- used for mouse/touch input
- first you need to specify what you want to capture
  - example: DOWN + MOVE: `new InputManager(INPUT_DOWN | INPUT_MOVE)`
- then you just use any component you like to subscribe to the following actions:
  - `MSG_TOUCH` - touch event
  - `MSG_DOWN` - pointer down event
  - `MSG_UP` - pointer up event
  - `MSG_MOVE` - pointer move event

#### VirtualGamePadComponent
- simulates a virtual gamepad with 8 that gets rendered on the screen
- the buttons can be configured and mapped to 8 keyboard keys

```typescript
  this.engine.scene.addGlobalComponent(new ECS.VirtualGamepadComponent({
      KEY_UP: ECS.Keys.KEY_UP,
      KEY_DOWN: ECS.Keys.KEY_DOWN,
      KEY_LEFT: ECS.Keys.KEY_LEFT,
      KEY_RIGHT: ECS.Keys.KEY_RIGHT,
      KEY_A: ECS.Keys.KEY_SPACE,
      KEY_B: ECS.Keys.KEY_ENTER,
      KEY_X: ECS.Keys.KEY_ALT,
      KEY_Y: ECS.Keys.KEY_SHIFT
  }));
```

#### GenericComponent
- a functional component
- example: a very simple rotation animation

```typescript
new ECS.FuncComponent('view')
    .setFixedFrequency(0.1) // 1 update per 10 seconds
    .doOnMessage('UNIT_EXPLODED', (cmp, msg) => cmp.playSound(Sounds.EXPLOSION))
    .doOnMessage('UNIT_SPAWNED', (cmp, msg) => cmp.displayWarning(Warnings.UNIT_RESPAWNED))
    .doOnFixedUpdate((cmp, delta, absolute) => cmp.displayCurrentState())
```

#### KeyInputComponent
- keyboard handler
- example:

```typescript
const keyInput = new KeyInputComponent();
myObj.addComponent(keyInput);

// ... onUpdate:
const isSpacePressed = keyInput.isKeyPressed(' '.charCodeAt(0));
```

#### ChainComponent
- this component is extremely powerful - you can use callbacks to implement a very complex behavior
- see `executor.html` for more information
- example: rotation every second

```javascript
// displays a sequence of fancy rotating texts whilst in the bonus mode
this.owner.addComponent(new ChainComponent()
  .beginWhile(() => this.gameModel.mode === BONUS_LEVEL)
      .beginRepeat(4)
          .waitFor(() => new RotationAnimation(0,360))
          .waitFor(() => new TranslateAnimation(0,0,2,2))
          .call(() => textComponent.displayMessage('BONUS 100 POINTS!!!'))
          .call(() => soundComponent.playSound('bonus'))
      .endRepeat()
  .endWhile()
  .call(() => viewComponent.removeAllTexts()));
 
// changes background music every 20 seconds
this.owner.addComponent(new ChainComponent()
  .waitForMessage('GAME_STARTED')
  .beginWhile(() => this.scene.stage.hasFlag(GAME_RUNNING))
    .waitTime(20000)
    .call(() => this.changeBackgroundMusic())
  .endWhile()
```


### Tests
- to make this repo as tiny as possible, there is no jest/mocha etc. The tests can be run by simply opening the `examples/tests.html` file in your browser. The result gets displayed on the screen.
