import Component from '../ts/engine/Component';
import DebugComponent from '../ts/components/DebugComponent';
import GameObject from '../ts/engine/GameObject';
import Scene from '../ts/engine/Scene';

let engine = import('../ts/engine/DodoEngine');
engine.then((val) => newGame(val.default));


// Start a new game
function newGame(engine: DodoEngine) {
    
    engine.init(document.getElementById("gameCanvas") as HTMLCanvasElement);

    // debugging
    engine.scene.addGlobalComponent(new DebugComponent(false, document.getElementById("debugSect")));

    let rect1Gfx = new PIXI.Graphics();
    rect1Gfx.beginFill(0xfff012, 1);
    rect1Gfx.drawRect(0, 0, 100, 100);

    let rect2Gfx = new PIXI.Graphics();
    rect2Gfx.beginFill(0x00ff12, 1);
    rect2Gfx.drawRect(0, 0, 100, 100);

    let rect1 = new GameObject("rect1", 0, rect1Gfx);
    rect1.mesh.position.set(200, 200);
    rect1.mesh.pivot.set(50,50);
    rect1.addComponent(new RotationAnim());
    engine.scene.addGlobalGameObject(rect1);

    let rect2 = new GameObject("rect2", 0, rect2Gfx);
    rect2.mesh.position.set(350, 200);
    rect2.mesh.pivot.set(50, 50);
    rect2.addComponent(new RotationAnim());
    engine.scene.addGlobalGameObject(rect2);
}

class RotationAnim extends Component {
    update(delta, absolute) {
        this.owner.mesh.rotation += delta;
    }
}