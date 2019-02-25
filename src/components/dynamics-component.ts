import { Attributes } from '../engine/constants';
import Dynamics from '../utils/dynamics';
import Component from '../engine/component';

/**
 * Component that updates position of an object
 */
export default class DynamicsComponent extends Component {

  protected dynamics: Dynamics;
  protected gameSpeed: number;

  constructor(gameSpeed: number = 1) {
    super();
    this.gameSpeed = gameSpeed;
  }

  onInit() {
    this.dynamics = this.owner.getAttribute(Attributes.DYNAMICS);
    if (this.dynamics == null) {
      // add an initial one
      this.dynamics = new Dynamics();
      this.owner.addAttribute(Attributes.DYNAMICS, this.dynamics);
    }
  }

  onUpdate(delta: number, absolute: number) {
    this.dynamics.applyVelocity(delta, this.gameSpeed);

    // calculate delta position
    let deltaPos = this.dynamics.calcPositionChange(delta, this.gameSpeed);
    this.owner.pixiObj.position.x += deltaPos.x;
    this.owner.pixiObj.position.y += deltaPos.y;

  }
}