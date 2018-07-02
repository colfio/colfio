INPUT_TOUCH = 1;
INPUT_DOWN = 1 << 1;
INPUT_MOVE = 1 << 2;
INPUT_UP = 1 << 3;

MSG_TOUCH = 100;
MSG_DOWN = 101;
MSG_MOVE = 102;
MSG_UP = 103;

// Component that handles touch and mouse events and transforms them into messages 
// that can be subscribed by any other component
class InputManager extends Component {

    constructor(mode = INPUT_TOUCH) {
        super();
        this.mode = mode;
    }

    oninit() {
        this.lastTouch = null;

        let canvas = this.scene.canvas;

        // must be done this way, because we want to
        // remove these listeners while finalization
        this.startHandler = (evt) => {
            this.handleStart(evt);
        };
        this.endHandler = (evt) => {
            this.handleEnd(evt);
        };

        this.moveHandler = (evt) => {
            this.handleMove(evt);
        };

        canvas.addEventListener("touchstart", this.startHandler, false);
        canvas.addEventListener("touchend", this.endHandler, false);
        canvas.addEventListener("mousedown", this.startHandler, false);
        if (this.mode |= INPUT_UP) {
            canvas.addEventListener("mouseup", this.endHandler, false);
        }
        if (this.mode |= INPUT_MOVE) {
            canvas.addEventListener("mousemove", this.moveHandler, false);
            canvas.addEventListener("touchmove", this.moveHandler, false);
        }
    }

    finalize() {
        let canvas = this.scene.canvas;
        canvas.removeEventListener("touchstart", this.startHandler);
        canvas.removeEventListener("touchend", this.endHandler);
        canvas.removeEventListener("mousedown", this.startHandler);
        canvas.removeEventListener("mouseup", this.endHandler);

        if (this.mode |= INPUT_MOVE) {
            canvas.removeEventListener("mousemove", this.moveHandler);
            canvas.removeEventListener("touchmove", this.moveHandler);
        }
    }

    handleStart(evt) {
        evt.preventDefault();
        let isTouch = typeof (evt.changedTouches) !== "undefined";
        if (isTouch && evt.changedTouches.length == 1) {
            // only single-touch
            this.lastTouch = evt.changedTouches[0];
        } else {
            this.lastTouch = evt;
        }

        if (this.mode |= MSG_DOWN) {
            this.sendmsg(MSG_DOWN, {
                mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                isTouch: isTouch
            });
        }
    }

    handleMove(evt) {
        evt.preventDefault();
        let isTouch = typeof (evt.changedTouches) !== "undefined";
        this.sendmsg(MSG_MOVE, {
            mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
            isTouch: isTouch
        });
    }

    handleEnd(evt) {
        evt.preventDefault();
        var posX, posY;
        let isTouch = typeof (evt.changedTouches) !== "undefined";
        if (this.lastTouch != null) {
            if (isTouch && evt.changedTouches.length == 1) {
                posX = evt.changedTouches[0].pageX;
                posY = evt.changedTouches[0].pageY;

            } else {
                // mouse
                posX = evt.pageX;
                posY = evt.pageY;
            }

            // 10px tolerance should be enough
            if (Math.abs(this.lastTouch.pageX - posX) < 10 &&
                Math.abs(this.lastTouch.pageY - posY) < 10) {
                // at last send the message to all subscribers about this event
                if (isTouch) {
                    this.sendmsg(MSG_TOUCH, {
                        mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                        isTouch: isTouch
                    });
                } else {
                    this.sendmsg(MSG_UP, {
                        mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                        isTouch: isTouch
                    });
                }
            }
        }
    }

    // Get the mouse position
    getMousePos(canvas, e, isTouch) {
        var rect = canvas.getBoundingClientRect();
        let clientX = isTouch ? e.changedTouches[0].clientX : e.clientX;
        let clientY = isTouch ? e.changedTouches[0].clientY : e.clientY;
        return {
            posX: Math.round((clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            posY: Math.round((clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }
}
