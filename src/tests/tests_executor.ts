import { PIXICmp } from '../engine/pixi-object';
import Scene from '../engine/Scene';
import ChainingComponent from '../components/chaining-component';
import { tests, assert } from '../utils/tinytest';
import {RotationAnim, MovingAnim} from './testcomponents';
import { Message } from '../engine/message';

export default function runTests() {

    // init component microengine
    const scene = new Scene(new PIXI.Application({resolution: 100}));
    
    tests({
        'ChainingComponent execute': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let param = 0;

            let executor = new ChainingComponent()
                .execute(() => param = 1)
                .execute(() => assert(param == 1, "Wrong parameter value"));

            obj.addComponent(executor);

            let counter = 0;
            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }
        },
        'ChainingComponent repeat test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let repeatCounter1 = 0;
            let repeatCounter2 = 0;

            let executor = new ChainingComponent()
                .beginRepeat(3) // via literal
                .execute(() => repeatCounter1++)
                .endRepeat()
                .execute(() => assert(repeatCounter1 == 3, "Wrong counter value"))
                .beginRepeat(() => 3) // via function
                .execute(() => repeatCounter2++)
                .endRepeat()
                .execute(() => assert(repeatCounter2 == 3, "Wrong counter value"));

            obj.addComponent(executor);

            let counter = 0;
            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }
        },

        'ChainingComponent while test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let param = 3;
            let execCounter = 0;

            let executor = new ChainingComponent()
                .beginWhile(() => param > 0)
                .execute(() => param--)
                .execute(() => execCounter++)
                .endWhile()
                .execute(() => assert(param == 0, "Wrong parameter value : " + param + ", expected 0"))
                .execute(() => assert(execCounter == 3, "While should have be called 3x"));

            obj.addComponent(executor);

            let counter = 0;
            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }
        },

        'ChainingComponent interval by literal test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let intervalCntr = 0;
            let counter = 0;

            let executor = new ChainingComponent()
                .beginInterval(3) // via literal
                .execute(() => {
                    if (intervalCntr == 0) {
                        // first loop -> check if the time matches
                        assert(Math.floor(counter) == 3, "Method executed in a different time than expected");
                    }
                })
                .execute(() => intervalCntr++)
                .execute((cmp) => {
                    // finish after 3 rounds
                    if (intervalCntr >= 3) cmp.finish();
                })
                .endInterval()

            obj.addComponent(executor);


            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }
        },

        'ChainingComponent interval by function test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let currentInterval = 4;
            let intervalCntr = 0;
            let counter = 0;

            let executor = new ChainingComponent()
                .beginInterval(() => currentInterval) // via function
                .execute(() => {
                    switch (intervalCntr) {
                        case 0:
                            assert(Math.floor(counter) == 4, "Method executed in a different time than expected");
                            break;
                        case 1:
                            assert(Math.floor(counter) == 7, "Method executed in a different time than expected");
                            break;
                        case 2:
                            assert(Math.floor(counter) == 9, "Method executed in a different time than expected");
                            break;
                    }
                })
                .execute(() => {
                    intervalCntr++;
                    currentInterval--; // decrease the interval with every loop
                })
                .execute((cmp) => {
                    // finish after 3 rounds
                    if (intervalCntr >= 3) cmp.finish();
                })
                .endInterval()

            obj.addComponent(executor);


            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }
        },
        'ChainingComponent if-else test': function () {
            scene.clearScene();

            let rot = new RotationAnim();
            let obj = new PIXICmp.Container("gameObj");
            scene.stage.pixiObj.addChild(obj);
            let prom = 0;
            let prom2 = 0;
            let prom3 = 0;

            let executor = new ChainingComponent()
                .waitTime(3) // execute with a delay				
                .beginIf(() => true)
                .execute(() => prom++)
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .endIf()
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .beginIf(() => false)
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .else()
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .endIf()
                .else()
                .execute(() => prom++)
                .beginRepeat(2)
                .beginRepeat(3)
                .execute((cmp) => prom3++)
                .endRepeat()
                .endRepeat()
                .endIf()
                .else()
                .execute(() => assert(false, "this closure shouldn't be executed!"))
                .endIf()
                .beginRepeat(2)
                .execute(() => {
                    prom++;
                })
                .endRepeat()
                .beginWhile(() => prom2 < 10)
                .execute(() => {
                    prom2++;
                })
                .endWhile()
                .addComponent(rot, obj)
                .waitTime(2)
                .execute(() => rot.finish())
                .waitForFinish(rot)
                .waitUntil(() => {
                    return Math.random() > 0.9;
                })
                .waitFrames(10)
                .execute((cmp) => cmp.scene.invokeWithDelay(2, () => cmp.sendMessage("MOJO")))
                .waitForMessage("MOJO");


            obj.addComponent(executor);

            let counter = 0;
            while (executor.isRunning()) {
                scene._update(0.1, counter);
                counter += 0.1;
            }

            assert(prom == 4, "Wrong value of prom. Some of execute() closure hasn't been called. Expected 4, given " + prom);
            assert(prom2 == 10, "Wrong value of prom2. Expected 10, given " + prom2);
            assert(prom3 == 6, "Wrong value of prom3. Expected 6, given " + prom3);
        },

        'ChainingComponent add component test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let counter = 0;

            let executor = new ChainingComponent()
                .addComponent(new RotationAnim()) // directly
                .addComponent(() => new MovingAnim()) // by function

            obj.addComponent(executor);

            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }

            assert(obj.findComponentByClass("RotationAnim") != null, "Rotation anim is missing");
            assert(obj.findComponentByClass("MovingAnim") != null, "Moving anim is missing");
        },

        'ChainingComponent add component and wait test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);

            let anim = new RotationAnim();
            let anim2 = new MovingAnim();

            let executor = new ChainingComponent()
                .addComponentAndWait(anim) // directly
                .addComponentAndWait(() => anim2) // by function
            obj.addComponent(executor);

            scene._update(0.1, 0.1);
            scene._update(0.1, 0.1);
            anim.finish();
            scene._update(0.1, 0.2);
            assert(obj.findComponentByClass(RotationAnim.constructor.name) == null, "Rotation anim should have been deleted");
            anim2.finish();
            scene._update(0.1, 0.2);
            assert(obj.findComponentByClass(MovingAnim.constructor.name) == null, "MovingAnim should have been deleted");
            scene._update(0.1, 0.2);
            assert(obj.findComponentByClass(ChainingComponent.constructor.name) == null, "ChainingComponentComponent should have been deleted");

        },

        'Wait time test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);

            let prom = 0;

            let executor = new ChainingComponent()
                .waitTime(0.8) // directly
                .execute(() => prom++)
                .waitTime(() => 1.5) // by function
                .execute(() => prom++);


            obj.addComponent(executor);

            scene._update(1, 1);
            scene._update(1, 1);
            assert(prom == 0, "Variable prom should be 0 as the first loop hasn't ended yet");
            scene._update(1, 2);
            assert(prom == 1, "Variable prom should be 1 as the first loop already ended");
            scene._update(1, 3);
            assert(prom == 1, "Variable prom should be 1 as the second loop hasn't ended yet");
            scene._update(1, 4);
            assert(prom == 2, "Variable prom should be 2 as the second loop already ended");

        },

        'Wait for finish test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let anim = new RotationAnim();
            let prom = 0;
            let executor = new ChainingComponent()
                .addComponent(anim)
                .waitForFinish(anim)
                .execute(() => prom++);


            obj.addComponent(executor);

            scene._update(1, 1);
            assert(prom == 0, "Variable prom should be 0 as the animation hasn't ended yet");
            scene._update(1, 2);
            assert(prom == 0, "Variable prom should be 0 as the animation hasn't ended yet");
            scene._update(1, 3);
            assert(prom == 0, "Variable prom should be 0 as the animation hasn't ended yet");
            anim.finish();
            scene._update(1, 4);
            assert(prom == 1, "Variable prom should be 1 as the animation already ended");
            assert(executor.isRunning() !== true, "ChainingComponent should have already finished");
        },

        'Wait until test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let anim = new RotationAnim();
            let prom = 0;
            let executor = new ChainingComponent()
                .addComponent(anim)
                .waitUntil(() => anim.isRunning())
                .execute(() => prom++);


            obj.addComponent(executor);

            scene._update(1, 1);
            assert(prom == 0, "Variable prom should be 0 as the animation hasn't ended yet");
            scene._update(1, 2);
            assert(prom == 0, "Variable prom should be 0 as the animation hasn't ended yet");
            anim.finish();
            scene._update(1, 3);
            assert(prom == 1, "Variable prom should be 1 as the animation already ended");
            assert(executor.isRunning() !== true, "ChainingComponent should have already finished");
        },

        'Wait frames test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let prom = 0;
            let executor = new ChainingComponent()
                .waitFrames(5)
                .execute(() => prom++);

            obj.addComponent(executor);

            scene._update(1, 1);
            scene._update(1, 1);
            assert(prom == 0, "Variable prom should be 0 as the executor shouldn't have gone to the next item");
            scene._update(1, 2);
            assert(prom == 0, "Variable prom should be 0 as the executor shouldn't have gone to the next item");
            scene._update(1, 3);
            assert(prom == 0, "Variable prom should be 0 as the executor shouldn't have gone to the next item");
            scene._update(1, 4);
            assert(prom == 0, "Variable prom should be 0 as the executor shouldn't have gone to the next item");
            scene._update(1, 5);
            assert(prom == 0, "Variable prom should be 0 as the executor shouldn't have gone to the next item");
            scene._update(1, 6);
            assert(prom == 1, "Variable prom should be 1 as the waiting loop already ended");
        },


        'ChainingComponent wait for message test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let counter = 0;
            let prom = 0;

            let executor = new ChainingComponent()
                .waitForMessage("MOJO")
                .execute(() => prom++)
                .waitForMessage("DOJO")
                .execute(() => prom++)

            obj.addComponent(executor);

            scene._update(1, 1);
            assert(prom == 0, "Variable prom should be 0 as it shouldn't have been incremented yet");
            scene._update(1, 2);
            scene.sendMessage(new Message('MOJO'));
            assert(prom == 0, "Variable prom should be 0 as the message has been sent but the scene hasn't been updated yet");
            scene._update(1, 3);
            assert(prom == 1, "Variable prom should be now 1");
            scene._update(1, 4);
            assert(prom == 1, "Variable prom should be 1 as it shouldn't have been incremented yet");
            scene.sendMessage(new Message('DOJO'));
            scene._update(1, 5);
            assert(prom == 2, "Variable prom should be 2 as the message has been already sent");
        },

        'ChainingComponent remove component test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let counter = 0;

            let executor = new ChainingComponent()
                .addComponent(new RotationAnim())
                .waitTime(0.5)
                .removeComponent("RotationAnim");

            obj.addComponent(executor);

            scene._update(1, 1);
            scene._update(1, 1);
            assert(obj.findComponentByClass("RotationAnim") != null, "Rotation anim is missing");
            scene._update(1, 2); // will be added into a collection for removal
            scene._update(1, 3); // will be removed
            assert(obj.findComponentByClass("RotationAnim") == null, "Rotation anim should be deleted");
        },

        'ChainingComponent remove game object by tag test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            let obj2 = new PIXICmp.Container("testObject2");
            scene.stage.pixiObj.addChild(obj);
            scene.stage.pixiObj.addChild(obj2);
            let counter = 0;

            let executor = new ChainingComponent()
                .waitTime(1)
                .removeGameObjectByTag("testObject2");

            obj.addComponent(executor);

            scene._update(1, 1); // will add executor to the game, but will not execut it yet
            assert(scene.findFirstObjectByTag("testObject2") != null, "The object shouldn't be deleted yet");
            scene._update(1.5, 2.5); // will add the object into a collection for removal
            assert(scene.findFirstObjectByTag("testObject2") != null, "The object shouldn't be deleted yet");
            scene._update(2, 4); // will remove the object
            assert(scene.findFirstObjectByTag("testObject2") == null, "The object should have been already deleted");
        },

        'ChainingComponent remove game object test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            let obj2 = new PIXICmp.Container("testObject2");
            scene.stage.pixiObj.addChild(obj);
            scene.stage.pixiObj.addChild(obj2);
            let counter = 0;

            let executor = new ChainingComponent()
                .waitTime(1)
                .removeGameObject(obj2);

            obj.addComponent(executor);

            scene._update(1, 1); // will add executor to the game
            assert(scene.findFirstObjectByTag("testObject2") != null, "The object shouldn't be deleted yet");
            scene._update(1.5, 2.5); // will add the object into a collection for removal
            assert(scene.findFirstObjectByTag("testObject2") != null, "The object shouldn't be deleted yet");
            scene._update(2, 4); // will remove the object
            assert(scene.findFirstObjectByTag("testObject2") == null, "The object should have been already deleted");
        },

        'ChainingComponent remove previous test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let counter = 0;
            let prom = 0;
            let executor = new ChainingComponent()
                .beginRepeat(3)
                .execute(() => prom++)
                .execute(() => prom++)
                .execute(() => prom++)
                .removePrevious() // will remove one execute() with every loop -> 3+2+1 run
                .endRepeat()


            obj.addComponent(executor);

            while (executor.isRunning()) { // simulate game loop
                scene._update(0.1, counter);
                counter += 0.1;
            }

            assert(prom == 6, "Unexpected value of the variable prom, expected 6, got " + prom);
        },

        'ChainingComponent instant test': function () {
            scene.clearScene();
            let obj = new PIXICmp.Container("testObject");
            scene.stage.pixiObj.addChild(obj);
            let prom = 0;

            let executor = new ChainingComponent()
                .execute(() => prom++)
                .execute(() => prom++)
                .waitFrames(0)
                .waitTime(0)
                .beginIf(() => true)
                .execute(() => prom++)
                .endIf()

            obj.addComponent(executor);

            scene._update(1, 1); // will add executor to the game
            scene._update(1, 2); // will do one-step update
            assert(prom == 2, "Unexpected number of execute() calls. Expected 2, got " + prom);

        },

    });
}

