import { CameraHandler, PointerData, TouchData } from "./CameraHandlers";


class PanData {
  constructor(
    public touch: TouchData,
    public zoomDistance: number
  ) {}
}

export class TouchInputHandler {
  private onTouchStartListener: (evt: TouchEvent) => void;
  private onTouchMoveListener: (evt: TouchEvent) => void;
  private onTouchEndListener: (evt: TouchEvent) => void;

  private panData: PanData | null = null;

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

  private handlePanEvent(data: TouchData) {
    if (data.isPanEvent()) {
      const zoom =  this.handler.getContext().cameraController.getZoom();
      this.panData = new PanData(data, zoom);
    } else {
      this.panData = null;
    }
  }

  private onTouchStart(evt: TouchEvent): void {
    const data = TouchData.fromTouchEvent(evt);

    this.handlePanEvent(data);

    this.handler.onPointerDown(data.toPointerData());
  }

  private onTouchMove(evt: TouchEvent): void {
    const evtData = TouchData.fromTouchEvent(evt);

    if (evtData.isPanEvent()) {
      if (this.panData == null) { return; }
      const panData = this.panData;
      const touchData = panData.touch;

      const bb1 = touchData.boundingBox();
      const bb2 = evtData.boundingBox();

      const zoomDistance = this.panData.zoomDistance;
      const zoomOffset = (bb2.diagonal() - bb1.diagonal()) * 0.01;

      this.handler.getContext().cameraController.setZoom(zoomDistance - zoomOffset);
    }

    this.handler.onPointerMove(evtData.toPointerData());
  }

  private onTouchEnd(evt: TouchEvent): void {
    const data = TouchData.fromTouchEvent(evt);

    this.handlePanEvent(data);

    this.handler.onPointerUp(data.toPointerData());
  }
}
