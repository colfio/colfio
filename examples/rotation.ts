import DebugComponent from '../src/components/DebugComponent';
import Component from '../src/engine/Component';
import { PixiRunner } from '../src/PixiRunner';
import { PIXICmp } from '../src/engine/PIXIObject';

class RotationAnim extends Component {
    onUpdate(delta, absolute) {
        this.owner.getPixiObj().rotation += delta;
    }
}

newGame(new PixiRunner());


// Start a new game
function newGame(engine: PixiRunner) {
    
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement);

    // debugging
    engine.scene.addGlobalComponent(new DebugComponent(document.getElementById("debugSect")));

    let rect1Gfx = new PIXICmp.Graphics();
    rect1Gfx.beginFill(0xfff012, 1);
    rect1Gfx.drawRect(0, 0, 100, 100);

    let rect2Gfx = new PIXICmp.Graphics();
    rect2Gfx.beginFill(0x00ff12, 1);
    rect2Gfx.drawRect(0, 0, 100, 100);

    rect1Gfx.position.set(200, 200);
    rect1Gfx.pivot.set(50,50);
    rect1Gfx.addComponent(new RotationAnim());
    engine.scene.stage.getPixiObj().addChild(rect1Gfx);

    rect2Gfx.position.set(350, 200);
    rect2Gfx.pivot.set(50, 50);
    rect2Gfx.addComponent(new RotationAnim());
    engine.scene.stage.getPixiObj().addChild(rect2Gfx);
}

