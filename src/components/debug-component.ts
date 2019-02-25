import Component from '../engine/component';
import GameObjectProxy from '../engine/game-object-proxy';
import { Messages } from '../engine/constants';
import { PIXICmp } from '../engine/pixi-object';
import Message from '../engine/message';

/**
 * Debugging component that display a scene graph
 */
export default class DebugComponent extends Component {
  protected debugElement: HTMLElement = null;
  protected msgElement: HTMLElement = null;

  onInit() {
    this.initDebugWindow();
    // subscribe to all messages
    this.subscribe(Messages.ANY);
  }

  onMessage(msg: Message) {

    // discared common messages from the log
    if([Messages.COMPONENT_ADDED, Messages.COMPONENT_REMOVED, Messages.OBJECT_ADDED, Messages.OBJECT_REMOVED]
      .indexOf(msg.action as any) === -1) {
        let row = document.createElement('tr');
        let cell1 = document.createElement('td');
        let cell2 = document.createElement('td');
        let cell3 = document.createElement('td');
        let cell4 = document.createElement('td');
        cell1.style.color = 'black';
        cell2.style.color = 'red';
        cell3.style.color = 'blue';
        cell4.style.color = 'green';
        cell1.innerText = (this.scene.currentAbsolute / 1000).toFixed(2);
        cell2.innerText = msg.action;
        cell3.innerText = msg.component.name;
        cell4.innerText = msg.gameObject.name;
        row.appendChild(cell1);
        row.appendChild(cell2);
        row.appendChild(cell3);
        row.appendChild(cell4);
        this.msgElement.appendChild(row);
    }

    if(msg.action === Messages.OBJECT_ADDED) {
      this.addGameObject(msg.gameObject);
    } else if(msg.action === Messages.COMPONENT_ADDED) {
      this.addComponent(msg.component, msg.gameObject);
    } else if(msg.action === Messages.COMPONENT_REMOVED) {
      this.removeComponent(msg.component, msg.gameObject);
    } else if(msg.action === Messages.OBJECT_REMOVED) {
      document.getElementById('node_'+msg.gameObject.id).remove();
    }
  }

  onUpdate(delta: number, absolute: number) {
  }

  protected addGameObject(obj: PIXICmp.GameObject) {
    let item = document.createElement('li');
    item.id = this.getObjectId(obj);

    let content = document.createElement('span');
    content.style.color = 'red';
    content.innerText = obj.id + ':' + obj.name;
    item.appendChild(content);

    for(let key of ['components']) {
      let ul = document.createElement('ul');
      ul.id = this.getObjectId(obj) + '_' + key;
      item.appendChild(ul);
    }

    this.debugElement.appendChild(item);
  }

  protected removeGameObject(obj: PIXICmp.GameObject) {
    document.getElementById(this.getObjectId(obj)).remove();
  }

  protected addComponent(cmp: Component, obj: PIXICmp.GameObject) {
    if(document.getElementById(this.getObjectId(obj)) === null) {
      this.addGameObject(obj);
    }
    let cmpSection = document.getElementById(this.getComponentSectionId(obj));
    let cmpList = document.createElement('li');
    let compNode = document.createElement('span');
    compNode.style.color = 'blue';
    cmpList.id = this.getComponentId(cmp);
    cmpSection.appendChild(cmpList);
    cmpList.appendChild(compNode);
    compNode.innerText = cmp.name;
  }

  protected removeComponent(cmp: Component, obj: PIXICmp.GameObject) {
    document.getElementById(this.getComponentId(cmp)).remove();
  }

  protected getObjectId(obj: PIXICmp.GameObject) {
    return `node_` + obj.id;
  }

  protected getObjectInfoSectionId(obj: PIXICmp.GameObject) {
    return 'node_' + obj.id + '_info';
  }

  protected getComponentSectionId(obj: PIXICmp.GameObject) {
    return 'node_' + obj.id + '_components';
  }

  protected getComponentId(cmp: Component) {
    return 'cmp_' + cmp.id;
  }


  private initDebugWindow() {
    let debugElem = document.getElementById('debug');
    if(!debugElem) {
      debugElem = document.createElement('div');
      debugElem.id = 'debug';
      debugElem.style.width = '600px';
      debugElem.style.height = '900px';
      debugElem.style.overflow = 'scroll';
      debugElem.style.cssFloat = 'left';
      debugElem.style.backgroundColor = '#FFF';
      debugElem.style.fontFamily = '\'Courier New\', monospace';
      document.getElementsByTagName('body')[0].appendChild(debugElem);
    }
    debugElem.innerHTML = '';
    let list = document.createElement('ul');
    debugElem.appendChild(list);

    let messageElem = document.getElementById('debug_msg');

    if(!messageElem) {
      messageElem = document.createElement('div');
      messageElem.id = 'debug_msg';
      messageElem.style.width = '300px';
      messageElem.style.height = '600px';
      messageElem.style.overflow = 'scroll';
      messageElem.style.cssFloat = 'left';
      messageElem.style.backgroundColor = '#FFF';
      messageElem.style.fontFamily = '\'Courier New\', monospace';
      let table = document.createElement('table');
      messageElem.appendChild(table);
      document.getElementsByTagName('body')[0].appendChild(messageElem);
    }
    this.debugElement = debugElem;
    this.msgElement = messageElem.children[0] as HTMLElement;
  }
}