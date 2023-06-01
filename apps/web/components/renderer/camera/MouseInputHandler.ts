import { CameraHandler, PointerData } from "./CameraHandler";

export class MouseInputHandler {
  private onPointerDownListener: (evt: PointerEvent) => void;
  private onPointerUpListener: (evt: PointerEvent) => void;
  private onPointerMoveListener: (evt: PointerEvent) => void;
  private onContextMenuListener: (evt: MouseEvent) => void;
  private onWheelListener: (evt: WheelEvent) => void;
  private onMouseLeaveListener: (evt: MouseEvent) => void;

  constructor(private handler: CameraHandler) {
    this.onPointerDownListener  = this.onPointerDown.bind(this);
    this.onPointerUpListener    = this.onPointerUp.bind(this);
    this.onPointerMoveListener  = this.onPointerMove.bind(this);
    this.onContextMenuListener  = this.onContextMenu.bind(this);
    this.onWheelListener        = this.onWheel.bind(this);
    this.onMouseLeaveListener   = this.onMouseLeave.bind(this);

    this.create();
  }

  create(): void {
    window.addEventListener('pointerdown', this.onPointerDownListener);
    window.addEventListener('pointerup', this.onPointerUpListener);
    window.addEventListener('pointermove', this.onPointerMoveListener);
    window.addEventListener('contextmenu', this.onContextMenuListener);
    window.addEventListener('wheel', this.onWheelListener);
    window.addEventListener('mouseleave', this.onMouseLeaveListener);
  }

  destroy(): void {
    window.removeEventListener('pointerdown', this.onPointerDownListener);
    window.removeEventListener('pointerup', this.onPointerUpListener);
    window.removeEventListener('pointermove', this.onPointerMoveListener);
    window.removeEventListener('contextmenu', this.onContextMenuListener);
    window.removeEventListener('wheel', this.onWheelListener);
    window.removeEventListener('mouseleave', this.onMouseLeaveListener);
  }

  private isMouse(evt: PointerEvent): boolean {
    return evt.pointerType === 'mouse';
  }

  private onPointerDown(evt: PointerEvent) {
    if (!this.isMouse(evt)) { return; }

    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerDown(data);
  }

  private onPointerUp(evt: PointerEvent) {
    if (!this.isMouse(evt)) { return; }

    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerUp(data);
  }

  private onPointerMove(evt: PointerEvent) {
    if (!this.isMouse(evt)) { return; }

    const data = PointerData.fromMouseEvent(evt);
    this.handler.onPointerMove(data);
  }

  private onContextMenu(evt: MouseEvent) {
    evt.preventDefault();
  }

  private onWheel(evt: WheelEvent) {
    this.handler.getContext().cameraController.zoom(evt.deltaY * 0.01);
  }

  private onMouseLeave(evt: MouseEvent) {

  }
}
