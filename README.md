# ECSLite

ECSLite is an experimental Entity-Component-System library written in JavaScript with educational intentions, hence it should be very easy to learn to make simple casual games.


## Features
- Built in TypeScript on top of [PixiJS](https://pixijs.com/) library
- Scene Graph
- Game Loop
- Messaging system
- Asynchronous components

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
import GameLoop from '../src/engine/GameLoop';

newGame(new GameLoop());
// Start a new game
function newGame(engine: GameLoop) {
        engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement);
}
```


## How does it work?
- the logic is implemented inside components - you declare a component, attach it to a game object, and via its `onUpdate` method, you can update the state

### Components
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


### Scene
- `invokeWithDelay`
  - can call an action with a delay

```javascript
scene.invokeWithDelay(0.5, () => {
  playSound(ASSETS_SND_NEW_GAME);
});
```

- `addGlobalComponent`
  - attaches a component to the root (stage) object
- `findAllObjectsByTag`
  - allows to find objects by their tags
- `findObjectByName` and `findObjectsByName` 
  - finds object(s) by name
- `findObjectByTag` and `findObjectsByTag`
  - finds objects by a tag
- `findObjectByFlag` and `findObjectsByFlag`
  - finds object(s) by flag
- `clearScene`
  - removes all components and objects from the scene
- `sendMessage`
  - sends a message to all subscribed components. Note that components also have this function which is easier to use as it passes some metadata from the component itself

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
  - special actions: 
    - `ANY` that is sent to **each** component
    - `OBJECT_ADDED` that is sent to inform subscribed components that a new game object has been added
    - `OBJECT_REMOVED` that is sent to inform subscribed components that an existing game object has been removed
    - `STATE_CHANGED` - when a state of an object has changed
    - `COMPONENT_ADDED` - component has been added
    - `COMPONENT_REMOVED` - component has been removed 
- `component` - a component that sent the message
- `gameObject` - a game object to which the component that sent the message belongs
- `data` - any custom payload

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
- displays a debugging info - very handy!

![Debug Component](./docs/debugcomponent.png)


#### Animation
- TranslateAnimation - for translation

```javascript
let translateAnim = new TranslateAnimation(
    fromX, 
    fromY,
    toX,
    toY, duration);
```

- RotationAnimation - for rotation

```javascript
let rotateAnim = new RotationAnimation(
    from, 
    to,
    duration);
```

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

#### GenericComponent
- a functional component
- example: a very simple rotation animation

```typescript
myObj.addComponent(new GenericComponent('some_cool_name')
  .doOnInit((cmp) => cmp.owner.rotation = 0)
  .doOnUpdate((cmp, delta, absolute) => cmp.owner.rotation += 0.1)
);
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
myObj.addComponent(new ChainComponent()
  .beginInterval(1000)
    .call((cmp) => cmp.owner.rotation += 0.1)
  .endInterval()
);
```


### Builder
- used to simplify game object creation

```javascript
  let obj = new Builder(scene)
  .localPos(2,2)
  .withComponent(new Executor()
      .beginRepeat(0)
      .waitFor(() => new RotationAnimation(0,1,1)) 
      .waitFor(() => new TranslateAnimation(1,1,2,2,1))
      .endRepeat()
  )
  .build(myPixiObject);
```

### Tests
- to make this repo as tiny as possible, there is no jest/mocha etc. The tests can be run by simply opening the `examples/tests.html` file in your browser. The result gets displayed on the screen.
