import { Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState, PointerData } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { constructIsOverDisplay } from "./util";

export class MonitorViewCameraState extends CameraState {

  private isOverDisplay: (data: PointerData) => boolean;

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

  onPointerUp(data: PointerData): void {
    const manager = this.manager;
    if (manager === null) { return; }

    manager.changeState(CameraHandlerState.FreeRoam);
  }

  onPointerDown(data: PointerData): void {

  }

  private updateCursor(data: PointerData): void {
    const overDisplay = this.isOverDisplay(data);

    if (overDisplay) {
      this.ctx.disableWebGLPointerEvents();
      this.ctx.setCursor('auto');
    } else {
      this.ctx.enableWebGLPointerEvents();
      this.ctx.setCursor('pointer');
    }
  }

  onPointerMove(data: PointerData): void {
    this.updateCursor(data);
  }
}

