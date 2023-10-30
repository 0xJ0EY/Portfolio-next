/* These files are copied from the web project, we can make them shared but that takes a bit of effort */
import { BoundingBox } from "./BoundingBox";

export type TouchDataSource = 'start' | 'move' | 'end';

export interface PointerCoordinates {
  y: number;
  x: number;
}

export class TouchElement {
  constructor(
    public x: number,
    public y: number
  ) {}

  static fromTouch(touch: Touch): TouchElement {
    return new TouchElement(touch.clientX, touch.clientY);
  }
}

export class TouchData {
  constructor(
    public source: TouchDataSource,
    public touches: TouchElement[]
  ) {}

  static fromTouchEvent(source: TouchDataSource, evt: TouchEvent): TouchData {
    let touches = [];

    for (const touch of evt.touches) {
      const elem = TouchElement.fromTouch(touch);
      touches.push(elem);
    }

    return new TouchData(source, touches);
  };

  hasTouchesDown(amount: number): boolean {
    return this.touches.length === amount;
  }

  hasMoreTouchesDownThan(amount: number): boolean {
    return this.touches.length > amount;
  }

  boundingBox(): BoundingBox {
    return BoundingBox.fromTouchData(this);
  }

  // Takes the average between all the touches
  pointerCoordinates(): PointerCoordinates {
    let x = 0, y = 0;
    let div = this.touches.length;

    for (let touch of this.touches) {
      x += touch.x;
      y += touch.y;
    }

    return { x: x / div, y: y / div };
  }
}
