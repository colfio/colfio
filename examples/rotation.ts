import { TranslateAnimation, RotationAnimation } from '../src/components/Animation';
import DebugComponent from '../src/components/debug-component';
import GameObjectBuilder from '../src/engine/pixi-object-builder';
import Executor from '../src/components/chaining-component';
import GameLoop from '../src/engine/game-loop';
import { PIXICmp } from '../src/engine/pixi-object';
import Component from '../src/engine/Component';

class RotationAnim extends Component {
    onUpdate(delta, absolute) {
        this.owner.pixiObj.rotation += delta * 0.01;
    }
}

newGame(new GameLoop());


// Start a new game
function newGame(engine: GameLoop) {
    
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, 800, 600, 1, false);

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
    engine.scene.stage.pixiObj.addChild(rect1Gfx);

    rect2Gfx.position.set(350, 200);
    rect2Gfx.pivot.set(50, 50);
    rect2Gfx.addComponent(new RotationAnim());
    engine.scene.stage.pixiObj.addChild(rect2Gfx);
}

