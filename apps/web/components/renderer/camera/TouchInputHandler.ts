import { TouchData, toUserInteractionTouchEvent } from "@/events/UserInteractionEvents";
import { CameraHandler } from "./CameraHandler";
import { RefObject } from "react";

export class TouchInputHandler {
  private onTouchStartListener: (evt: TouchEvent) => void;
  private onTouchMoveListener: (evt: TouchEvent) => void;
  private onTouchEndListener: (evt: TouchEvent) => void;

  private allowInput(): boolean {
    return this.allowInputRef.current ?? false;
  }

  constructor(private allowInputRef: RefObject<boolean>, private handler: CameraHandler) {
    this.onTouchStartListener = this.onTouchStart.bind(this);
    this.onTouchMoveListener = this.onTouchMove.bind(this);
    this.onTouchEndListener = this.onTouchEnd.bind(this);

    this.create();
  }

  create(): void {
    window.addEventListener('touchstart', this.onTouchStartListener);
    window.addEventListener('touchmove', this.onTouchMoveListener);
    window.addEventListener('touchend', this.onTouchEndListener);
  }

  destroy(): void {
    window.removeEventListener('touchstart', this.onTouchStartListener);
    window.removeEventListener('touchmove', this.onTouchMoveListener);
    window.removeEventListener('touchend', this.onTouchEndListener);
  }

  private onTouchStart(evt: TouchEvent): void {
    if (!this.allowInput()) { return; }

    const data = TouchData.fromTouchEvent('start', evt);
    const event = toUserInteractionTouchEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onTouchMove(evt: TouchEvent): void {
    if (!this.allowInput()) { return; }

    const data = TouchData.fromTouchEvent('move', evt);
    const event = toUserInteractionTouchEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onTouchEnd(evt: TouchEvent): void {
    if (!this.allowInput()) { return; }

    const data = TouchData.fromTouchEvent('end', evt);
    const event = toUserInteractionTouchEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }
}
