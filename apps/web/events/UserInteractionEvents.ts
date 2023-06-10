import { BoundingBox } from "@/data/BoundingBox";
import { EventBus } from "./EventBus";

export type UserTouchEvent = {
  event: 'touch_event';
  data: TouchData;
}

export type UserMouseEvent = {
  event: 'mouse_event';
  data: MouseData;
}

export enum MouseEventButton {
  None          = 0x00,
  Primary       = 0x01,
  Secondary     = 0x02,
  Auxiliary     = 0x04,
  BackButton    = 0x08,
  ForwardButton = 0x10
}

export interface PointerCoordinates {
  y: number;
  x: number;
}

// MouseData is meant to be used as a DTO for the mouse events of the native browser
// For example (MouseEvent, WheelEvent)
export type MouseDataSource = 'down' | 'up' | 'move' | 'leave' | 'wheel';

export class MouseData {
  constructor(
    public source: MouseDataSource,
    public x: number,
    public y: number,
    public deltaY: number,
    public buttons: number,
  ) {}

  static fromMouseEvent(source: MouseDataSource, evt: MouseEvent): MouseData {
    return new MouseData(source, evt.clientX, evt.clientY, 0, evt.buttons);
  }

  static fromWheelEvent(source: MouseDataSource, evt: WheelEvent): MouseData {
    return new MouseData(source, evt.clientX, evt.clientY, evt.deltaY, evt.buttons);
  }

  isPrimaryDown(): boolean {
    return (this.buttons & MouseEventButton.Primary) > 0;
  }

  isSecondaryDown(): boolean {
    return (this.buttons & MouseEventButton.Secondary) > 0;
  }

  zoomDelta(): number {
    return this.deltaY * 0.01;
  }

  pointerCoordinates(): PointerCoordinates {
    return { x: this.x, y: this.y };
  }
}

export type TouchDataSource = 'start' | 'move' | 'end';

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

export const toUserInteractionTouchEvent = (data: TouchData): UserTouchEvent => {
  return { event: 'touch_event', data };
}

export const toUserInteractionMouseEvent = (data: MouseData): UserMouseEvent => {
  return { event: 'mouse_event', data };
}

export type UserInteractionEvent = UserTouchEvent | UserMouseEvent;
export type UserInteractionEventBus = EventBus<UserInteractionEvent>;

export const createUIEventBus = (): UserInteractionEventBus => {
  return new EventBus<UserInteractionEvent>();
}
