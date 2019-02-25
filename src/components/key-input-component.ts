import Component from '../engine/component';

export enum Keys {
  KEY_LEFT = 37,
  KEY_UP = 38,
  KEY_RIGHT = 39,
  KEY_DOWN = 40,
  KEY_X = 88,
  KEY_U = 85,
  KEY_I = 73
}

/**
 * Component for key-input handling
 */
export class KeyInputComponent extends Component {

  private keys = new Set<number>();

  constructor() {
    super();
    this._name = KeyInputComponent.name;
  }

  onInit() {
    document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
  }

  onRemove() {
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
  }

  isKeyPressed(keyCode: number) {
    return this.keys.has(keyCode);
  }

  private onKeyDown(evt: KeyboardEvent) {
    this.keys.add(evt.keyCode);
  }

  private onKeyUp(evt: KeyboardEvent) {
    this.keys.delete(evt.keyCode);
  }
}