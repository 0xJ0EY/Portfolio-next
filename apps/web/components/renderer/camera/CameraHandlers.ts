import { CameraController } from "./Camera";

export class CameraHandlerContext {
  constructor(private cameraController: CameraController) {}

  get camera(): CameraController {
    return this.cameraController;
  }
}

export abstract class CameraHandlerState {
  protected manager: CameraHandler | null = null;
  protected ctx: CameraHandlerContext | null = null;

  setContext(manager: CameraHandler, ctx: CameraHandlerContext): void {
    this.manager = manager;
    this.ctx = ctx;
  }

  abstract onClick(evt: MouseEvent): void;
  abstract onMove(evt: MouseEvent): void;
}

export class CameraHandler {
  private ctx: CameraHandlerContext;
  private state: CameraHandlerState;

  constructor(cameraController: CameraController) {
    this.ctx = new CameraHandlerContext(cameraController);
    
    const state = new FreeRoamCameraState();
    state.setContext(this, this.ctx);

    this.state = state;
  }

  changeState(state: CameraHandlerState) {
    state.setContext(this, this.ctx);
    this.state = state;
  }

  onClick(evt: MouseEvent): void {
    this.state.onClick(evt);
  }

  onMove(evt: MouseEvent): void {
    this.state.onMove(evt);
  }
}

export class FreeRoamCameraState extends CameraHandlerState {
  onClick(evt: MouseEvent): void {
    console.log(evt);
    this.ctx?.camera;
  }

  onMove(evt: MouseEvent): void {
    console.log(evt);
  }
}
