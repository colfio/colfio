import Component from '../engine/Component';

const INPUT_TOUCH = 1;
const INPUT_DOWN = 1 << 1;
const INPUT_MOVE = 1 << 2;
const INPUT_UP = 1 << 3;

const MSG_TOUCH = "TOUCH";
const MSG_DOWN = "DOWN";
const MSG_MOVE = "MOVE";
const MSG_UP = "UP";

// Component that handles touch and mouse events and transforms them into messages 
// that can be subscribed by any other component
class InputManager extends Component {
    mode = INPUT_TOUCH
    startHandler : (evt: TouchEvent) => void = null;
    endHandler : (evt: TouchEvent) => void = null;
    moveHandler : (evt: TouchEvent) => void = null;
    lastTouch: Touch | MouseEvent = null;

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

    handleStart(evt: TouchEvent | MouseEvent) {
        evt.preventDefault();
        let isTouch = evt instanceof TouchEvent;
        if (isTouch && (evt as TouchEvent).changedTouches.length == 1) {
            // only single-touch
            this.lastTouch = (evt as TouchEvent).changedTouches[0];
        } else {
            this.lastTouch = evt as MouseEvent;
        }

        if (this.mode |= INPUT_DOWN) {
            this.sendmsg(MSG_DOWN, {
                mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
                isTouch: isTouch
            });
        }
    }

    handleMove(evt: TouchEvent) {
        evt.preventDefault();
        let isTouch = typeof (evt.changedTouches) !== "undefined";
        this.sendmsg(MSG_MOVE, {
            mousePos: this.getMousePos(this.scene.canvas, evt, isTouch),
            isTouch: isTouch
        });
    }

    handleEnd(evt: TouchEvent | MouseEvent) {
        evt.preventDefault();
        var posX, posY;
        let isTouch = evt instanceof TouchEvent;
        if (this.lastTouch != null) {
            if (isTouch && (evt as TouchEvent).changedTouches.length == 1) {
                posX = (evt as TouchEvent).changedTouches[0].pageX;
                posY = (evt as TouchEvent).changedTouches[0].pageY;

            } else {
                // mouse
                posX = (evt as MouseEvent).pageX;
                posY = (evt as MouseEvent).pageY;
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
    getMousePos(canvas : HTMLCanvasElement, evt : TouchEvent | MouseEvent, isTouch: boolean) {
        var rect = canvas.getBoundingClientRect();
        let clientX = isTouch ? (evt as TouchEvent).changedTouches[0].clientX : (evt as MouseEvent).clientX;
        let clientY = isTouch ? (evt as TouchEvent).changedTouches[0].clientY : (evt as MouseEvent).clientY;
        return {
            posX: Math.round((clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            posY: Math.round((clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }
}
