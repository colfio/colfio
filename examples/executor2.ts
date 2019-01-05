import { TranslateAnimation, RotationAnimation } from '../src/components/Animation';
import DebugComponent from '../src/components/DebugComponent';
import GameObjectBuilder from '../src/engine/PIXIObjectBuilder';
import Executor from '../src/components/ChainingComponent';
import PixiRunner from '../src/engine/PixiRunner';
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

    let obj = new GameObjectBuilder(engine.scene)
    .localPos(2,2)
    .anchor(0.5, 0.5)
    .build(rectangleGfx);

    engine.scene.stage.getPixiObj().addChild(obj);

    obj.addComponent(new Executor()
    .beginRepeat(0)
    .addComponentAndWait(() => new RotationAnimation(0,1,1000)) 
    .addComponentAndWait(() => new TranslateAnimation(1,1,2,2,1000))
    .endRepeat()
    );
}