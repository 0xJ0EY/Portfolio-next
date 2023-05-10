import { CameraController } from "./Camera";

export class CameraHandlerContext {
  constructor(private cameraController: CameraController) {}

  get camera(): CameraController {
    return this.cameraController;
  }
}

enum MouseEventButtons {
  None          = 0x00,
  Primary       = 0x01,
  Secondary     = 0x02,
  Auxiliary     = 0x04,
  BackButton    = 0x08,
  ForwardButton = 0x10
}

export class PointerData {
  constructor(
    public x: number,
    public y: number,
    public primaryPointerDown: boolean,
    public secondaryPointerDown: boolean,
  ) {}

  static fromMouseEvent(x: MouseEvent): PointerData {
    return new PointerData(
      x.clientX,
      x.clientY,
      (x.buttons & MouseEventButtons.Primary) === MouseEventButtons.Primary,
      (x.buttons & MouseEventButtons.Secondary) === MouseEventButtons.Secondary
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
}

export class FreeRoamCameraState extends CameraHandlerState {

  private previousMovementData: PointerData | null = null;
  private previousRotationData: PointerData | null = null;

  private moveCamera(data: PointerData): void {
    const sensitivity = 0.005;

    let forward = 0;
    let left = 0;

    const previous = this.previousMovementData;

    if (previous !== null) {
      forward = (data.y - previous.y) * sensitivity;
      left = (data.x - previous.x) * sensitivity;
    }

    this.ctx?.camera.moveCameraForward(forward);
    this.ctx?.camera.moveCameraLeft(left);

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
      phi   = (data.y - previous.y) * sensitivity;
      theta = (data.x -  previous.x) * sensitivity;
    }

    this.ctx?.camera.rotateCamera(phi, theta);

    this.previousRotationData = data;
  }

  private clearRotateCamera(): void {
    this.previousRotationData = null;
  }

  onPointerUp(data: PointerData): void {
    if (!data.primaryPointerDown) { this.clearRotateCamera(); }
    if (!data.secondaryPointerDown) { this.clearMoveCamera(); }
  }

  onPointerDown(data: PointerData): void {
    
  }

  onPointerMove(data: PointerData): void {
    if (data.primaryPointerDown) { this.rotateCamera(data); }
    if (data.secondaryPointerDown) { this.moveCamera(data); }
  }
}
