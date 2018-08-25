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
- executor.html - an example how **Executor** component works
- executor2.html - another Executor example
- rotation.html - rotation animation


# Usage
- this library uses PixiJS and Parcel Bundler
- you need to have NodeJS 14+ version installed
- installation: `npm install`
- running: `npm start`
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
import Component from '../ts/engine/Component';
import GameObject from '../ts/engine/GameObject';
import Scene from '../ts/engine/Scene';
import GameObjectBuilder from '../ts/builders/GameObjectBuilder';
import Executor from '../ts/components/Executor';

let engine = import('../ts/engine/DodoEngine');
engine.then((val) => newGame(val.default));

// Start a new game
function newGame(engine: DodoEngine) {
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement,100);
}
```


## How does it work?
- the logic is implemented inside components - you declare a component, attach it to a game object, and via its `update` method, you can update the state

### Components
- each component has the following lifecycle functions:
  - `oninit` - initializes the component
  - `onmessage` - sends a message to all subscribed components
  - `update` - called during the game loop, updates the component state
  - `onFinished` - called whenever this component has finished its execution
- if you want to add a new component to a game object, you have to call `addComponent` - it will add it to the queue of new components that will be added in the end of the loop
- any component can be terminated via `finish()` function

![Components Workflow](./docs/components.png)

- example: creating a simple rectangle

```javascript
  let rect2 = new GameObject("rect2", 0, rect2Gfx);
  rect2.mesh.position.set(350, 200);
  rect2.mesh.pivot.set(50, 50);
  rect2.addComponent(new RotationAnim());
  engine.scene.addGlobalGameObject(rect2);
```

### Game Objects
- game objects form a tree-like structure called Scene Graph. Any transformation of an object applies to its children as well
- each object is added to the scene instantly
- every object has two main functions: `update()` and `draw()`, each of which calls all components attached to the object and calls respective functions upon them
- game objects that have an initialized `mesh` property, can be rendered via a `BasicRenderer`
- game objects have these important properties:
  - `tag` - a string that identifies the object
  - `trans` - transformation object
  - `attributes` - list of attributes that can be accessed via string keys
  - `state` - a numeric state
  - `flags` - a bit array of flags

![Game Objects Workflow](./docs/objects.png)

### Packages
- **Scene** - serves as a message bus and scene manager, contains global components, game objects, and attributes
- **Component** - a basic unit of the ECS pattern. Components are attached to game objects, can subscribe to the messaging system via `subscribe()` and send messages to other components via `sendmsg`
- **GameObject** - game objects are mere containers for components and attributes

![Packages](./docs/packages.png)

## API
- this is a documentation of the most important parts. Since the engine is very small, you can investigate all functions on your own by taking a look at the codebase. Each function and property has a JSDoc


### Scene
- `addPendingInvocation`
  - can call an action with a delay

```javascript
scene.addPendingInvocation(0.5, () => {
  playSound(ASSETS_SND_NEW_GAME);
});
```

- `submitChanges`
  - recursively recalculates absolute transformations of all game objects
- `addGlobalComponent`
  - attaches a component to the root object
- `findAllObjectsByTag`
  - allows to find objects by their tags
- `clearScene`
  - removes all components and objects from the scene
- `sendmsg`
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
- `state` is a numeric state you can use to implement a simple state machine
- `flags` is a bit array described above
- `submitChanges(recursively)` will recalculate transformations

### Msg
- messaging system uses a class `Msg` to store data
- `action` - action key (string), used by the components to subscribe for a certain group of messages
  - special actions: 
    - `MSG_ALL` that is sent to **each** component
    - `MSG_OBJECT_ADDED` that is sent to inform subscribed components that a new game object has been added
    - `MSG_OBJECT_REMOVED` that is sent to inform subscribed components that an existing game object has been removed
- `component` - a component that sent the message
- `gameObject` - a game object to which the component that sent the message belongs
- `data` - any custom payload

### Component
#### Component API
- `oninit` - initializes the component
- `subscribe(action)` - subscribes for messages with a given action
- `unsubscribe(action)` - unsubscribes a message
- `sendmsg` - sends a message
- `onmessage` - called whenever the component receives a message
- `update` - game loop, called each 16ms, used to update the component's state
- `onFinished` - called when the component is about to be finished and removed
- `finish` - will terminate the component and remove it from the game object

#### Component states
- each component can be in several of the following states
- `STATE_INACTIVE` - not active
- `STATE_UPDATABLE` -  `update` function can be invoked
- `STATE_DRAWABLE` - `draw` function can be invoked
- `STATE_LISTENING` - `onmessage` function can be invoked


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

#### InputManager
- used for mouse/touch input
- first you need to specify what you want to capture
  - example: DOWN + MOVE: `new InputManager(INPUT_DOWN | INPUT_MOVE)`
- then you just use any component you like to subscribe to the following actions:
  - `MSG_TOUCH` - touch event
  - `MSG_DOWN` - pointer down event
  - `MSG_UP` - pointer up event
  - `MSG_MOVE` - pointer move event

#### Executor
- this component is extremely powerful - you can use callbacks to implement a very complex behavior
- see `executor.html` for more information
- example: rotation every second

```javascript
myObj.addComponent(new Executor()
  .beginInterval(1000)
  .execute((cmp) => cmp.owner.rotation += 0.1)
  .endInterval()
);
```

### GameObjectBuilder
- used to simplify game object creation

```javascript
  let obj = new GameObjectBuilder("rect1")
  .withMesh(rectangleGfx)
  .withPosition(2,2)
  .withCenteredOrigin()
  .withComponent(new Executor()
      .beginRepeat(0)
      .addComponentAndWait(() => new RotationAnimation(0,1,1)) 
      .addComponentAndWait(() => new TranslateAnimation(1,1,2,2,1))
      .endRepeat()
  )
  .asGlobal()
      .build(engine.scene);
```

### Tests
- to make this repo as tiny as possible, there is no jest/mocha etc. The tests can be run by simply opening the `examples/tests.html` file in your browser
