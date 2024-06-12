import { MouseData, PointerCoordinates, TouchData, UserInteractionEvent } from "@/events/UserInteractionEvents";
import { UpdatableCameraState } from "../CameraState";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { clickedDOMButton, constructIsOverDisplay, easeInOutSine, getDisplay } from "./util";
import { degToRad } from "three/src/math/MathUtils";
import { Spherical, Vector3 } from "three";

export class CinematicCameraState extends UpdatableCameraState {

  private cameraRotationSpeed = 7.5;

  private hasBeenOverDisplay: boolean = false;
  private isOverDisplay: (data: PointerCoordinates) => boolean;
  private wasOverDisplay: boolean = true;

  private progress: number = 0;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const display = getDisplay(this.ctx.scene);
    if (!display) { return; }

    const position = new Vector3();
    position.y = 6.8;

    const rotation = new Spherical();
    rotation.phi = 1.0;
    rotation.theta = this.calculateRotation(this.progress);

    const zoom = 10.0;

    const delay = this.ctx.isInitialScene() ? 0 : 500;

    this.ctx.cameraController.transition(position, rotation, zoom, delay);
    this.ctx.setCursor('pointer');
  }

  private calculateRotation(progress: number): number {
    const min = degToRad(-30);
    const max = degToRad(30);

    const moveToRight = progress < 50;
    const t = moveToRight ? progress / 50 : (progress - 50) / 50;
    const ease = easeInOutSine(t);

    const delta = max - min;

    if (moveToRight) {
      return min + (delta * ease);
    } else {
      return max - (delta * ease);
    }
  }

  update(deltaTime: number): void {
    this.progress += this.cameraRotationSpeed * deltaTime;

    this.ctx.cameraController.setRotationTheta(this.calculateRotation(this.progress));

    this.progress %= 100;
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  private toggleHasBeenOverDisplay(isOverDisplay: boolean) {
    if (!isOverDisplay) { return; }
    if (this.wasOverDisplay) { return; }

    this.hasBeenOverDisplay = true;
  }

  private handleOverMonitor(data: PointerCoordinates): void {
    const overDisplay = this.isOverDisplay(data);

    this.toggleHasBeenOverDisplay(overDisplay);

    if (overDisplay && this.hasBeenOverDisplay) {
      this.manager.changeState(CameraHandlerState.MonitorView);
    }

    this.wasOverDisplay = overDisplay;
  }

  private handleMouseClickEvent(data: MouseData): void {
    if (!data.isPrimaryDown()) { return; }

    if (clickedDOMButton(true, data.x, data.y)) { return; }

    this.manager.changeState(CameraHandlerState.MonitorView);
  }

  private handleMouseEvent(data: MouseData) {
    this.handleOverMonitor(data);
    this.handleMouseClickEvent(data);
  }

  private handleTouchStartEvents(data: TouchData) {
    const coords = data.pointerCoordinates();
    if (clickedDOMButton(data.hasTouchesDown(1), coords.x, coords.y)) { return; }

    this.manager.changeState(CameraHandlerState.MonitorView);
  }

  private handleTouchEvent(data: TouchData) {
    if (data.source === 'start') {
      this.handleTouchStartEvents(data);
    }
  }
}
