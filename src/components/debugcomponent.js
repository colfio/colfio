// Debugging component that renders the whole scene graph
class DebugComponent extends Component {

    constructor(displayBBox, targetHtmlElement) {
        super();
        this.targetHtmlElement = targetHtmlElement; // TODO add something more generic here
        this.strWrapper = {
            str: ""
        };
        this.displayBBox = displayBBox;
    }

    oninit() {
        if (this.owner.parent != null) {
            throw new Error("DebugComponent must be attached to the very root!");
        }

        let originalDraw = this.scene.draw;
        var self = this;

        // subscribe to all messages
        this.subscribe(MSG_ALL);

        if (this.displayBBox == true) {
            this.scene.afterDraw = () => {
                let strokeStyle = self.scene.canvasCtx.strokeStyle;
                self.scene.canvasCtx.beginPath();
                self.scene.canvasCtx.strokeStyle = "red";
                self._drawBoundingBox(self.scene.canvasCtx, self.owner);
                self.scene.canvasCtx.stroke();
                self.scene.canvasCtx.strokeStyle = strokeStyle;
            }
        }
    }

    onmessage(msg) {
        let ownerTag = msg.gameObject != null ? msg.gameObject.tag : "";
        if (typeof (msg.action) == "string") {
            console.log(msg.action + " >> " + ownerTag);
        }
    }

    update(delta, absolute) {
        this.strWrapper.str = "";
        this._processNode(this.owner, this.strWrapper);
        this.targetHtmlElement.innerHTML = this.strWrapper.str;
    }


    _drawBoundingBox(ctx, node) {
        if (node.hasState(STATE_DRAWABLE)) {
            let bb = node.bbox;
            let posX = bb.topLeftX * UNIT_SIZE;
            let posY = bb.topLeftY * UNIT_SIZE;
            let size = bb.getSize();

            if (size.width != 0 && size.height != 0) {
                ctx.rect(posX, posY, size.width * UNIT_SIZE, size.height * UNIT_SIZE);
            }

            ctx.rect(node.trans.absPosX * UNIT_SIZE, node.trans.absPosY * UNIT_SIZE, 10, 10);
        }
        for (let [id, child] of node.children) {
            this._drawBoundingBox(ctx, child);
        }
    }

    _setPadding(padding) {
        let otp = "";
        for (let i = 0; i < padding; i++) {
            otp = otp.concat("&nbsp");
        }
        return otp;
    }

    _processNode(node, strWrapper, padding = 0) {

        // transform:
        strWrapper.str += "<strong><span style=\"color:red\">";
        strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
            `rel:[${node.trans.posX.toFixed(2)},${node.trans.posY.toFixed(2)}]|abs:[${node.trans.absPosX.toFixed(2)},${node.trans.absPosY.toFixed(2)}]|rot: ${node.trans.rotation.toFixed(2)}|z: ${node.zIndex}` +
            "<br>");
        strWrapper.str += "</span></strong>";

        // mesh
        strWrapper.str += "<strong><span style=\"color:purple\">";
        strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
            `size:[${node.mesh.width.toFixed(2)} x ${node.mesh.height.toFixed(2)}]` +
            "<br>");
        strWrapper.str += "</span></strong>";

        // attributes
        for (let [key, attr] of node.attributes) {
            strWrapper.str += "<strong><span style=\"color:red\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) +
                `${key} => ${attr.toString()}` +
                "<br>");
            strWrapper.str += "</span></strong>";
        }

        // components
        for (let cmp of node.components) {
            strWrapper.str += "<span style=\"color:blue\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding + 2) + cmp.constructor.name + "<br>");
            strWrapper.str += "</span>";
        }

        // children
        for (let [id, child] of node.children) {
            strWrapper.str += "<span style=\"color:green\">";
            strWrapper.str = strWrapper.str.concat(this._setPadding(padding) +
                `${child.id}:${child.tag}` + "<br>");
            this._processNode(child, strWrapper, padding + 4);
            strWrapper.str += "</span>";
        }
    }
}