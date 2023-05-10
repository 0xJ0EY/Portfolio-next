import { CameraHandler, CameraHandlerState, PointerData } from "./CameraHandlers";

export class MouseInputHandler {
  constructor(
    private handler: CameraHandler,
    private cssRenderNode: HTMLElement,
    private webglRenderNode: HTMLElement
  ) {
    this.create();
  }

  create(): void {
    this.cssRenderNode.style.touchAction    = 'none';
    this.webglRenderNode.style.touchAction  = 'none';

    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('contextmenu', this.onContextMenu.bind(this));
    window.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('mouseleave', this.onMouseLeave.bind(this));
  }

  destroy(): void {
    window.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('contextmenu', this.onContextMenu.bind(this));
    window.removeEventListener('wheel', this.onWheel.bind(this));
    window.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
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