import { CameraHandler, PointerData } from "./CameraHandlers";

export class TouchInputHandler {
  private onTouchStartListener: (evt: TouchEvent) => void;
  private onTouchMoveListener: (evt: TouchEvent) => void;
  private onTouchEndListener: (evt: TouchEvent) => void;

  constructor(private handler: CameraHandler) {
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

  }

  private onTouchMove(evt: TouchEvent): void {
    const data = PointerData.fromTouchEvent(evt);
    this.handler.onPointerMove(data);
  }

  private onTouchEnd(evt: TouchEvent): void {
    evt.preventDefault();

    const data = new PointerData(0, 0, false, false, 0);
    this.handler.onPointerUp(data);
  }
}
