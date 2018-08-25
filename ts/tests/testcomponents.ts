import Component from '../engine/Component';

export class RotationAnim extends Component {
    update(delta, absolute) {
        this.owner.mesh.rotation += delta;
    }
}

export class MovingAnim extends Component {
    initPosX = 0;
    initPosY = 0;
    radius = 1;
    oninit() {
        this.initPosX = this.owner.mesh.position.x;
        this.initPosY = this.owner.mesh.position.y;
    }

    update(delta, absolute) {
        this.owner.mesh.position.set(this.initPosX + this.radius * Math.cos(absolute),
            this.initPosY + this.radius * Math.sin(absolute));
    }
}