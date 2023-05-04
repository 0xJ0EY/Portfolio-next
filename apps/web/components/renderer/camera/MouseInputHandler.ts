import { CameraHandler, CameraHandlerState } from "./CameraHandlers";

enum MouseEventButtons {
  None          = 0x00,
  Primary       = 0x01,
  Secondary     = 0x02,
  Auxiliary     = 0x04,
  BackButton    = 0x08,
  ForwardButton = 0x10
}

export class MouseInputHandler {
  private pressedButtons = 0x00;

  constructor(
    private cameraHandler: CameraHandler,
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

  private isPrimary(): boolean {
    return (this.pressedButtons & MouseEventButtons.Primary) > 0;
  }

  private isSecondary(): boolean {
    return (this.pressedButtons & MouseEventButtons.Secondary) > 0;
  }

  private handleMouseEvent(evt: MouseEvent) {
    this.pressedButtons = evt.buttons;

  }

  private onMouseDown(evt: MouseEvent) {
    this.handleMouseEvent(evt);
  }

  private onMouseUp(evt: MouseEvent) {
    this.handleMouseEvent(evt);
  }

  private onMouseMove(evt: MouseEvent) {
    this.handleMouseEvent(evt);

    this.cameraHandler.onMove(evt);

  }

  private onContextMenu(evt: MouseEvent) {
    evt.preventDefault();
  }

  private onWheel(evt: WheelEvent) {
    
  }

  private onMouseLeave(evt: MouseEvent) {

  }
}