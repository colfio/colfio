import { Attributes } from './../engine/Constants';
import Dynamics from '../utils/Dynamics';
import Component from '../engine/Component';

/**
 * Component that updates position of an object
 */
export class DynamicsComponent extends Component {

    protected dynamics: Dynamics;
    protected gameSpeed: number;

    constructor(gameSpeed: number = 1) {
        super();
        this.gameSpeed = gameSpeed;
    }

    onInit() {
        this.dynamics = this.owner.getAttribute(Attributes.DYNAMICS);
        if(this.dynamics == null){
            // add an initial one
            this.dynamics = new Dynamics();
            this.owner.addAttribute(Attributes.DYNAMICS, this.dynamics);
        }
    }

    onUpdate(delta: number, absolute: number) {
        this.dynamics.applyVelocity(delta, this.gameSpeed);

        // calculate delta position 
        let deltaPos = this.dynamics.calcPositionChange(delta, this.gameSpeed);
        this.owner.getPixiObj().position.x += deltaPos.x;
        this.owner.getPixiObj().position.y += deltaPos.y;

    }
}