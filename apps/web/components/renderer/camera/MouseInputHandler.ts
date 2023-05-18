import { CameraHandler, PointerData } from "./CameraHandlers";

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
    window.removeEventListener('wheel', this.onWheelListener);
    window.removeEventListener('mouseleave', this.onMouseLeaveListener);
  }

  private onMouseDown(evt: MouseEvent) {
    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerDown(data);
  }

  private onMouseUp(evt: MouseEvent) {
    
    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerUp(data);
  }

  private onMouseMove(evt: MouseEvent) {
    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerMove(data);
  }

  private onContextMenu(evt: MouseEvent) {
    evt.preventDefault();
  }

  private onWheel(evt: WheelEvent) {
    
  }

  private onMouseLeave(evt: MouseEvent) {

  }
}