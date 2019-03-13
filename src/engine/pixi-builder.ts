import Scene from './scene';
import { PIXICmp } from './pixi-object';
import Component from './component';
import * as PIXI from 'pixi.js';
import { Vector } from '..';

// a function that has a return type
interface Func<T, TResult> {
  (item: T): TResult;
}

enum ObjectType {
  Graphics,
  Container,
  ParticleContainer,
  Sprite,
  TilingSprite,
  Text,
  BitmapText
}

class ObjectParameters {
  name?: string; // all
  texture?: PIXI.Texture; // sprite, tilingsprite
  width?: number; // tilingsprite
  height?: number; // tilingsprite
  text?: string; // text
  fontStyle?: PIXI.TextStyle; // text
  fontName?: string; // bitmaptext
  fontSize?: number; // bitmaptext
  fontColor?: number;// bitmaptext
}


/**
 * Builder for PIXI objects from given attributes
 */
export default class PIXIBuilder {

  private scene: Scene;
  private locPosX?: number;
  private locPosY?: number;
  private anchorX?: number;
  private anchorY?: number;
  private virtAnchorX?: number;
  private virtAnchorY?: number;
  private relPosX?: number;
  private relPosY?: number;
  private absPosX?: number;
  private absPosY?: number;
  private scaleX?: number;
  private scaleY?: number;
  private children: PIXIBuilder[];
  private components;
  private componentBuilders: Func<void, Component>[];
  private attributes: Map<string, any>;
  private flags: number[];
  private tags: Set<string>;
  private state?: number;
  private parent?: PIXICmp.GameObject;
  private existingObject?: PIXICmp.GameObject;
  private parameters?: ObjectParameters;
  private type: ObjectType = ObjectType.Container; // type of object being built

  constructor(scene: Scene) {
    this.scene = scene;
    this.clear();
  }

  /**
   * Sets an anchor
   */
  anchor(x: number | Vector, y?: number): PIXIBuilder {
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
   * Sets a virtual anchor (only moves the object, will not change the pivot)
   */
  virtualAnchor(x: number | Vector, y?: number): PIXIBuilder {
    if(typeof(x) === 'number') {
      this.virtAnchorX = x;
      if (y != null) {
        this.virtAnchorY = y;
      } else {
        this.virtAnchorY = this.virtAnchorX;
      }
    } else {
      this.virtAnchorX = x.x;
      this.virtAnchorY = x.y;
    }
    return this;
  }

  /**
   * Sets position relative to the screen ([0,0] for topleft corner, [1,1] for bottomright corner)
   */
  relativePos(x: number | Vector, y?: number): PIXIBuilder {
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
  localPos(x: number | Vector, y?: number): PIXIBuilder {
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
  globalPos(x: number | Vector, y?: number): PIXIBuilder {
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

  scale(x: number | Vector, y?: number): PIXIBuilder {
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

  /**
   * Adds an attribute for building
   */
  withAttribute(key: string, val: any): PIXIBuilder {
    this.attributes.set(key, val);
    return this;
  }

  /**
   * Adds either a component or an arrow function that returns this component
   * Use arrow function if you want to use this builder for the same object more than once.
   */
  withComponent(cmp: Component | Func<void, Component>): PIXIBuilder {
    if(cmp instanceof Component) {
      this.components.push(cmp);
    } else {
      this.componentBuilders.push(cmp);
    }
    return this;
  }

  withFlag(index: number): PIXIBuilder {
    this.flags.push(index);
    return this;
  }

  withState(state: number): PIXIBuilder {
    this.state = state;
    return this;
  }

  withTag(tag: string): PIXIBuilder {
    this.tags.add(tag);
    return this;
  }

  withParent(parent: PIXICmp.GameObject): PIXIBuilder {
    this.parent = parent;
    return this;
  }

  withChild(child: PIXIBuilder): PIXIBuilder {
    this.children.push(child);
    return this;
  }

  withExistingObject(obj: PIXICmp.GameObject): PIXIBuilder {
    this.existingObject = obj;
    return this;
  }


  asContainer(name: string = ''): PIXIBuilder {
    this.type = ObjectType.Container;
    this.parameters = {
      name
    };
    return this;
  }

  asGraphics(name: string = ''): PIXIBuilder {
    this.type = ObjectType.Graphics;
    this.parameters = {
      name
    };
    return this;
  }

  asParticleContainer(name: string = ''): PIXIBuilder {
    this.type = ObjectType.ParticleContainer;
    this.parameters = {
      name
    };
    return this;
  }

  asSprite(texture: PIXI.Texture, name: string = ''): PIXIBuilder {
    this.type = ObjectType.Sprite;
    this.parameters = {
      name, texture,
    };
    return this;
  }

  asTilingSprite(texture: PIXI.Texture, width: number, height: number, name: string = ''): PIXIBuilder {
    this.type = ObjectType.TilingSprite;
    this.parameters = {
      name, texture, width, height
    };
    return this;
  }

  asText(name: string = '', text: string = '', fontStyle?: PIXI.TextStyle): PIXIBuilder {
    this.type = ObjectType.Text;
    this.parameters = {
      name, text, fontStyle
    };
    return this;
  }

  asBitmapText(name: string = '', text: string = '', fontName: string, fontSize: number, fontColor: number): PIXIBuilder {
    this.type = ObjectType.BitmapText;
    this.parameters = {
      name, text, fontName, fontSize, fontColor
    };
    return this;
  }

  build<T extends PIXICmp.GameObject>(clearData: boolean = true): T {
    let object: PIXICmp.GameObject;

    if(this.existingObject !== null) {
      object = this.existingObject;
    } else {
      switch(this.type) {
        case ObjectType.Container:
          object = new PIXICmp.Container(this.parameters.name);
          break;
        case ObjectType.Graphics:
            object = new PIXICmp.Graphics(this.parameters.name);
          break;
        case ObjectType.ParticleContainer:
            object = new PIXICmp.ParticleContainer(this.parameters.name);
          break;
        case ObjectType.Sprite:
            object = new PIXICmp.Sprite(this.parameters.name, this.parameters.texture.clone());
          break;
        case ObjectType.TilingSprite:
            object = new PIXICmp.TilingSprite(this.parameters.name, this.parameters.texture.clone(), this.parameters.width, this.parameters.height);
          break;
        case ObjectType.Text:
            object = new PIXICmp.Text(this.parameters.name, this.parameters.text);
            (object as PIXICmp.Text).style = this.parameters.fontStyle;
          break;
        case ObjectType.BitmapText:
            object = new PIXICmp.BitmapText(this.parameters.name, this.parameters.text, this.parameters.fontName, this.parameters.fontSize, this.parameters.fontColor);
          break;
      }
    }

    // add all components and attributes before the object is added to the scene
    // this means that we won't get any notification that attributes/components have been added
    for (let component of this.components) {
      object.addComponent(component);
    }

    // for security -> we can't use the same components for more than one object
    this.components = [];

    // consider also component builders
    // this is very useful if this builder is used more than once
    for(let builder of this.componentBuilders) {
      object.addComponent(builder());
    }

    for (let [key, val] of this.attributes) {
      object.assignAttribute(key, val);
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

    if (this.parent != null) {
      this.parent.pixiObj.addChild(object.pixiObj);
    }

    // now, when this object is already assigned to its parent, we can build children
    for(let child of this.children) {
      let newChild = child.withParent(object).build(clearData);
      object.pixiObj.addChild(newChild.pixiObj);
    }

    let pixiObj = object.pixiObj;

    if (this.scaleX != null) {
      pixiObj.scale.x = this.scaleX;
    }

    if (this.scaleY != null) {
      pixiObj.scale.y = this.scaleY;
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

    // if the local position is set along with relative position, it will be treated as an offset
    if (this.locPosX != null) {
      if(this.relPosX != null) {
        pixiObj.position.x += this.locPosX;
      } else {
        pixiObj.position.x = this.locPosX;
      }
    }

    if (this.locPosY != null) {
      if(this.relPosY != null) {
        pixiObj.position.y += this.locPosY;
      } else {
        pixiObj.position.y = this.locPosY;
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

    if (this.virtAnchorX != null) {
      let anchor = this.virtAnchorX - (this.anchorX === null ? 0 : this.anchorX);
      pixiObj.position.x -= anchor * pixiObj.width;
    }

    if(this.virtAnchorY != null) {
      let anchor = this.virtAnchorY - (this.anchorY === null ? 0 : this.anchorY);
      pixiObj.position.y -= anchor * pixiObj.height;
    }

    if(clearData) {
      this.clear();
    }
    return object as T;
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
    this.components = [];
    this.componentBuilders = [];
    this.attributes = new Map();
    this.flags = [];
    this.state = null;
    this.tags = new Set();
    this.virtAnchorX = null;
    this.virtAnchorY = null;
    this.parent = null;
    this.children = [];
    this.existingObject = null;
    this.type = ObjectType.Container;
    this.parameters = {
      name: ''
    };
  }
}