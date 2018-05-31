# ECSLite

ECSLite is an experimental Entity-Component-System library written in JavaScript with educational intentions, hence it should be very easy to learn for anyone who would like to get to understand how interactive games can be programmed.


## Features
- Vanilla JavaScript
- Focused on providing a simple but yet efficient API
- Simple Canvas API
- Scene Graph
- Game Loop
- Messaging system
- Asynchronous components

## Goals
The goal is for ECSLite to be a lightweight and simple library that could be used for educational purposes. Therefore, it doesn't aim to provide a complex features of HTML5 game engines. Instead, it should teach developers the basics of component-oriented programming

## Examples
- see the examples folder
- example1.html - renders an image
- example2.html - renders two squares and shows how DebugComponent works
- example3.html - shows how ExecutorComponent works
- example4.html - shows simple animations



# Usage

This library is written solely in JavaScript ES6 and doesn't require any bundling or transpiling libraries. You just include the following files in your HTML page along with the canvas element and you are good to go!

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
  <meta content="utf-8" http-equiv="encoding">
</head>

<body>
  <!-- Initialize the canvas, name it "gameCanvas"-->
  <canvas id="gameCanvas" width="600" height="400"></canvas>
  <!-- Create a script that will contain a function newGame to initialize the game-->
  <script type="text/javascript">		
    function newGame() {
      // ...
    }
  </script>
  <!-- Include all other scripts in the following order -->
  <script src="../src/sortedarray.js"></script>
  <script src="../src/imageloader.js"></script>
  <script src="../src/compengine.js"></script>
  <script src="../src/compenginecom.js"></script>
  <script src="../src/utils.js"></script>
  <script src="../src/main.js"></script>
</body>

</html>
```


## How does it work?
- the logic is implemented inside components - you declare a component, attach it to a game object, and via its `update` method, you can update the state

### Components
- each component has the following lifecycle functions:
  - `oninit` - initializes the component
  - `onmessage` - sends a message to all subscribed components
  - `update` - called during the game loop, updates the component state
  - `draw` - called during the game loop, can use CanvasAPI to render stuff
  - `onFinished` - called whenever this component has finished its execution
- if you want to add a new component to a game object, you have to call `addComponent` - it will add it to the queue of new components that will be added in the end of the loop
- any component can be terminated via `finish()` function

![Components Workflow](./docs/components.png)

- example: creating a simple rectangle

```javascript
let rect1 = new GameObject("rect1");
// 100x100 pixels
rect1.mesh = new RectMesh("rgb(255,0,0)", 100, 100);
rect1.trans.setPosition(20, 20);
// rendering component for all basic meshes
rect1.addComponent(new BasicRenderer());
rect1.addComponent(new RotationAnim());
scene.addGlobalGameObject(rect1);
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

### Unit Size
- unit size in px - all attributes are calculated against this size
- example:

```javascript
// each unit will have 100 pixels
UNIT_SIZE = 100;
let rect1 = new GameObject("rect1");
// now, the rectangle will have the size of 100x100 pixels
rect1.mesh = new RectMesh("rgb(255,0,0)", 1, 1);
```

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

### BBox
- each game object has a property `bbox` that represents a bounding box
- the bounding box gets recalculated at the end of each game object's iteration
- you can use it to verify if two objects intersect by calling `intersects()`

### Mesh
- `Mesh` is a base class for all renderable structures
- if a game object contains a `BasicRenderer` component, the mesh will get rendered by using CanvasAPI
- the following mesh classes are implemented:
  - `RectMesh` - a simple rectangle
  - `TextMesh` - a text
  - `ImageMesh` - an image
  - `SpriteMesh` - a sprite whose texture is taken from a sprite atlas at given offset
  - `MultiSprite` - mesh that can render several sprites at once
  - `MultiSpriteCollection`- a collection of multi-sprites

```javascript
// will render a green rectangle
let rect2 = new GameObject("rect2");
rect2.mesh = new RectMesh("rgb(0,255,0)", 100, 100);
rect2.addComponent(new BasicRenderer());
```

### Trans
- `trans` is a property of each game object that represents transformation data, such as:
  - position, rotation, rotation offset, and absolute coordinates (calculated automatically)

```javascript
car.trans.posX = model.cameraPositionX;
car.trans.posY = model.cameraPositionY;
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
    - `ALL` that is sent to **each** component
    - `OBJECT_ADDED` that is sent to inform subscribed components that a new game object has been added
    - `OBJECT_REMOVED` that is sent to inform subscribed components that an existing game object has been removed
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
- `draw` - dedicated for rendering purposes
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

#### BasicRenderer
- can be used for rendering of the `mesh` attribute

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

#### ExecutorComponent
- this component is extremely powerful - you can use callbacks to implement a very complex behavior
- see `example3.html` for more information
- example: rotation every second

```javascript
myObj.addComponent(new ExecutorComponent()
  .beginInterval(1000)
  .execute((cmp) => cmp.owner.rotation += 0.1)
  .endInterval()
);
```

### Utils
- `imageLoader` - used to load images
- `sortedArray` - an extension for Array object for sorted arrays
- `GameObjectBuilder` - used to simplify game object creation

```javascript
let obj = new GameObjectBuilder("rect1")
.withMesh(new RectMesh("rgb(255,0,0)", 1, 1))
.withPosition(2,2)
.withCenteredOrigin()
.withComponent(new BasicRenderer())
.asGlobal()
.build(scene);
```

### Tests
- to make this repo as tiny as possible, there is no jest/mocha etc. The tests can be run by simply opening the `tests/run.html` file in your browser
