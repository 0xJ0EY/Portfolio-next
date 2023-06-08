import { Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState, MouseEventButton, PointerData } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { constructIsOverDisplay } from "./util";
import { MouseData, PointerCoordinates, TouchData, UserInteractionEvent } from "@/events/UserInteractionEvents";

function isRotateCamera(data: MouseData): boolean {
  return data.isPrimaryDown();
}

function isMoveCamera(data: MouseData): boolean {
  return data.isSecondaryDown();
}

export class FreeRoamCameraState extends CameraState {

  private previousMovementData: PointerCoordinates | null = null;
  private previousRotationData: PointerCoordinates | null = null;

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    this.ctx.enableWebGLPointerEvents();

    const position = new Vector3();

    const rotation = new Spherical();
    rotation.phi = 1.0;
    rotation.theta = 0.0;

    const zoom = 10.0;

    this.ctx.cameraController.transition(position, rotation, zoom, 1000);
  }

  private handleDisplayClick(data: PointerCoordinates): void {
    if (!this.isOverDisplay(data)) { return; }

    this.manager.changeState(CameraHandlerState.MonitorView);
  }

  private moveCamera(coords: PointerCoordinates): void {
    const sensitivity = 0.005;

    let forward = 0;
    let left = 0;

    const previous = this.previousMovementData;

    if (previous !== null) {
      forward = (coords.y - previous.y) * sensitivity;
      left = (coords.x - previous.x) * sensitivity;
    }

    this.ctx.cameraController.moveCameraForward(forward);
    this.ctx.cameraController.moveCameraLeft(left);

    this.previousMovementData = coords;
  }

  private clearMoveCamera(): void {
    this.previousMovementData = null;
  }

  private rotateCamera(coords: PointerCoordinates): void {
    const sensitivity = 0.01;

    let phi = 0;
    let theta = 0;

    const previous = this.previousRotationData;

    if (previous !== null) {
      phi = (coords.y - previous.y) * sensitivity;
      theta = (coords.x - previous.x) * sensitivity;
    }

    this.ctx.cameraController.rotateCamera(phi, theta);

    this.previousRotationData = coords;
  }

  private updateCursor(data: PointerCoordinates): void {
    const ctx = this.ctx;

    ctx.setCursor(this.isOverDisplay(data) ? 'pointer' : 'auto');
  }

  private clearRotateCamera(): void {
    this.previousRotationData = null;
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  handleMouseUp(data: MouseData): void {
    this.clearMoveCamera();
    this.clearRotateCamera();
  }

  handleMouseDown(data: MouseData): void {
    if (data.isPrimaryDown()) {
      this.handleDisplayClick(data);
    }
  }

  handleMouseMove(data: MouseData): void {
    if (isRotateCamera(data)) { this.rotateCamera(data.pointerCoordinates()); }
    if (isMoveCamera(data)) { this.moveCamera(data.pointerCoordinates()); }

    this.updateCursor(data);
  }

  handleMouseScroll(data: MouseData): void {
    this.ctx.cameraController.zoom(data.zoomDelta());
  }

  handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'up': return this.handleMouseUp(data);
      case 'down': return this.handleMouseDown(data);
      case 'move': return this.handleMouseMove(data);
      case 'wheel': return this.handleMouseScroll(data);
    }
  }

  handleTouchEvent(data: TouchData) {

  }
}
