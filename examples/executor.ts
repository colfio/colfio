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
    rectangleGfx.endFill();

    let obj = new GameObjectBuilder(engine.scene)
        .localPos(200, 200)
        .anchor(0.5, 0.5)
        .build(rectangleGfx);

    engine.scene.stage.pixiObj.addChild(obj);

    obj.addComponent(new Executor()
    .beginInterval(1)
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(100, 100, 200, 100, 1000)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(200, 100, 200, 200, 1000)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(200, 200, 100, 200, 1000)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(100, 200, 100, 100, 1000)))
    .removePrevious()
    .endInterval());
}

