import Component from '../engine/Component';

export class RotationAnim extends Component {
    onUpdate(delta: number, absolute: number) {
        this.owner.getPixiObj().rotation += delta;
    }
}

export class MovingAnim extends Component {
    initPosX = 0;
    initPosY = 0;
    radius = 1;
    onInit() {
        this.initPosX = this.owner.getPixiObj().position.x;
        this.initPosY = this.owner.getPixiObj().position.y;
    }

    onUpdate(delta: number, absolute: number) {
        this.owner.getPixiObj().position.set(this.initPosX + this.radius * Math.cos(absolute),
            this.initPosY + this.radius * Math.sin(absolute));
    }
}