import { MouseData, toUserInteractionMouseEvent } from "@/events/UserInteractionEvents";
import { CameraHandler } from "./CameraHandler";

export class MouseInputHandler {
  private onMouseDownListener: (evt: MouseEvent) => void;
  private onMouseUpListener: (evt: MouseEvent) => void;
  private onMouseMoveListener: (evt: MouseEvent) => void;
  private onContextMenuListener: (evt: MouseEvent) => void;
  private onWheelListener: (evt: WheelEvent) => void;
  private onMouseLeaveListener: (evt: MouseEvent) => void;

  constructor(private handler: CameraHandler) {
    this.onMouseDownListener    = this.onMouseDown.bind(this);
    this.onMouseUpListener      = this.onMouseUp.bind(this);
    this.onMouseMoveListener    = this.onMouseMove.bind(this);
    this.onContextMenuListener  = this.onContextMenu.bind(this);
    this.onWheelListener        = this.onWheel.bind(this);
    this.onMouseLeaveListener   = this.onMouseLeave.bind(this);

    this.create();
  }

  create(): void {
    window.addEventListener('mousedown', this.onMouseDownListener);
    window.addEventListener('mouseup', this.onMouseUpListener);
    window.addEventListener('mousemove', this.onMouseMoveListener);
    window.addEventListener('contextmenu', this.onContextMenuListener);
    window.addEventListener('wheel', this.onWheelListener);
    window.addEventListener('mouseleave', this.onMouseLeaveListener);
  }

  destroy(): void {
    window.removeEventListener('mousedown', this.onMouseDownListener);
    window.removeEventListener('mouseup', this.onMouseUpListener);
    window.removeEventListener('mousemove', this.onMouseMoveListener);
    window.removeEventListener('contextmenu', this.onContextMenuListener);
    window.removeEventListener('mouseleave', this.onMouseLeaveListener);
    window.removeEventListener('wheel', this.onWheelListener);
  }

  private onMouseDown(evt: MouseEvent) {
    const data = MouseData.fromMouseEvent('down', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onMouseUp(evt: MouseEvent) {
    const data = MouseData.fromMouseEvent('up', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onMouseMove(evt: MouseEvent) {
    const data = MouseData.fromMouseEvent('move', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onContextMenu(evt: MouseEvent) {
    evt.preventDefault();
  }

  private onWheel(evt: WheelEvent) {
    const data = MouseData.fromWheelEvent('wheel', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }

  private onMouseLeave(evt: MouseEvent) {
    const data = MouseData.fromMouseEvent('leave', evt);
    const event = toUserInteractionMouseEvent(data);

    this.handler.emitUserInteractionEvent(event);
  }
}
