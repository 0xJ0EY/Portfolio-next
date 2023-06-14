import { Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { constructIsOverDisplay } from "./util";
import { MouseData, PointerCoordinates, TouchConfirmationData, TouchData, UserInteractionEvent, toUserInteractionTouchConfirmationEvent } from "@/events/UserInteractionEvents";

function isTouchTap(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

export class MonitorViewCameraState extends CameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const position = new Vector3();
    position.y = 0.5;

    const rotation = new Spherical();
    rotation.phi = 1.2;
    rotation.theta = 0.0;

    const zoom = 5.0;

    const callback = () => {
      this.ctx.disableWebGLPointerEvents();
    }

    this.ctx.cameraController.transition(position, rotation, zoom, 1000, callback);
  }

  private updateCursor(data: PointerCoordinates): void {
    const overDisplay = this.isOverDisplay(data);

    if (overDisplay) {
      this.ctx.disableWebGLPointerEvents();
      this.ctx.setCursor('auto');
    } else {
      this.ctx.enableWebGLPointerEvents();
      this.ctx.setCursor('pointer');
    }
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  handleMouseUp(data: MouseData): void {
    this.manager.changeState(CameraHandlerState.FreeRoam);
  }

  handleMouseMove(data: MouseData): void {
    this.updateCursor(data.pointerCoordinates());
  }

  handleMouseScroll(data: MouseData): void {
    this.ctx.cameraController.zoom(data.zoomDelta());
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

    const confirm = TouchConfirmationData.fromTouchData(
      data,
      600,
      onSuccess,
      null
    );

    const event = toUserInteractionTouchConfirmationEvent(confirm);
    this.manager.emitUserInteractionEvent(event);
  }

  private handleTouchStart(data: TouchData) {
    if (isTouchTap(data)) {
      this.handleTouchOutsideDisplay(data);
    }
  }

  private handleTouchEvent(data: TouchData) {
    if (data.source === 'start') {
      this.handleTouchStart(data);
    }
  }
}

