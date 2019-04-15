import { TranslateAnimation, RotationAnimation } from '../src/components/Animation';
import GameObjectBuilder from '../src/engine/builder';
import Executor from '../src/components/chain-component';
import GameLoop from '../src/engine/game-loop';
import * as GameObject from '../src/engine/game-object';
import Component from '../src/engine/Component';

newGame(new GameLoop());

// Start a new game
function newGame(engine: GameLoop) {
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement, 800, 600, 1, { debugEnabled: true }, false);

    let obj = new GameObjectBuilder(engine.scene)
    .localPos(2,2)
    .anchor(0.5, 0.5)
    .asGraphics()
    .withParent(engine.scene.stage)
    .build();

    obj.beginFill(0xfff012, 1);
    obj.drawRect(-50, -50, 100, 100);
    obj.endFill();

    engine.scene.stage.addChild(obj);

    obj.addComponent(new Executor()
    .beginRepeat(0)
    .addComponentAndWait(() => new RotationAnimation(0,1,1000)) 
    .addComponentAndWait(() => new TranslateAnimation(100,100,200,200,1000))
    .endRepeat()
    );
}