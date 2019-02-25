import Scene from './scene';
import { PIXICmp } from './pixi-object';
import Component from './component';
import * as PIXI from 'pixi.js';
import { Vector } from '..';

/**
 * Builder for PIXI objects from given attributes
 */
export default class PIXIObjectBuilder {

  private scene: Scene;
  private locPosX?: number;
  private locPosY?: number;
  private anchorX?: number;
  private anchorY?: number;
  private relPosX?: number;
  private relPosY?: number;
  private absPosX?: number;
  private absPosY?: number;
  private scaleX?: number;
  private scaleY?: number;
  private components = new Array<Component>();
  private attributes = new Map<string, any>();
  private flags = new Array<number>();
  private tags = new Set<string>();
  private state?: number;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Sets an anchor
   */
  anchor(x: number | Vector, y?: number): PIXIObjectBuilder {
    if(typeof(x) === 'number') {
      this.anchorX = x;
      if (y != null) {
        this.anchorY = y;
      } else {
        this.anchorY = this.anchorX;
      }
    } else {
      this.anchorX = x.x;
      this.anchorY = x.y;
    }
    return this;
  }

  /**
   * Sets position relative to the screen ([0,0] for topleft corner, [1,1] for bottomright corner)
   */
  relativePos(x: number | Vector, y?: number): PIXIObjectBuilder {
    if(typeof(x) === 'number') {
      this.relPosX = x;
      if (y != null) {
        this.relPosY = y;
      } else {
        this.relPosY = this.relPosX;
      }
    } else {
      this.relPosX = x.x;
      this.relPosY = x.y;
    }

    return this;
  }

  /**
   * Sets local position
   */
  localPos(x: number | Vector, y?: number): PIXIObjectBuilder {
    if(typeof(x) === 'number') {
      this.locPosX = x;
      if (y != null) {
        this.locPosY = y;
      } else {
        this.locPosY = this.locPosX;
      }
    } else {
      this.locPosX = x.x;
      this.locPosY = x.y;
    }

    return this;
  }

  /**
   * Sets global position
   */
  globalPos(x: number | Vector, y?: number): PIXIObjectBuilder {
    if(typeof(x) === 'number') {
      this.absPosX = x;
      if (y != null) {
        this.absPosY = y;
      } else {
        this.absPosY = this.absPosX;
      }
    } else {
      this.absPosX = x.x;
      this.absPosY = x.y;
    }

    return this;
  }

  scale(x: number | Vector, y?: number): PIXIObjectBuilder {
    if(typeof(x) === 'number') {
      this.scaleX = x;
      if (y != null) {
        this.scaleY = y;
      } else {
        this.scaleY = this.scaleX;
      }
    } else {
      this.scaleX = x.x;
      this.scaleY = x.y;
    }

    return this;
  }

  withAttribute(key: string, val: any): PIXIObjectBuilder {
    this.attributes.set(key, val);
    return this;
  }

  withComponent(cmp: Component): PIXIObjectBuilder {
    this.components.push(cmp);
    return this;
  }

  withFlag(index: number): PIXIObjectBuilder {
    this.flags.push(index);
    return this;
  }

  withState(state: number): PIXIObjectBuilder {
    this.state = state;
    return this;
  }

  withTag(tag: string): PIXIObjectBuilder {
    this.tags.add(tag);
    return this;
  }

  buildContainer(name: string, parent?: PIXICmp.GameObject): PIXICmp.Container {
    return this.build(new PIXICmp.Container(name), parent) as PIXICmp.Container;
  }

  buildSprite(name: string, texture: PIXI.Texture, parent?: PIXICmp.GameObject): PIXICmp.Sprite {
    return this.build(new PIXICmp.Sprite(name, texture), parent) as PIXICmp.Sprite;
  }

  buildText(name: string, text: string, parent?: PIXICmp.GameObject): PIXICmp.Text {
    return this.build(new PIXICmp.Text(name, text), parent) as PIXICmp.Text;
  }

  buildGraphics(name: string, parent?: PIXICmp.GameObject): PIXICmp.Graphics {
    return this.build(new PIXICmp.Graphics(name), parent) as PIXICmp.Graphics;
  }

  build(object: PIXICmp.GameObject, parent?: PIXICmp.GameObject): PIXICmp.GameObject {

    // add all components and attributes before the object is added to the scene
    for (let component of this.components) {
      object.addComponent(component);
    }

    for (let [key, val] of this.attributes) {
      object.addAttribute(key, val);
    }

    if (parent != null) {
      parent.pixiObj.addChild(object.pixiObj);
    }

    for (let flag of this.flags) {
      object.setFlag(flag);
    }

    if (this.state != null) {
      object.stateId = this.state;
    }

    if(this.tags.size !== 0) {
      this.tags.forEach(tag => object.addTag(tag));
    }

    let pixiObj = object.pixiObj;

    if (this.scaleX != null) {
      pixiObj.scale.x = this.scaleX;
    }

    if (this.scaleY != null) {
      pixiObj.scale.y = this.scaleY;
    }

    if (this.locPosX != null) {
      pixiObj.position.x = this.locPosX;
    }

    if (this.locPosY != null) {
      pixiObj.position.y = this.locPosY;
    }

    if (this.relPosX != null) {
      let point = new PIXI.Point();
      point.x = this.relPosX * this.scene.app.screen.width;
      pixiObj.position.x = pixiObj.toLocal(point).x;
      if (this.scaleX != null) {
        pixiObj.position.x *= this.scaleX;
      }
    }

    if (this.relPosY != null) {
      let point = new PIXI.Point();
      point.y = this.relPosY * this.scene.app.screen.height;
      pixiObj.position.y = pixiObj.toLocal(point).y;
      if (this.scaleY != null) {
        pixiObj.position.y *= this.scaleY;
      }
    }

    if (this.absPosX != null) {
      let point = new PIXI.Point();
      point.x = this.absPosX;
      pixiObj.position.x = pixiObj.toLocal(point, this.scene.stage.pixiObj).x;
      if (this.scaleX != null) {
        pixiObj.position.x *= this.scaleX;
      }
    }

    if (this.absPosY != null) {
      let point = new PIXI.Point();
      point.y = this.absPosY;
      pixiObj.position.y = pixiObj.toLocal(point, this.scene.stage.pixiObj).y;
      if (this.scaleY != null) {
        pixiObj.position.y *= this.scaleY;
      }
    }

    if (this.anchorX != null) {
      // sprites and texts have anchors
      if (pixiObj instanceof PIXICmp.Sprite || pixiObj instanceof PIXICmp.Text) {
        pixiObj.anchor.x = this.anchorX;
      } else {
        pixiObj.pivot.x = this.anchorX * pixiObj.width;
      }
    }

    if (this.anchorY != null) {
      // sprites and texts have anchors
      if (pixiObj instanceof PIXICmp.Sprite || pixiObj instanceof PIXICmp.Text) {
        pixiObj.anchor.y = this.anchorY;
      } else {
        pixiObj.pivot.y = this.anchorY * pixiObj.height;
      }
    }

    this.clear();
    return object;
  }

  clear() {
    this.locPosX = null;
    this.locPosY = null;
    this.anchorX = null;
    this.anchorY = null;
    this.relPosX = null;
    this.relPosY = null;
    this.absPosX = null;
    this.absPosY = null;
    this.scaleX = null;
    this.scaleY = null;
    this.components = new Array();
    this.attributes.clear();
    this.flags = new Array();
    this.state = null;
    this.tags = new Set();
  }
}