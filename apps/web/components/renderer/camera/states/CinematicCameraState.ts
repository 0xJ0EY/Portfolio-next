import { MouseData, PointerCoordinates, TouchData, UserInteractionEvent } from "@/events/UserInteractionEvents";
import { CameraState, UpdatableCameraState } from "../CameraState";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { constructIsOverDisplay } from "./util";
import { degToRad, lerp } from "three/src/math/MathUtils";

export class CinematicCameraState extends UpdatableCameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;
  private progress: number = 0;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    this.ctx.cameraController.enableCameraFollow();
  }

  private calculateRotation(progress: number): number {
    const min = degToRad(-30);
    const max = degToRad(30);

    progress %= 100;

    if (progress < 50) {
      return lerp(min, max, (progress * 2) / 100);
    } else {
      return lerp(max, min, ((progress - 50) * 2) / 100);
    }

    // return 0;

  }

  update(deltaTime: number): void {
    this.progress += 10 * deltaTime;

    this.ctx.cameraController.setRotationPhi(degToRad(50));
    this.ctx.cameraController.setRotationTheta(this.calculateRotation(this.progress));
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }


  private handleMouseOverMonitor(data: PointerCoordinates): void {
    const overDisplay = this.isOverDisplay(data);

    if (overDisplay) {
      this.manager.changeState(CameraHandlerState.MonitorView);
    }
  }

  private handleMouseEvent(data: MouseData) {
    this.handleMouseOverMonitor(data);

  }

  private handleTouchEvent(data: TouchData) {}


}
