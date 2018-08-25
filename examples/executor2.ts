import { TranslateAnimation, RotationAnimation } from './../ts/components/Animation';
import Component from '../ts/engine/Component';
import DebugComponent from '../ts/components/DebugComponent';
import GameObject from '../ts/engine/GameObject';
import Scene from '../ts/engine/Scene';
import GameObjectBuilder from '../ts/builders/GameObjectBuilder';
import Executor from '../ts/components/Executor';

let engine = import('../ts/engine/DodoEngine');
engine.then((val) => newGame(val.default));


// Start a new game
function newGame(engine: DodoEngine) {

    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement,100);

    // debugging
    engine.scene.addGlobalComponent(new DebugComponent(false, document.getElementById("debugSect")));

    let rectangleGfx = new PIXI.Graphics();
    rectangleGfx.beginFill(0xfff012, 1);
    rectangleGfx.drawRect(0, 0, 1, 1);

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
}