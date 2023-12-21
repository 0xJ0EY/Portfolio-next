import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { PanOriginData, calculateCameraPosition, constructIsOverDisplay, getDisplay, isOwnOrigin, isRpcOrigin, isTouchTap, isTouchZoom } from "./util";
import { MouseData, PointerCoordinates, ConfirmationData, TouchData, UserInteractionEvent, toUserInteractionTouchConfirmationEvent, toUserInteractionMouseConfirmationEvent, cancelUserInteractionMouseConfirmationEvent } from "@/events/UserInteractionEvents";

export class MonitorViewCameraState extends CameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;
  private panOrigin: PanOriginData | null = null;
  private wasOverDisplay: boolean = false;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const display = getDisplay(this.ctx.scene);
    if (!display) { return; }

    const zoomDistance = 2;
    const cameraFov = this.ctx.cameraController.getCamera().fov;

    const { spherical, position, distance } = calculateCameraPosition(display, cameraFov, zoomDistance);

    const callback = () => {
      this.ctx.disableWebGLPointerEvents();

      this.ctx.cameraController.setOriginBoundaryX(2.0);
      this.ctx.cameraController.setOriginBoundaryY(1.5);
    }

    this.ctx.cameraController.enableDamping();

    this.ctx.cameraController.transition(position, spherical, distance, distance * 350, callback);

    this.ctx.cameraController.setMinZoom(1.0);
    this.ctx.cameraController.setMaxZoom(5.0);

    this.ctx.cameraController.setOriginBoundaryX(null);
    this.ctx.cameraController.setOriginBoundaryY(null);
  }

  private setupZoomEvent(data: TouchData) {
    if (isTouchZoom(data)) {
      this.panOrigin = PanOriginData.create(this.ctx.cameraController, data);
    } else {
      this.panOrigin = null;
    }
  }

  private handleZoomEvent(data: TouchData) {
    if (this.panOrigin === null) { return; }

    const origin = this.panOrigin.touchData;
    const bb1 = origin.boundingBox();
    const bb2 = data.boundingBox();

    const zoomDistance = this.panOrigin.zoomDistance;
    const zoomOffset = (bb2.diagonal() - bb1.diagonal()) * 0.01;

    this.ctx.cameraController.setZoom(zoomDistance + zoomOffset);
  }

  private updateCursor(data: MouseData): void {
    const overDisplay = this.isOverDisplay(data);

    const hasChangedOverDisplay = (): boolean => overDisplay !== this.wasOverDisplay;

    if (overDisplay) {
      this.ctx.disableWebGLPointerEvents();
      this.ctx.setCursor('auto');

      if (hasChangedOverDisplay()) {
        const cancelEvent = cancelUserInteractionMouseConfirmationEvent();
        this.manager.emitUserInteractionEvent(cancelEvent);
      }
    } else {
      this.ctx.enableWebGLPointerEvents();
      this.ctx.setCursor('pointer');

      if (hasChangedOverDisplay()) {
        const onSuccess = () => {
          this.manager.changeState(CameraHandlerState.DeskView);
        };

        const confirm = ConfirmationData.fromMouseData(
          data,
          600,
          onSuccess,
          null,
        );

        const confirmEvent = toUserInteractionMouseConfirmationEvent(confirm);
        this.manager.emitUserInteractionEvent(confirmEvent);
      }
    }

    this.wasOverDisplay = overDisplay;
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  private handleMouseUp(data: MouseData): void {
    this.manager.changeState(CameraHandlerState.DeskView);
  }

  private handleMouseMove(data: MouseData): void {
    this.updateCursor(data);
  }

  handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'up': return this.handleMouseUp(data);
      case 'move': return this.handleMouseMove(data);
    }
  }

  private handleTouchOutsideDisplay(data: TouchData) {
    const onSuccess = () => {
      this.manager.changeState(CameraHandlerState.FreeRoam);
    };

    const confirm = ConfirmationData.fromTouchData(
      data,
      600,
      onSuccess,
      null
    );

    const event = toUserInteractionTouchConfirmationEvent(confirm);
    this.manager.emitUserInteractionEvent(event);
  }

  private handleOwnOriginTouchStart(data: TouchData) {
    if (isTouchTap(data)) {
      this.handleTouchOutsideDisplay(data);
    }
  }

  private handleRpcOriginTouchStart(data: TouchData) {
    this.setupZoomEvent(data);
  }

  private handleTouchEvent(data: TouchData) {
    if (data.source === 'start' && isOwnOrigin(data)) {
      this.handleOwnOriginTouchStart(data);
    }

    if (data.source === 'start' && isRpcOrigin(data)) {
      this.handleRpcOriginTouchStart(data);
    }

    if (data.source === 'move' && isRpcOrigin(data)) {
      this.handleZoomEvent(data);
    }
  }
}
