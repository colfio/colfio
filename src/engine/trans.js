
// transformation entity
class Trans {
	constructor(posX = 0, posY = 0, rotation = 0, rotationOffsetX = 0, rotationOffsetY = 0) {
		/**
         * Relative position on X axis
         * @type {number}
         */
		this.posX = posX;
		/**
         * Relative position on Y axis
         * @type {number}
         */
		this.posY = posY;
		/**
         * Relative rotation
         * @type {number}
         */
		this.rotation = rotation;
		/**
         * Rotation offset on X axis
         * @type {number}
         */
		this.rotationOffsetX = rotationOffsetX;
		/**
         * Rotation offset on Y axis
         * @type {number}
         */
		this.rotationOffsetY = rotationOffsetY;

		/**
         * Absolute position on X axis
         * @type {number}
         */
		this.absPosX = 0;
		/**
         * Absolute position on Y axis
         * @type {number}
         */
		this.absPosY = 0;
		/**
         * Absolute rotation
         * @type {number}
         */
		this.absRotation = 0;

		this.pendingAbsPosX = null;
		this.pendingAbsPosY = null;
	}

	setPosition(posX, posY) {
		this.posX = posX;
		this.posY = posY;
	}

	changeRotationOffset(rotOffsetX, rotOffsetY) {
		// TODO this works only when rotation is 0 !
		let deltaX = this.rotationOffsetX - rotOffsetX;
		let deltaY = this.rotationOffsetY - rotOffsetY;
		this.posX -= deltaX;
		this.posY -= deltaY;
		this.rotationOffsetX = rotOffsetX;
		this.rotationOffsetY = rotOffsetY;
	}

	clone() {
		let copy = new Trans(this.posX, this.posY, this.rotation, this.rotationOffsetX, this.rotationOffsetY);
		return copy;
	}

	/* TODO work in progress
	setAbsPosition(posX, posY) {
		this.pendingAbsPosX = posX;
		this.pendingAbsPosY = posY;
	}*/

	_updateTransform(parentTrans) {

		if (this.pendingAbsPosX != null && this.pendingAbsPosY != null) {
			// calculate local position from absolute position
			this.absPosX = this.pendingAbsPosX;
			this.absPosY = this.pendingAbsPosY;
			if (parentTrans != null) {
				// TODO!! Abs-to-loc transformations
			} else {
				this.posX = this.absPosX;
				this.posY = this.absPosY;
				this.absRotation = this.rotation;
			}
			this.pendingAbsPosX = null;
			this.pendingAbsPosY = null;
		} else {
			if (parentTrans != null) {

				this.absPosX = this.posX + parentTrans.absPosX;
				this.absPosY = this.posY + parentTrans.absPosY;
				this.absRotation = this.rotation + parentTrans.absRotation;

				if (parentTrans.absRotation != 0) {

					let distX = (this.absPosX - (parentTrans.absPosX));
					let distY = (this.absPosY - (parentTrans.absPosY));

					let length = Math.sqrt(distX * distX + distY * distY);
					// always use atan2 if you don't want to deal with cos/sin freaking signs
					let angle = parentTrans.absRotation + Math.atan2(distY, distX);
					let rotPosX = length * Math.cos(angle);
					let rotPosY = length * Math.sin(angle);
					this.absPosX = parentTrans.absPosX + rotPosX;
					this.absPosY = parentTrans.absPosY + rotPosY;
				}
			} else {
				this.absPosX = this.posX;
				this.absPosY = this.posY;
				this.absRotation = this.rotation;
			}
		}
	}
}
