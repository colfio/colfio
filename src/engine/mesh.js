

class Mesh {
	constructor(width, height) {
		/**
         * Alpha value 
         * @type {number}
         */
		this.alpha = 1.0;
		/**
         * Relative width of the mesh 
         * @type {number}
         */
		this.width = width;
		/**
         * Relative height of the mesh
         * @type {number}
         */
		this.height = height;
	}

	_updateTransform(trans) {
		// override where necessary
	}
}

class RectMesh extends Mesh {
	constructor(fillStyle, width, height) {
		super(width, height);
		/**
         * HTML5-Canvas fillstyle
         * @type {string}
         */
		this.fillStyle = fillStyle;
	}
}

class TextMesh extends Mesh {
	constructor(text = "", font = "24px Verdana", fillStyle, width, height) {
		super(width, height);
		/**
         * HTML5-Canvas fillstyle
         * @type {string}
         */
		this.fillStyle = fillStyle;
		/**
         * HTML5-Canvas font
         * @type {string}
         */
		this.font = font;
		/**
         * Text content
         * @type {string}
         */
		this.text = text;
		/**
         * Text alignment
         * @type {string}
         */
		this.textAlign = "left";
	}
}

class ImageMesh extends Mesh {
	constructor(image) {
		super(image.width / UNIT_SIZE, image.height / UNIT_SIZE);
		/**
         * Texture mage
         * @type {HTML5ImageElement}
         */
		this.image = image;
	}
}

class SpriteMesh extends Mesh {
	constructor(offsetX, offsetY, width, height, image) {
		super(width, height);

		/**
         * X axis offset of the sprite in the texture in PX
         * @type {number}
         */
		this.offsetX = offsetX;
		/**
         * Y axis offset of the sprite in the texture in PX
         * @type {number}
         */
		this.offsetY = offsetY;
		/**
         * Sprite mage
         * @type {HTML5ImageElement}
         */
		this.image = image;
	}
}

class MultiSprite extends SpriteMesh {
	constructor(id, trans, offsetX, offsetY, width, height, image) {
		super(offsetX, offsetY, width, height, image);
		/**
         * Identifier
         * @type {number}
         */
		this.id = id;
		/**
         * Transformation entity
         * @type {Trans}
         */
		this.trans = trans;
	}

	_updateTransform(parentTrans) {
		super._updateTransform(parentTrans);
		this.trans._updateTransform(parentTrans);
	}
}

class MultiSpriteCollection extends Mesh {
	constructor(atlas) {
		super(1, 1);
		/**
         * Sprite atlas
         * @type {HTML5ImageElement}
         */
		this.atlas = atlas;
		/**
         * Collection of sprites
         * @type {Map<number, MultiSprite>}
         */
		this.sprites = new Map();
	}

	addSprite(sprite) {
		if (!sprite instanceof MultiSprite) {
			throw new Error("Sprite must be instance of MultiSprite class");
		}

		this.sprites.set(sprite.id, sprite);
	}

	/* TODO bbox was moved to the GameObject!!
	_updateTransform(parentTrans) {
		super._updateTransform(parentTrans);

		for (let sprite of this.sprites) {
			sprite.trans._updateTransform(parentTrans);

			this.bbox.topLeftX = Math.min(this.bbox.topLeftX, sprite.bbox.topLeftX);
			this.bbox.topLeftY = Math.min(this.bbox.topLeftY, sprite.bbox.topLeftY);
			this.bbox.bottomRightX = Math.max(this.bbox.bottomRightX, sprite.bbox.bottomRightX);
			this.bbox.bottomRightY = Math.max(this.bbox.bottomRightY, sprite.bbox.bottomRightY);
		}

		let size = this.bbox.getSize().width;
		this.width = size.width;
		this.height = size.height;
	}*/
}

