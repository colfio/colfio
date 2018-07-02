class Animation extends Component {
    // loops = 0 for infinite!
    constructor(duration, goBack = false, loops = 1) {
        super();
        this.duration = duration;
        this.goBack = goBack;
        this.goingBack = false;
        this.loops = loops;
        this.currentLoop = 0;
        this.startTime = 0;

        this.interpolation = Interpolation.linear;
    }

    update(delta, absolute) {
        if (this.startTime == 0) {
            this.startTime = absolute;
        }

        if (!this.goingBack) {
            // going forward
            let percent = this.interpolation(absolute, this.startTime, this.duration);
            this._applyAnim(percent, false);

            if (percent >= 1) {
                if (this.goBack) {
                    this.goingBack = true;
                    this.startTime = absolute;
                } else {
                    this.finish();
                }
            }
        } else {
            // going back (only if goBack == true)
            let percent = this.interpolation(absolute, this.startTime, this.duration);
            this._applyAnim(percent, true);

            if (percent >= 1) {
                if (++this.currentLoop != this.loops) {
                    this.goingBack = !this.goingBack;
                    this.startTime = absolute;
                } else {
                    this.finish();
                }
            }
        }
    }

    _applyAnim(percent, inverted) {
        // override in child classes
    }
}

class TranslateAnimation extends Animation {
    constructor(srcPosX, srcPosY, targetPosX, targetPosY, duration, goBack = false, loops = 1) {
        super(duration, goBack, loops);
        this.srcPosX = srcPosX;
        this.srcPosY = srcPosY;
        this.targetPosX = targetPosX;
        this.targetPosY = targetPosY;
    }

    oninit() {
        super.oninit();
        this.owner.trans.posX = this.srcPosX;
        this.owner.trans.posY = this.srcPosY;
    }

    _applyAnim(percent, inverted) {
        if (inverted) {
            this.owner.trans.posX = this.targetPosX + percent * (this.srcPosX - this.targetPosX);
            this.owner.trans.posY = this.targetPosY + percent * (this.srcPosY - this.targetPosY);
        } else {
            this.owner.trans.posX = this.srcPosX + percent * (this.targetPosX - this.srcPosX);
            this.owner.trans.posY = this.srcPosY + percent * (this.targetPosY - this.srcPosY);
        }
    }
}

class RotationAnimation extends Animation {
    constructor(srcRot, targetRot, duration, goBack = false, loops = 1) {
        super(duration, goBack, loops);
        this.srcRot = srcRot;
        this.targetRot = targetRot;
    }

    oninit() {
        super.oninit();
        this.owner.trans.rotation = this.srcRot;
    }

    _applyAnim(percent, inverted) {
        if (inverted) {
            this.owner.trans.rotation = this.targetRot + percent * (this.srcRot - this.targetRot);
        } else {
            this.owner.trans.rotation = this.srcRot + percent * (this.targetRot - this.srcRot);
        }
    }
}
