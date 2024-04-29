import { prefersReducedMotion } from "../../util";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { PanOriginData, calculateCameraPosition, clickedDOMButton, constructIsOverDisplay, focusDesktop, getDisplay, isOwnOrigin, isRpcOrigin, isTouchTap, isTouchZoom, overDOMButton } from "./util";
import { MouseData, PointerCoordinates, ConfirmationData, TouchData, UserInteractionEvent, toUserInteractionTouchConfirmationEvent, toUserInteractionMouseConfirmationEvent, cancelUserInteractionMouseConfirmationEvent } from "@/events/UserInteractionEvents";

export class MonitorViewCameraState extends CameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;
  private panOrigin: PanOriginData | null = null;
  private wasOverDisplay: boolean = false;

  private lastUserInteractionEvent: UserInteractionEvent | null = null;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const display = getDisplay(this.ctx.scene);
    if (!display) { return; }

    const zoomDistance = 2.4;
    const cameraFov = this.ctx.cameraController.getCamera().fov;

    const { spherical, position, distance } = calculateCameraPosition(display, cameraFov, zoomDistance);

    const callback = () => {
      this.ctx.disableWebGLPointerEvents();

      this.ctx.cameraController.setOriginBoundaryX(2.0);
      this.ctx.cameraController.setOriginBoundaryY(1.5);

      focusDesktop();
    }

    this.ctx.cameraController.enableDamping();

    const speed = 175;
    this.ctx.cameraController.transition(position, spherical, distance, speed * distance, callback);

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

    if (overDOMButton(data.x, data.y)) {
      const cancelEvent = cancelUserInteractionMouseConfirmationEvent();
      this.manager.emitUserInteractionEvent(cancelEvent);
    }

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

          // Due to a design constraint, we need to "replay" the last effect, to get a nice flowing transition
          // Otherwise the user will have to send a new user interaction event before a nice transition is played
          if (this.lastUserInteractionEvent) {
            this.manager.emitUserInteractionEvent(this.lastUserInteractionEvent);
          }
        };

        if (!prefersReducedMotion()) {
          const confirm = ConfirmationData.fromMouseData(
            data,
            800,
            onSuccess,
            null,
          );

          const confirmEvent = toUserInteractionMouseConfirmationEvent(confirm);
          this.manager.emitUserInteractionEvent(confirmEvent);
        }
      }
    }

    this.wasOverDisplay = overDisplay;
  }

  onUserEvent(data: UserInteractionEvent): void {
    this.lastUserInteractionEvent = data;

    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  private handleMouseDown(data: MouseData): void {
    if (clickedDOMButton(data.isPrimaryDown(), data.x, data.y)) { return; }
    if (this.isOverDisplay(data)) { return; }

    // Because we're changing the state anyway, always cancel the possible chance state event
    const cancelEvent = cancelUserInteractionMouseConfirmationEvent();
    this.manager.emitUserInteractionEvent(cancelEvent);

    this.manager.changeState(CameraHandlerState.DeskView);
  }

  private handleMouseMove(data: MouseData): void {
    this.updateCursor(data);
  }

  handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'down': return this.handleMouseDown(data);
      case 'move': return this.handleMouseMove(data);
    }
  }

  private handleTouchOutsideDisplay(data: TouchData) {
    const coords = data.pointerCoordinates();
    if (clickedDOMButton(data.hasTouchesDown(1), coords.x,coords.y)) { return; }

    const onSuccess = () => {
      this.manager.changeState(CameraHandlerState.FreeRoam);
    };

    const confirm = ConfirmationData.fromTouchData(
      data,
      800,
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
