import Component from '../engine/component';
import Message from '../engine/message';
import { Messages } from '../engine/constants';

/**
 * Component that consists of a list of inner components
 */
export default class ComposingComponent extends Component {

  // components mapped by their id
  private components = new Map<number, Component>();
  private componentsToAdd = new Array<Component>();

  constructor(...components: Component[]) {
    super();
    for (let cmp of components) {
      this.addComponent(cmp);
    }
  }

  addComponent(cmp: Component) {
    this.componentsToAdd.push(cmp);
  }

  onInit() {
    this.subscribe(Messages.COMPONENT_REMOVED);
    for (let [, cmp] of this.components) {
      cmp.onInit();
    }
  }

  onMessage(msg: Message) {
    // remove component from the collection
    if (msg.action === Messages.COMPONENT_REMOVED) {
      if (this.components.has(msg.component.id)) {
        this.components.delete(msg.component.id);
      }
    }

    // no need to call onMessage upon inner components as they can subscribe directly
  }

  onRemove() {
    for (let [, cmp] of this.components) {
      cmp.onRemove();
    }
  }

  onUpdate(delta: number, absolute: number) {
    // add new components
    if (this.componentsToAdd.length !== 0) {
      for (let cmp of this.componentsToAdd) {
        this.components.set(cmp.id, cmp);
        cmp.owner = this.owner;
        cmp.scene = this.scene;
        cmp.onInit();
      }
      this.componentsToAdd = new Array<Component>();
    }

    // update components
    for (let [, cmp] of this.components) {
      cmp.onUpdate(delta, absolute);
    }
  }

  onFinish() {
    for (let [, cmp] of this.components) {
      cmp.finish();
    }
  }
}