import { Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState, MouseEventButton, PointerData } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { constructIsOverDisplay } from "./util";

export class FreeRoamCameraState extends CameraState {

  private previousMovementData: PointerData | null = null;
  private previousRotationData: PointerData | null = null;

  private isOverDisplay: (data: PointerData) => boolean;

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

  private handleDisplayClick(data: PointerData): void {
    if (!this.isOverDisplay(data)) { return; }

    this.manager.changeState(CameraHandlerState.MonitorView);
  }

  private moveCamera(data: PointerData): void {
    const sensitivity = 0.005;

    let forward = 0;
    let left = 0;

    const previous = this.previousMovementData;

    if (previous !== null) {
      forward = (data.y - previous.y) * sensitivity;
      left = (data.x - previous.x) * sensitivity;
    }

    this.ctx.cameraController.moveCameraForward(forward);
    this.ctx.cameraController.moveCameraLeft(left);

    this.previousMovementData = data;
  }

  private clearMoveCamera(): void {
    this.previousMovementData = null;
  }

  private rotateCamera(data: PointerData): void {
    const sensitivity = 0.01;

    let phi = 0;
    let theta = 0;

    const previous = this.previousRotationData;

    if (previous !== null) {
      phi = (data.y - previous.y) * sensitivity;
      theta = (data.x - previous.x) * sensitivity;
    }

    this.ctx.cameraController.rotateCamera(phi, theta);

    this.previousRotationData = data;
  }

  private clearRotateCamera(): void {
    this.previousRotationData = null;
  }

  onPointerUp(data: PointerData): void {
    this.clearMoveCamera();
    this.clearRotateCamera();
  }

  onPointerDown(data: PointerData): void {
    if (data.buttonDown === MouseEventButton.Primary) { this.handleDisplayClick(data); }
  }

  private updateCursor(data: PointerData): void {
    const ctx = this.ctx;

    ctx.setCursor(this.isOverDisplay(data) ? 'pointer' : 'auto');
  }

  onPointerMove(data: PointerData): void {
    if (data.rotateCamera) { this.rotateCamera(data); }
    if (data.moveCamera) { this.moveCamera(data); }

    this.updateCursor(data);
  }
}
