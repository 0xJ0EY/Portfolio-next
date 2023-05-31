import { CameraHandler, CameraHandlerContext, PointerData } from "./CameraHandler";

export abstract class CameraState {
  constructor(protected manager: CameraHandler, protected ctx: CameraHandlerContext) { }

  abstract transition(): void;
  isTransitioning(): boolean {
    return this.ctx.cameraController.isTransitioning()
  }

  abstract onPointerUp(data: PointerData): void;
  abstract onPointerDown(data: PointerData): void;
  abstract onPointerMove(data: PointerData): void;
}
