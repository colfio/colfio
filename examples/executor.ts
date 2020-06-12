import { TranslateAnimation, RotationAnimation } from '../src/components/Animation';
import DebugComponent from '../src/components/debug-component';
import GameObjectBuilder from '../src/engine/builder';
import ChainComponent from '../src/components/chain-component';
import GameLoop from '../src/engine/game-loop';
import * as GameObject from '../src/engine/game-object';
import Component from '../src/engine/Component';

newGame(new GameLoop());
// Start a new game
function newGame(engine: GameLoop) {
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, { debugEnabled: true });

    let obj = new GameObjectBuilder(engine.scene)
        .localPos(200, 200)
        .anchor(0.5, 0.5)
        .asGraphics()
        .withParent(engine.scene.stage)
        .build().asGraphics();

    obj.beginFill(0xfff012, 1);
    obj.drawRect(0, 0, 100, 100);
    obj.endFill();

        
    obj.addComponent(new ChainComponent()
    .beginInterval(1)
        .waitFor(() => (new TranslateAnimation(100, 100, 200, 100, 1000)))
        .waitFor(() => (new TranslateAnimation(200, 100, 200, 200, 1000)))
        .waitFor(() => (new TranslateAnimation(200, 200, 100, 200, 1000)))
        .waitFor(() => (new TranslateAnimation(100, 200, 100, 100, 1000)))
    .endInterval());
}

