// Rendering component that can render any mesh
class BasicRenderer extends Component {

    draw(ctx) {
        let mesh = this.owner.mesh;
        let alpha = ctx.globalAlpha;

        ctx.globalAlpha = mesh.alpha;
        if (mesh instanceof RectMesh) {
            this._drawRectMesh(ctx, mesh);
        } else if (mesh instanceof TextMesh) {
            this._drawTextMesh(ctx, mesh);
        } else if (mesh instanceof ImageMesh) {
            this._drawImageMesh(ctx, mesh);
        } else if (mesh instanceof SpriteMesh) {
            this._drawSpriteMesh(ctx, mesh, this.owner.trans);
        } else if (mesh instanceof MultiSprite) {
            throw new Error("MultiSprite cannot be used directly. Put it into a MultiSpriteCollection instead");
        } else if (mesh instanceof MultiSpriteCollection) {
            this._drawMultiSpriteMesh(ctx, mesh);
        } else {
            throw new Error("Not supported mesh type");
        }
        ctx.globalAlpha = alpha;
    }

    _drawRectMesh(ctx, mesh) {
        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        let fillStyle = ctx.fillStyle;
        ctx.fillStyle = mesh.fillStyle;
        ctx.fillRect(-originX, -originY, mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE);
        ctx.fillStyle = fillStyle;
        ctx.rotate(-trans.absRotation);
        ctx.translate(-(posX), -(posY));
    }

    _drawTextMesh(ctx, mesh) {
        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        let fillStyle = ctx.fillStyle;
        let textAlign = ctx.textAlign;
        ctx.fillStyle = mesh.fillStyle;
        ctx.textAlign = mesh.textAlign;
        ctx.font = mesh.font;
        ctx.fillText(mesh.text, -originX, -originY);
        ctx.fillStyle = fillStyle;
        ctx.textAlign = textAlign;
        ctx.rotate(-trans.absRotation);
        ctx.translate(-(posX), -(posY));
    }

    _drawImageMesh(ctx, mesh) {
        let trans = this.owner.trans;
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        ctx.drawImage(mesh.image, 0, 0, mesh.image.width, mesh.image.height, -originX, -originY, mesh.image.width, mesh.image.height);
        ctx.rotate(-trans.absRotation);
        ctx.translate(-(posX), -(posY));
    }

    _drawSpriteMesh(ctx, mesh, trans) {
        let posX = trans.absPosX * UNIT_SIZE;
        let posY = trans.absPosY * UNIT_SIZE;
        let originX = trans.rotationOffsetX * UNIT_SIZE;
        let originY = trans.rotationOffsetY * UNIT_SIZE;
        ctx.translate(posX, posY);
        ctx.rotate(trans.absRotation);
        ctx.drawImage(mesh.image, mesh.offsetX, mesh.offsetY,
            mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE, -originX, -originY, mesh.width * UNIT_SIZE, mesh.height * UNIT_SIZE);
        ctx.rotate(-trans.absRotation);
        ctx.translate(-posX, -posY);
    }

    _drawMultiSpriteMesh(ctx, mesh) {
        for (let [id, sprite] of mesh.sprites) {
            this.drawSpriteMesh(ctx, sprite, sprite.trans);
        }
    }
}
