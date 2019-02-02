import * as GameLoop from "./engine/game-loop";
import * as Component from "./engine/component";
import * as Constants from "./engine/constants";
import * as Flags from "./engine/flags";
import * as GameObjectProxy from "./engine/game-object-proxy";
import *  as Msg from "./engine/message";
import * as PIXIObject from "./engine/pixi-object";
import * as PIXIObjectBuilder from "./engine/pixi-object-builder";
import * as Scene from "./engine/scene";
import * as Animation from "./components/animation";
import * as ChainingComponent from "./components/chainingComponent";
import * as ComposingComponent from "./components/composing-component";
import * as DebugComponent from "./components/debug-component";
import * as DynamicsComponent from "./components/dynamics-component";
import * as GenericComponent from "./components/generic-component";
import * as KeyInputComponent from "./components/key-input-component";
import * as TouchInputComponent from "./components/touch-input-component";
import * as Dynamics from "./utils/dynamics";
import * as QuadTree from "./utils/quad-tree";
import * as Vec2 from "./utils/vector";

export default {
  GameLoop,
  Component,
  Constants,
  Flags,
  GameObjectProxy,
  Msg,
  PIXIObject,
  PIXIObjectBuilder,
  Scene,
  Animation,
  ChainingComponent,
  ComposingComponent,
  DebugComponent,
  DynamicsComponent,
  GenericComponent,
  KeyInputComponent,
  TouchInputComponent,
  Dynamics,
  QuadTree,
  Vec2
};