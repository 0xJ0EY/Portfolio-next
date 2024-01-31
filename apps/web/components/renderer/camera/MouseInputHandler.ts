import { MouseData, toUserInteractionMouseEvent } from "@/events/UserInteractionEvents";
import { CameraHandler } from "./CameraHandler";
import { RefObject } from "react";

export class MouseInputHandler {
  private onPointerDownListener: (evt: PointerEvent) => void;
  private onPointerUpListener: (evt: PointerEvent) => void;
  private onPointerMoveListener: (evt: PointerEvent) => void;
  private onPointerLeaveListener: (evt: PointerEvent) => void;
  private onContextMenuListener: (evt: MouseEvent) => void;
  private onWheelListener: (evt: WheelEvent) => void;

  private allowInput(): boolean {
    return this.allowInputRef.current ?? false;
  }

  constructor(private allowInputRef: RefObject<boolean>, private handler: CameraHandler) {
    this.onPointerDownListener    = this.onPointerDown.bind(this);
    this.onPointerUpListener      = this.onPointerUp.bind(this);
    this.onPointerMoveListener    = this.onPointerMove.bind(this);
    this.onPointerLeaveListener   = this.onPointerLeave.bind(this);
    this.onContextMenuListener    = this.onContextMenu.bind(this);
    this.onWheelListener          = this.onWheel.bind(this);

    this.create();
  }

  create(): void {
    window.addEventListener('pointerdown', this.onPointerDownListener);
    window.addEventListener('pointerup', this.onPointerUpListener);
    window.addEventListener('pointermove', this.onPointerMoveListener);
    window.addEventListener('pointerleave', this.onPointerLeaveListener);
    window.addEventListener('contextmenu', this.onContextMenuListener);
    window.addEventListener('wheel', this.onWheelListener);
  }

  destroy(): void {
    window.removeEventListener('pointerdown', this.onPointerDownListener);
    window.removeEventListener('pointerup', this.onPointerUpListener);
    window.removeEventListener('pointermove', this.onPointerMoveListener);
    window.removeEventListener('pointerleave', this.onPointerLeaveListener);
    window.removeEventListener('contextmenu', this.onContextMenuListener);
    window.removeEventListener('wheel', this.onWheelListener);
  }

  private dropPointerEvent(evt: PointerEvent): boolean {
    const isPrimary = !evt.isPrimary;
    const isMouse = evt.pointerType !== 'mouse';

    return isPrimary || isMouse;
  }

  private onPointerDown(evt: PointerEvent): void {
    if (!this.allowInput()) { return; }
    if (this.dropPointerEvent(evt)) { return; }

    const data = MouseData.fromMouseEvent('down', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onPointerUp(evt: PointerEvent): void {
    if (!this.allowInput()) { return; }
    if (this.dropPointerEvent(evt)) { return; }

    const data = MouseData.fromMouseEvent('up', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onPointerMove(evt: PointerEvent): void {
    if (!this.allowInput()) { return; }
    if (this.dropPointerEvent(evt)) { return; }

    const data = MouseData.fromMouseEvent('move', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onPointerLeave(evt: PointerEvent): void {
    if (!this.allowInput()) { return; }
    if (this.dropPointerEvent(evt)) { return; }

    const data = MouseData.fromMouseEvent('leave', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onContextMenu(evt: MouseEvent): void {
    if (!this.allowInput()) { return; }

    evt.preventDefault();
  }

  private onWheel(evt: WheelEvent): void {
    if (!this.allowInput()) { return; }

    const data = MouseData.fromWheelEvent('wheel', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }
}
