import { UserInteractionEvent } from "@/events/UserInteractionEvents";
import { CameraHandler, CameraHandlerContext } from "./CameraHandler";

export abstract class CameraState {
  constructor(
    protected manager: CameraHandler,
    protected ctx: CameraHandlerContext
  ) { }

  abstract transition(): void;

  isTransitioning(): boolean {
    return this.ctx.cameraController.isTransitioning()
  }

  abstract onUserEvent(data: UserInteractionEvent): void;
}

export abstract class UpdatableCameraState extends CameraState {
  abstract update(deltaTime: number): void;
}
