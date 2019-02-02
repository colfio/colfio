import { TranslateAnimation, RotationAnimation } from '../src/components/Animation';
import DebugComponent from '../src/components/debug-component';
import GameObjectBuilder from '../src/engine/pixi-object-builder';
import Executor from '../src/components/chaining-component';
import GameLoop from '../src/engine/game-loop';
import { PIXICmp } from '../src/engine/pixi-object';
import Component from '../src/engine/Component';

newGame(new GameLoop());


// Start a new game
function newGame(engine: GameLoop) {
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, 800, 600, 1, false);

    // debugging
    engine.scene.addGlobalComponent(new DebugComponent(document.getElementById("debugSect")));

    let rectangleGfx = new PIXICmp.Graphics();
    rectangleGfx.beginFill(0xfff012, 1);
    rectangleGfx.drawRect(0, 0, 100, 100);

    let obj = new GameObjectBuilder(engine.scene)
    .localPos(2,2)
    .anchor(0.5, 0.5)
    .build(rectangleGfx);

    engine.scene.stage.getPixiObj().addChild(obj);

    obj.addComponent(new Executor()
    .beginRepeat(0)
    .addComponentAndWait(() => new RotationAnimation(0,1,1000)) 
    .addComponentAndWait(() => new TranslateAnimation(100,100,200,200,1000))
    .endRepeat()
    );
}