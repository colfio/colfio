import { Scene, PIXICmp, GenericComponent, Message } from '..';
import { Ticker } from 'pixi.js';
import ChainingComponent from '../components/chaining-component';
import PIXIBuilder from '../engine/pixi-builder';

const WIDTH = 600;
const HEIGHT = 600;
const TIME_STEP = 16.67;

abstract class BaseTest {

  protected isRunning = false;


  beforeTest(scene: Scene) {
    scene.clearScene();
  }

  abstract executeTest(scene: Scene, ticker: Ticker, onFinish: Function);

  afterTest(scene: Scene) {
    this.stop();
    scene.clearScene();
  }

  protected update(delta: number, absolute: number, scene: Scene, ticker: Ticker) {
    scene._update(delta, absolute);
    ticker.update(absolute);
  }

  protected loop(scene: Scene, ticker: Ticker) {
    this.isRunning = true;
    this.loopFunc(0, 0, scene, ticker);
  }

  protected loopFunc(delta: number, absolute: number, scene: Scene, ticker: Ticker) {
    this.update(delta, absolute, scene, ticker);
    if (this.isRunning) {
      requestAnimationFrame((time) => this.loopFunc(TIME_STEP, absolute + TIME_STEP, scene, ticker));
    }
  }

  protected stop() {
    this.isRunning = false;
  }
}

// ============================================================================================================
class RotationTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new PIXICmp.Graphics('');
    gfx.beginFill(0xFF0000);
    gfx.drawRect(0, 0, 200, 200);
    gfx.pivot.set(100, 100);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.addComponent(new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += delta * 0.001));
    scene.invokeWithDelay(1500, () => {
      onFinish('Rotation test', 'OK', true);
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class FlagTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let obj = new PIXICmp.Container();

    obj.setFlag(1);
    obj.setFlag(10);
    obj.setFlag(20);
    obj.setFlag(32);
    obj.setFlag(45);
    obj.setFlag(70);
    obj.setFlag(90);
    obj.setFlag(128);
    obj.resetFlag(1);
    obj.invertFlag(2);
    let flags = [...obj._proxy.getAllFlags()];
    let allFlags = [2, 10, 20, 32, 45, 70, 90, 128];
    let success = flags.length === allFlags.length && flags.filter(flag => allFlags.findIndex(it => it === flag) === -1).length === 0;
    onFinish('Flag manipulation', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class TagSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ tagsSearchEnabled: true });
    let obj = new PIXICmp.Container();
    obj.addTag('A');
    obj.addTag('B');
    obj.addTag('C');
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new PIXICmp.Container();
    obj2.addTag('A');
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new PIXICmp.Container();
    obj3.addTag('A');
    obj3.addTag('B');
    scene.stage.pixiObj.addChild(obj3);
    let success = scene.findObjectsByTag('A').length === 3 && scene.findObjectsByTag('B').length === 2 && scene.findObjectsByTag('C').length === 1;
    onFinish('Searching by tag', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class TagSearchTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ tagsSearchEnabled: true });
    let obj = new PIXICmp.Container();
    obj.addTag('A');
    obj.addTag('B');
    obj.addTag('C');
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new PIXICmp.Container();
    obj2.addTag('A');
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new PIXICmp.Container();
    obj3.addTag('A');
    obj3.addTag('B');
    scene.stage.pixiObj.addChild(obj3);
    obj3.removeTag('A');
    obj3.removeTag('B');
    let success = scene.findObjectsByTag('A').length === 2 && scene.findObjectsByTag('B').length === 1 && scene.findObjectsByTag('C').length === 1;
    onFinish('Searching by tag 2', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class StateSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ statesSearchEnabled: true });
    let obj = new PIXICmp.Container();
    obj.stateId = 15;
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new PIXICmp.Container();
    obj2.stateId = 15;
    scene.stage.pixiObj.addChild(obj2);

    let obj3 = new PIXICmp.Container();
    obj3.stateId = 10;
    scene.stage.pixiObj.addChild(obj3);
    let success = scene.findObjectsByState(15).length === 2 && scene.findObjectsByState(10).length === 1 && scene.findObjectsByState(5).length === 0;
    onFinish('Searching by state', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class StateSearchTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ statesSearchEnabled: true });
    let obj = new PIXICmp.Container();
    obj.stateId = 15;
    scene.stage.pixiObj.addChild(obj);

    let obj2 = new PIXICmp.Container();
    obj2.stateId = 15;
    scene.stage.pixiObj.addChild(obj2);
    obj.stateId = 200; // change the state
    let success = scene.findObjectsByState(15).length === 1 && scene.findObjectsByState(200).length === 1;
    onFinish('Searching by state 2', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class FlagSearchTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    scene.clearScene({ flagsSearchEnabled: true });
    let obj = new PIXICmp.Container();
    obj.setFlag(12);
    scene.stage.pixiObj.addChild(obj);
    obj.setFlag(120);
    let obj2 = new PIXICmp.Container();
    obj2.setFlag(12);
    scene.stage.pixiObj.addChild(obj2);
    obj.resetFlag(120);
    let success = scene.findObjectsByFlag(12).length === 2 && scene.findObjectsByFlag(120).length === 0;
    onFinish('Searching by flag', success ? 'OK' : 'FAILURE', success);
  }
}
// ============================================================================================================
class ComponentUpdateTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new PIXICmp.Graphics('');
    gfx.beginFill(0x0000FF);
    gfx.drawRect(0, 0, 50, 50);
    gfx.pivot.set(25, 25);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    gfx.scale.x = 0;
    gfx.addComponent(new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.scale.x++).setFrequency(1)); // 1 per second
    scene.invokeWithDelay(3500, () => {
      let success = Math.floor(gfx.scale.x) === 4;
      onFinish('Component update once per second', success ? 'OK' : 'FAILURE, VAL: ' + gfx.scale.x, success);
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let gfx = new PIXICmp.Graphics('');
    gfx.beginFill(0x00FF00);
    gfx.drawRect(0, 0, 200, 200);
    gfx.pivot.set(100, 100);
    gfx.position.set(300, 300);
    gfx.endFill();
    scene.stage.pixiObj.addChild(gfx);
    let tokens = 0;
    gfx.addComponent(new GenericComponent('').doOnMessage('TOKEN', () => tokens++));
    gfx.addComponent(new ChainingComponent()
      .beginRepeat(2)
      .addComponentAndWait(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += 0.1 * delta).setTimeout(500))
      .addComponentAndWait(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation -= 0.1 * delta).setTimeout(500))
      .addComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => gfx.rotation += 0.01 * delta).setTimeout(1000).doOnFinish((cmp) => cmp.sendMessage('TOKEN')))
      .waitForMessage('TOKEN')
      .endRepeat()
      .execute((cmp) => {
        onFinish('Chain component repeat test', tokens === 2 ? 'OK' : 'FAILURE', tokens === 2);
      })
    );

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let tokens = 0;
    let whileTokens = 0;
    scene.addGlobalComponent(new ChainingComponent()
      .beginIf(() => false)
      .execute(() => tokens = -10)
      .else()
      .execute(() => tokens++)
      .endIf()
      .beginIf(() => true)
      .execute(() => tokens++)
      .else()
      .execute(() => tokens = -10)
      .endIf()
      .beginWhile(() => whileTokens <= 10)
      .execute(() => whileTokens++)
      .endWhile()
      .execute((cmp) => {
        onFinish('Chain component repeat test 2', tokens === 2 ? 'OK' : 'FAILURE', tokens === 2);
      })
    );

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class ChainComponentTest3 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let finished = false;
    scene.addGlobalComponent(new ChainingComponent()
      .waitForMessage('TOKEN')
      .execute((cmp) => {
        finished = true;
        onFinish('Chain component repeat test 3', 'OK', true);
      })
    );

    scene.invokeWithDelay(2000, () => {
      scene.sendMessage(new Message('TOKEN', null, null));
      scene.invokeWithDelay(1000, () => {
        if(!finished) {
          onFinish('Chain component repeat test 3', 'TIMEOUT', false);
        }
      });
    });
    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class BuilderTest extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let builder = new PIXIBuilder(scene);
    builder.withComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => cmp.owner.pixiObj.rotation += 0.0001 * delta * cmp.owner.id));
    builder.anchor(0.5, 0.5);

    let finishedComponents = 0;
    builder.withComponent(() => new GenericComponent('').setTimeout(Math.random() * 3000).doOnFinish(() => {
      finishedComponents++;
      if(finishedComponents === 100) {
        // we have all
        onFinish('Builder test', 'OK', true);
      }
    }));

    for(let i =0; i<100; i++) {
      builder.globalPos(Math.random() * WIDTH, Math.random() * HEIGHT);
      builder.asText('', 'Hello', new PIXI.TextStyle({
        fontSize: 35,
        fill: '#F00'
      })).withParent(scene.stage).build(false);
    }

    // safety check
    scene.invokeWithDelay(5000, () => {
      if(finishedComponents !== 100) {
        onFinish('Builder test', 'TIMEOUT', false);
      }
    });

    this.loop(scene, ticker);
  }
}
// ============================================================================================================
class BuilderTest2 extends BaseTest {
  executeTest(scene: Scene, ticker: Ticker, onFinish: (test: string, result: string, success: boolean) => void) {
    let builder = new PIXIBuilder(scene);
    builder.withChild(
      new PIXIBuilder(scene)
      .localPos(100, 100)
      .asText('text', 'CHILD1', new PIXI.TextStyle({fontSize: 35, fill: '#0F0'}))
    ).withChild(
      new PIXIBuilder(scene)
      .localPos(-100, -100)
      .asText('text', 'CHILD2', new PIXI.TextStyle({fontSize: 35, fill: '#00F'}))
    );
    builder.asText('text', 'PARENT', new PIXI.TextStyle({fontSize: 80, fill: '#F00'}))
    builder.withComponent(() => new GenericComponent('').doOnUpdate((cmp, delta, absolute) => cmp.owner.pixiObj.rotation += 0.001*delta));
    builder.anchor(0.5, 0.5);
    builder.localPos(WIDTH/2, HEIGHT/2).withParent(scene.stage).build();

    scene.invokeWithDelay(2000, () => {
      let objects = scene.findObjectsByName('text');
      if(objects.length === 3 && objects.filter(obj => obj.pixiObj.parent.name === 'text').length === 2) {
        onFinish('Builder2 test', 'OK', true);
      } else {
        onFinish('Builder2 test', 'FAILURE', false);
      }
    });

    this.loop(scene, ticker);
  }
}

class ComponentTests {
  app: PIXI.Application = null;
  lastTime = 0;
  gameTime = 0;
  scene: Scene = null;
  ticker: PIXI.Ticker = null;
  infoTable: HTMLElement;

  tests = [
    new RotationTest(),
    new FlagTest(),
    new TagSearchTest(),
    new TagSearchTest2(),
    new StateSearchTest(),
    new StateSearchTest2(),
    new FlagSearchTest(),
    new ComponentUpdateTest(),
    new ChainComponentTest(),
    new ChainComponentTest2(),
    new ChainComponentTest3(),
    new BuilderTest(),
    new BuilderTest2(),
  ];


  constructor() {
    this.app = new PIXI.Application({
      width: WIDTH,
      height: HEIGHT,
      view: (document.getElementsByTagName('canvas')[0] as HTMLCanvasElement),
    });

    this.infoTable = document.getElementById('info');
    if (!this.infoTable) {
      this.infoTable = document.createElement('table');
      let tr = document.createElement('tr');
      tr.innerHTML = '<th>TEST</<th><th>RESULT</th>';
      this.infoTable.appendChild(tr);
      document.getElementsByTagName('body')[0].appendChild(this.infoTable);
    }

    this.scene = new Scene('default', this.app);
    this.ticker = this.app.ticker;
    this.ticker.autoStart = false;
    this.ticker.stop();
    this.runTests(0);
  }

  private runTests(currentIndex: number) {
    let currentTest = this.tests[currentIndex];
    currentTest.beforeTest(this.scene);
    try {
      let currentIndexTemp = currentIndex;
      this.logPending(currentTest.constructor.name);
      currentTest.executeTest(this.scene, this.ticker, (test: string, result: string, success: boolean) => {
        if (currentIndexTemp !== currentIndex) {
          this.logResult(test, 'ERROR! CALLBACK INVOKED MORE THAN ONCE', false);
          return;
        }
        this.logResult(test, result, success);
        currentTest.afterTest(this.scene);
        if ((currentIndex + 1) < this.tests.length) {
          this.runTests(currentIndex + 1);
        } else {
          currentIndex = 0;
        }
      });
    } catch (error) {
      console.log(error.stack);
      this.logResult(currentTest.constructor.name, error, false);
      if ((currentIndex + 1) < this.tests.length) {
        this.runTests(currentIndex + 1);
      } else {
        currentIndex = 0;
      }
    }
  }

  private logPending(test: string) {
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${test}</td><td>PENDING</td>`;
    this.infoTable.appendChild(tr);
  }

  private logResult(test: string, result: string, success: boolean) {
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${test}</td><td class="${success ? 'success' : 'failure'}">${result}</td>`;
    this.infoTable.lastChild.remove();
    this.infoTable.appendChild(tr);
  }
}

export default ComponentTests;