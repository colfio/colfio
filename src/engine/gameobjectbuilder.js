
class GameObjectBuilder {
	constructor(name) {
		this.gameObj = new GameObject(name);
		this.isGlobal = false;
	}

	withSecondaryId(id) {
		this.gameObj.secondaryId = id;
		return this;
	}

	withComponent(cmp) {
		this.gameObj.addComponent(cmp);
		return this;
	}

	withAttribute(key, attr) {
		this.gameObj.addAttribute(key, attr);
		return this;
	}

	withParent(parent) {
		this.parent = parent;
		return this;
	}

	withTransform(trans) {
		this.gameObj.trans = trans;
		return this;
	}

	withPosition(posX, posY) {
		this.gameObj.trans.setPosition(posX, posY);
		return this;
	}

	withRotation(rot, offsetX = 0, offsetY = 0) {
		this.gameObj.trans.rotation = rot;
		this.gameObj.trans.rotationOffsetX = offsetX;
		this.gameObj.trans.rotationOffsetY = offsetY;
		return this;
	}

	withCenteredOrigin() {
		this.gameObj.trans.rotationOffsetX = this.gameObj.mesh.width / 2;
		this.gameObj.trans.rotationOffsetY = this.gameObj.mesh.height / 2;
		return this;
	}

	withZIndex(zIndex) {
		this.gameObj.zIndex = zIndex;
		return this;
	}

	withMesh(mesh) {
		this.gameObj.mesh = mesh;
		return this;
	}

	asGlobal() {
		this.isGlobal = true;
		return this;
	}

	build(scene) {
		if (this.isGlobal || this.parent == null) {
			scene.addGlobalGameObject(this.gameObj);
		} else {
			this.parent.addGameObject(this.gameObj);
		}

		return this.gameObj;
	}
}