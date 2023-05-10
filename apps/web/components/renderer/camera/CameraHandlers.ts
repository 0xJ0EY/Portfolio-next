import { CameraController } from "./Camera";

export class CameraHandlerContext {
  constructor(private cameraController: CameraController) {}

  get camera(): CameraController {
    return this.cameraController;
  }
}

export class PointerData {
  constructor(
    public x: number,
    public y: number,
    public pointerDown: boolean
  ) {}

  static fromMouseEvent(x: MouseEvent): PointerData {
    return new PointerData(
      x.clientX,
      x.clientY,
      x.buttons > 0
    )
  }
}

export abstract class CameraHandlerState {
  protected manager: CameraHandler | null = null;
  protected ctx: CameraHandlerContext | null = null;

  setContext(manager: CameraHandler, ctx: CameraHandlerContext): void {
    this.manager = manager;
    this.ctx = ctx;
  }

  abstract onPointerUp(data: PointerData): void;
  abstract onPointerDown(data: PointerData): void;
  abstract onPointerMove(data: PointerData): void;
  abstract onPointerDragMove(data: PointerData): void;
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

  onPointerUp(data: PointerData): void {
    this.state.onPointerUp(data);
  }

  onPointerDown(data: PointerData): void {
    this.state.onPointerDown(data);
  }

  onPointerMove(data: PointerData): void {
    this.state.onPointerMove(data);
  }

  onPointerDragMove(data: PointerData): void {
    this.state.onPointerDragMove(data);
  }
}

export class FreeRoamCameraState extends CameraHandlerState {

  private previousData: PointerData | null = null;

  onPointerUp(data: PointerData): void {
    this.previousData = null;
  }

  onPointerDown(data: PointerData): void {
    this.previousData = data;
  }

  onPointerMove(data: PointerData): void {
    if (!data.pointerDown) { return; }

    const sensitivity = 0.01;

    let phi = 0;
    let theta = 0;

    if (this.previousData !== null) {
      phi   = (data.y - this.previousData.y) * sensitivity;
      theta = (data.x - this.previousData.x) * sensitivity;
    }

    this.ctx?.camera.rotateCamera(phi, theta);

    this.previousData = data;
  }

  onPointerDragMove(data: PointerData): void {
    this.previousData = data;
  }
}
