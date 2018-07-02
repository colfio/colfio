// Bounding box
class BBox {
	constructor(topLeftX = 0, topLeftY = 0, bottomRightX = 0, bottomRightY = 0) {
		/**
         * TopLeft absolute coordinate on X axis
         * @type {number}
         */
		this.topLeftX = topLeftX;
		/**
         * TopLeft absolute coordinate on Y axis
         * @type {number}
         */
		this.topLeftY = topLeftY;
		/**
         * BottomRight coordinate on X axis
         * @type {number}
         */
		this.bottomRightX = bottomRightX;
		/**
         * BottomRight coordinate on Y axis
         * @type {number}
         */
		this.bottomRightY = bottomRightY;
	}

	getSize() {
		return { width: (this.bottomRightX - this.topLeftX), height: (this.bottomRightY - this.topLeftY) };
	}

	getCenter() {
		let size = this.getSize();
		return { posX: (this.topLeftX + size.width / 2), posY: (this.topLeftY + size.height / 2) };
	}

	intersects(other, tolerance = 0) {
		return this.horizontalIntersection(other) >= -tolerance && this.verticalIntersection(other) >= -tolerance;
	}

	horizontalIntersection(other) {
		return Math.min(other.bottomRightX, this.bottomRightX) - Math.max(other.topLeftX, this.topLeftX);
	}

	verticalIntersection(other) {
		return Math.min(other.bottomRightY, this.bottomRightY) - Math.max(other.topLeftY, this.topLeftY);
	}

	update(trans, mesh) {
		if (trans.absRotation != 0) {
			let boxWidth = mesh.width * Math.abs(Math.cos(trans.absRotation)) + mesh.height * Math.abs(Math.sin(trans.absRotation));
			let boxHeight = mesh.height * Math.abs(Math.cos(trans.absRotation)) + mesh.width * Math.abs(Math.sin(trans.absRotation));

			let parentTrans = trans;

			let absPosX = parentTrans.absPosX - parentTrans.rotationOffsetX + mesh.width / 2;
			let absPosY = parentTrans.absPosY - parentTrans.rotationOffsetY + mesh.height / 2;
			let distX = (absPosX - parentTrans.absPosX);
			let distY = (absPosY - parentTrans.absPosY);
			let length = Math.sqrt(distX * distX + distY * distY);

			let angle = parentTrans.absRotation + Math.atan2(distY, distX);
			let rotPosX = length * Math.cos(angle);
			let rotPosY = length * Math.sin(angle);

			absPosX = parentTrans.absPosX + rotPosX;
			absPosY = parentTrans.absPosY + rotPosY;

			this.topLeftX = absPosX - boxWidth / 2;
			this.topLeftY = absPosY - boxHeight / 2;
			this.bottomRightX = this.topLeftX + boxWidth;
			this.bottomRightY = this.topLeftY + boxHeight;
		} else {
			this.topLeftX = trans.absPosX - trans.rotationOffsetX;
			this.topLeftY = trans.absPosY - trans.rotationOffsetY;
			this.bottomRightX = this.topLeftX + mesh.width;
			this.bottomRightY = this.topLeftY + mesh.height;
		}
	}
}