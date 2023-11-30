import { Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { PanOriginData, constructIsOverDisplay, isMouseMoveCamera, isMouseRotateCamera, isTouchMoveCamera, isTouchRotateCamera, isTouchTap, isTouchZoom } from "./util";
import { MouseData, PointerCoordinates, TouchConfirmationData, TouchData, UserInteractionEvent, toUserInteractionTouchConfirmationEvent } from "@/events/UserInteractionEvents";

export class FreeRoamCameraState extends CameraState {

  private previousMovementData: PointerCoordinates | null = null;
  private previousRotationData: PointerCoordinates | null = null;

  private panOrigin: PanOriginData | null = null;

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    this.ctx.enableWebGLPointerEvents();

    const position = new Vector3();
    position.y = 5.5;

    const rotation = new Spherical();
    rotation.phi = 1.0;
    rotation.theta = 0.0;

    const zoom = 10.0;

    this.ctx.cameraController.moveCameraUp(5.5);

    this.ctx.cameraController.transition(position, rotation, zoom, 1000);
    // this.ctx.cameraController.autoZoom(zoom, 1000);
    this.ctx.cameraController.enableCameraFollow();
    this.ctx.cameraController.disableCameraFollow();

    this.ctx.cameraController.setMinZoom(2.0);
    this.ctx.cameraController.setMaxZoom(15.0);

    this.ctx.cameraController.setOriginBoundaryX(null);
    this.ctx.cameraController.setOriginBoundaryY(null);
    this.ctx.cameraController.setOriginBoundaryZ(null);
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

  private handleMouseUp(data: MouseData): void {
    this.clearMoveCamera();
    this.clearRotateCamera();
  }

  private handleMouseDown(data: MouseData): void {
    if (data.isPrimaryDown()) {
      this.handleDisplayClick(data);
    }
  }

  private handleMouseMove(data: MouseData): void {
    if (isMouseRotateCamera(data)) { this.rotateCamera(data.pointerCoordinates()); }
    if (isMouseMoveCamera(data)) { this.moveCamera(data.pointerCoordinates()); }

    this.updateCursor(data);
  }

  private handleMouseScroll(data: MouseData): void {
    this.ctx.cameraController.zoom(data.zoomDelta());
  }

  private handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'up': return this.handleMouseUp(data);
      case 'down': return this.handleMouseDown(data);
      case 'move': return this.handleMouseMove(data);
      case 'wheel': return this.handleMouseScroll(data);
    }
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

    this.ctx.cameraController.setZoom(zoomDistance - zoomOffset);
  }

  private handleTouchDisplayClick(data: TouchData) {
    if (!this.isOverDisplay(data.pointerCoordinates())) { return; }

    const onSuccess = () => {
      this.manager.changeState(CameraHandlerState.MonitorView);
    };

    const confirm = TouchConfirmationData.fromTouchData(
      data,
      600,
      onSuccess,
      null,
    );

    const confirmEvent = toUserInteractionTouchConfirmationEvent(confirm);

    this.manager.emitUserInteractionEvent(confirmEvent);
  }

  private handleTouchStart(data: TouchData) {
    if (isTouchTap(data)) {
      this.handleTouchDisplayClick(data);
    }

    this.setupZoomEvent(data);
    this.clearMoveCamera();
    this.clearRotateCamera();
  }

  private handleTouchMove(data: TouchData) {
    if (isTouchMoveCamera(data)) { this.moveCamera(data.pointerCoordinates()); }
    if (isTouchRotateCamera(data)) { this.rotateCamera(data.pointerCoordinates()); }
    if (isTouchZoom(data)) { this.handleZoomEvent(data); }
  }

  private handleTouchEnd(data: TouchData) {
    this.clearMoveCamera();
    this.clearRotateCamera();
  }

  private handleTouchEvent(data: TouchData) {
    switch (data.source) {
      case "start": return this.handleTouchStart(data);
      case "move": return this.handleTouchMove(data);
      case "end": return this.handleTouchEnd(data);
    }
  }
}
