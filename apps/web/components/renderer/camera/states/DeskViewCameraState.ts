import { MouseData, PointerCoordinates, TouchData, UserInteractionEvent } from "@/events/UserInteractionEvents";
import { CameraState } from "../CameraState";
import { blurDesktop, calculateCameraPosition, clickedDOMButton, constructIsOverDisplay, getDisplay } from "./util";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { Vector3 } from "three";

export class DeskViewCameraState extends CameraState {

  private maxCameraWidthOffset: number = 2.0;
  private maxCameraHeightOffset: number = 0.5;

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const display = getDisplay(this.ctx.scene);
    if (!display) { return; }

    const zoomDistance = 7;
    const cameraFov = this.ctx.cameraController.getCamera().fov;

    const { distance } = calculateCameraPosition(display, cameraFov, zoomDistance);

    const callback = () => {
      this.ctx.cameraController.setCameraFollowMaxMovementSpeed(0.5);
      blurDesktop();
    }

    this.ctx.cameraController.enableDamping();
    this.ctx.cameraController.enableCameraFollow();
    this.ctx.cameraController.enableCameraFollowLimitMovementSpeed();
    this.ctx.cameraController.setCameraFollowMaxMovementSpeed(0.4);

    this.ctx.cameraController.autoZoom(distance, 1250 / distance, callback);

    this.ctx.cameraController.setMinZoom(1.0);
    this.ctx.cameraController.setMaxZoom(5.0);

    this.ctx.cameraController.setOriginBoundaryX(this.maxCameraWidthOffset);
    this.ctx.cameraController.setOriginBoundaryY(this.maxCameraHeightOffset);
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  private handleMouseDown(data: MouseData): void {
    if (clickedDOMButton(data.isPrimaryDown(), data.x, data.y)) { return; }

    this.manager.changeState(CameraHandlerState.FreeRoam);
  }

  private handleMouseMoveOverDisplay(data: MouseData): void {
    if (!this.isOverDisplay(data)) { return; }
    this.manager.changeState(CameraHandlerState.MonitorView);
  }

  private calculateDeskCameraPosition(coords: PointerCoordinates, cameraTarget: Vector3, cameraOrigin: Vector3): Vector3 {
    const centerWidth   = window.innerWidth / 2;
    const centerHeight  = window.innerHeight / 2;

    // range (0.0 ... 2.00) 0 = left, 2 = right
    const widthOffsetFromCenter = coords.x / centerWidth;

    // range (0.0 ... 2.00) 0 = top, 2 = bottom
    const heightOffsetFromCenter = coords.y / centerHeight;

    const widthOffset = this.maxCameraWidthOffset;
    const heightOffset = this.maxCameraHeightOffset;

    const panOffsetX = (widthOffsetFromCenter * widthOffset) - widthOffset;
    const panOffsetY = (heightOffsetFromCenter * heightOffset) - heightOffset;

    const deltaX = (cameraOrigin.x + panOffsetX) - cameraTarget.x;
    const deltaY = (cameraOrigin.y - panOffsetY) - cameraTarget.y;

    const result = new Vector3();
    result.x = deltaX;
    result.y = deltaY;

    return result;
  }

  private handleMouseMovePanCamera(data: MouseData): void {
    const cameraTarget = this.ctx.cameraController.getTarget();
    const cameraOrigin = this.ctx.cameraController.getOrigin();

    const { x, y } = this.calculateDeskCameraPosition(data, cameraTarget, cameraOrigin);

    this.ctx.cameraController.setPanOffsetX(x);
    this.ctx.cameraController.setPanOffsetY(y);

    this.ctx.cameraController.setOriginBoundaryX(40.0);
    this.ctx.cameraController.setOriginBoundaryY(40.0);
  }

  private handleMouseMove(data: MouseData): void {
    this.handleMouseMoveOverDisplay(data);
    this.handleMouseMovePanCamera(data);
  }

  handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'down': return this.handleMouseDown(data);
      case 'move': return this.handleMouseMove(data);
    }
  }

  private handleTouchEvent(data: TouchData) {
  }
}
