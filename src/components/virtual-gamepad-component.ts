import { KeyInputComponent, Keys } from './key-input-component';
import { Graphics } from '../engine/game-object';
import { interaction } from 'pixi.js';


export enum GamepadButtons {
  UP, DOWN, RIGHT, LEFT, X, Y, A, B
}

/**
 * Gamepad-keyboard mapper
 */
export interface GamepadKeyMapper {
  KEY_UP?: Keys;
  KEY_DOWN?: Keys;
  KEY_LEFT?: Keys;
  KEY_RIGHT?: Keys;
  KEY_A?: Keys;
  KEY_B?: Keys;
  KEY_X?: Keys;
  KEY_Y?: Keys;
}

/**
 * Component that simulates gamepad, is mapped to keyboard events
 */
export class VirtualGamepadComponent extends KeyInputComponent {

  private gamePadRenderer: Graphics;
  private buttons: PIXI.Rectangle[];
  private pressedButtons = new Map<number, GamepadButtons>();
  private keyMapper: GamepadKeyMapper;

  constructor(mapper: GamepadKeyMapper) {
    super();
    this._name = KeyInputComponent.name; // simulates key input component
    this.keyMapper = mapper;
  }

  onInit() {
    let w = this.scene.app.screen.width;
    let h = this.scene.app.screen.height;
    let circX = w*0.15;
    let circX2 = w*0.85;
    let circY = h*0.75;
    // TODO make it configurable
    let cSize = h*0.14;
    let buttonSize = cSize/1.8;

    this.buttons = [
      new PIXI.Rectangle(circX - buttonSize/2, circY - buttonSize/2 - buttonSize, buttonSize, buttonSize), // UP
      new PIXI.Rectangle(circX - buttonSize/2, circY - buttonSize/2 + buttonSize, buttonSize, buttonSize), // DOWN
      new PIXI.Rectangle(circX - buttonSize/2 - buttonSize, circY - buttonSize/2, buttonSize, buttonSize), // LEFT
      new PIXI.Rectangle(circX - buttonSize/2 + buttonSize, circY - buttonSize/2, buttonSize, buttonSize), // RIGHT
      new PIXI.Rectangle(circX2 - buttonSize/2, circY - buttonSize/2 - buttonSize, buttonSize, buttonSize), // yellow -> B
      new PIXI.Rectangle(circX2 - buttonSize/2, circY - buttonSize/2 + buttonSize, buttonSize, buttonSize), // red -> Y
      new PIXI.Rectangle(circX2 - buttonSize/2 - buttonSize, circY - buttonSize/2, buttonSize, buttonSize), // green -> A
      new PIXI.Rectangle(circX2 - buttonSize/2 + buttonSize, circY - buttonSize/2, buttonSize, buttonSize), // blue -> X
    ];

    // create a new object and inject it into the scene
    this.gamePadRenderer = new Graphics('gamepad');
    this.gamePadRenderer.beginFill(0x444444, 0.5);
    // draw the first joystick
    this.gamePadRenderer.drawCircle(circX, circY, cSize);
    this.gamePadRenderer.drawRect(circX - buttonSize/2, circY - buttonSize/2, buttonSize, buttonSize);
    this.gamePadRenderer.drawRect(this.buttons[0].x, this.buttons[0].y, this.buttons[0].width, this.buttons[0].height);
    this.gamePadRenderer.drawRect(this.buttons[1].x, this.buttons[1].y, this.buttons[1].width, this.buttons[1].height);
    this.gamePadRenderer.drawRect(this.buttons[2].x, this.buttons[2].y, this.buttons[2].width, this.buttons[2].height);
    this.gamePadRenderer.drawRect(this.buttons[3].x, this.buttons[3].y, this.buttons[3].width, this.buttons[3].height);
    this.gamePadRenderer.beginFill(0xAAAAAA, 0.5);
    this.gamePadRenderer.drawPolygon([circX, circY - buttonSize*1.3, circX + buttonSize/3, circY - buttonSize/1.5, circX - buttonSize/3, circY - buttonSize/1.5]);
    this.gamePadRenderer.drawPolygon([circX, circY + buttonSize*1.3, circX + buttonSize/3, circY + buttonSize/1.5, circX - buttonSize/3, circY + buttonSize/1.5]);
    this.gamePadRenderer.drawPolygon([circX + buttonSize*1.3, circY, circX + buttonSize/1.5, circY - buttonSize/3, circX + buttonSize/1.5, circY + buttonSize/3]);
    this.gamePadRenderer.drawPolygon([circX - buttonSize*1.3, circY, circX - buttonSize/1.5, circY - buttonSize/3, circX - buttonSize/1.5, circY + buttonSize/3]);

    // draw the second joystick
    this.gamePadRenderer.beginFill(0x444444, 0.5);
    this.gamePadRenderer.drawCircle(circX2, circY, cSize);
    this.gamePadRenderer.beginFill(0xFFFF00, 0.2);
    this.gamePadRenderer.drawCircle(circX2, circY - buttonSize, buttonSize/1.8);
    this.gamePadRenderer.beginFill(0xFF0000, 0.2);
    this.gamePadRenderer.drawCircle(circX2, circY + buttonSize, buttonSize/1.8);
    this.gamePadRenderer.beginFill(0x00FF00, 0.2);
    this.gamePadRenderer.drawCircle(circX2 - buttonSize, circY, buttonSize/1.8);
    this.gamePadRenderer.beginFill(0x0000FF, 0.2);
    this.gamePadRenderer.drawCircle(circX2 + buttonSize, circY, buttonSize/1.8);

    this.gamePadRenderer.endFill();
    this.gamePadRenderer.on('touchstart', this.pointerDown);
    this.gamePadRenderer.on('touchend', this.pointerUp);
    this.gamePadRenderer.on('touchendoutside', this.pointerUp);
    this.gamePadRenderer.on('touchcancel', this.pointerUp);
    this.gamePadRenderer.on('touchmove', this.pointerMove);
    this.gamePadRenderer.interactive = true;
    this.owner.asContainer().sortableChildren = true;
    this.gamePadRenderer.zIndex = 1000;
    this.owner.asContainer().addChild(this.gamePadRenderer);
  }

  onRemove() {
    this.gamePadRenderer.removeListener('touchstart', this.pointerDown);
    this.gamePadRenderer.removeListener('touchend', this.pointerUp);
    this.gamePadRenderer.removeListener('touchendoutside', this.pointerUp);
    this.gamePadRenderer.removeListener('touchcancel', this.pointerUp);
    this.gamePadRenderer.removeListener('touchmove', this.pointerMove);
  }

  onUpdate(delta: number, absolute: number) {
    this.keys.clear();

    for(let [, btn] of this.pressedButtons ) {
      if(btn === GamepadButtons.UP && this.keyMapper.KEY_UP) {
        this.keys.add(this.keyMapper.KEY_UP);
      }
      if(btn === GamepadButtons.DOWN && this.keyMapper.KEY_DOWN) {
        this.keys.add(this.keyMapper.KEY_DOWN);
      }
      if(btn === GamepadButtons.LEFT && this.keyMapper.KEY_LEFT) {
        this.keys.add(this.keyMapper.KEY_LEFT);
      }
      if(btn === GamepadButtons.RIGHT && this.keyMapper.KEY_RIGHT) {
        this.keys.add(this.keyMapper.KEY_RIGHT);
      }
      if(btn === GamepadButtons.X && this.keyMapper.KEY_X) {
        this.keys.add(this.keyMapper.KEY_X);
      }
      if(btn === GamepadButtons.Y && this.keyMapper.KEY_Y) {
        this.keys.add(this.keyMapper.KEY_Y);
      }
      if(btn === GamepadButtons.A && this.keyMapper.KEY_A) {
        this.keys.add(this.keyMapper.KEY_A);
      }
      if(btn === GamepadButtons.B && this.keyMapper.KEY_B) {
        this.keys.add(this.keyMapper.KEY_B);
      }
    }
  }

  private getPos(evt: TouchEvent): { posX: number, posY: number } {
    let rect = this.scene.app.view.getBoundingClientRect();
    let res = this.scene.app.renderer.resolution;
    let clientX = evt.changedTouches[0].clientX;
    let clientY = evt.changedTouches[0].clientY;
    return {
      posX: Math.round((clientX - rect.left) / (rect.right - rect.left) * this.scene.app.view.width / res),
      posY: Math.round((clientY - rect.top) / (rect.bottom - rect.top) * this.scene.app.view.height / res)
    };
  }

  private getPressedButton(pos: { posX: number, posY: number }): GamepadButtons {
    if(this.buttons[0].contains(pos.posX, pos.posY)) {
      return GamepadButtons.UP;
    }
    if(this.buttons[1].contains(pos.posX, pos.posY)) {
      return GamepadButtons.DOWN;
    }
    if(this.buttons[2].contains(pos.posX, pos.posY)) {
      return GamepadButtons.LEFT;
    }
    if(this.buttons[3].contains(pos.posX, pos.posY)) {
      return GamepadButtons.RIGHT;
    }
    if(this.buttons[4].contains(pos.posX, pos.posY)) {
      return GamepadButtons.B;
    }
    if(this.buttons[5].contains(pos.posX, pos.posY)) {
      return GamepadButtons.Y;
    }
    if(this.buttons[6].contains(pos.posX, pos.posY)) {
      return GamepadButtons.A;
    }
    if(this.buttons[7].contains(pos.posX, pos.posY)) {
      return GamepadButtons.X;
    }
    return null;
  }


  private pointerDown = (evt: interaction.InteractionEvent) => {
    let id = evt.data.identifier;
    let pressedButton = this.getPressedButton(this.getPos(evt.data.originalEvent as TouchEvent));
    if(pressedButton != null) {
      this.pressedButtons.set(id, pressedButton);
    }
  }

  private pointerUp = (evt: interaction.InteractionEvent) => {
    let id = evt.data.identifier;
    this.pressedButtons.delete(id);
  }

  private pointerMove = (evt: interaction.InteractionEvent) => {
    let id = evt.data.identifier;
    let pressedButton = this.getPressedButton(this.getPos(evt.data.originalEvent as TouchEvent));
    if(pressedButton !== null) {
      this.pressedButtons.set(id, pressedButton);
    } else {
      this.pressedButtons.delete(id);
    }
  }
}