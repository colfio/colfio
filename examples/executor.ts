import { TranslateAnimation } from './../src/components/Animation';
import DebugComponent from '../src/components/DebugComponent';
import GameObjectBuilder from '../src/engine/PIXIObjectBuilder';
import Executor from '../src/components/ChainingComponent';
import { PixiRunner } from '../src/PixiRunner';
import { PIXICmp } from '../src/engine/PIXIObject';

newGame(new PixiRunner());
// Start a new game
function newGame(engine: PixiRunner) {
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement,100);

    // debugging
    engine.scene.addGlobalComponent(new DebugComponent(document.getElementById("debugSect")));

    let rectangleGfx = new PIXICmp.Graphics();
    rectangleGfx.beginFill(0xfff012, 1);
    rectangleGfx.drawRect(0, 0, 1, 1);
    rectangleGfx.endFill();

    let obj = new GameObjectBuilder(engine.scene)
        .localPos(200, 200)
        .anchor(0.5, 0.5)
        .build(rectangleGfx);

    engine.scene.stage.getPixiObj().addChild(obj);

    obj.addComponent(new Executor()
    .beginInterval(1)
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(1, 1, 2, 1, 1)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(2, 1, 2, 2, 1)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(2, 2, 1, 2, 1)))
    .removePrevious()
    .execute((cmp) => cmp.addComponentAndWait(new TranslateAnimation(1, 2, 1, 1, 1)))
    .removePrevious()
    .endInterval());
}

