import { Camera, Raycaster, Vector2 } from "three";
import { CameraController } from "./Camera";

export class CameraHandlerContext {
  constructor(private _cameraController: CameraController) { }

  get cameraController(): CameraController {
    return this._cameraController;
  }
}

export enum MouseEventButton {
  None          = 0x00,
  Primary       = 0x01,
  Secondary     = 0x02,
  Auxiliary     = 0x04,
  BackButton    = 0x08,
  ForwardButton = 0x10
}

const buttonToMouseEventButton = (value: number): MouseEventButton => {
  switch (value) {
    case 0: return MouseEventButton.Primary;
    case 1: return MouseEventButton.Secondary;
    case 2: return MouseEventButton.Auxiliary;
    case 3: return MouseEventButton.BackButton;
    case 4: return MouseEventButton.ForwardButton;
    default: return MouseEventButton.None;
  }
}

export class PointerData {
  constructor(
    public x: number,
    public y: number,
    public primaryPointerDown: boolean,
    public secondaryPointerDown: boolean,
    public buttonDown: MouseEventButton
  ) { }

  static fromMouseEvent(x: MouseEvent): PointerData {
    return new PointerData(
      x.clientX,
      x.clientY,
      (x.buttons & MouseEventButton.Primary) === MouseEventButton.Primary,
      (x.buttons & MouseEventButton.Secondary) === MouseEventButton.Secondary,
      buttonToMouseEventButton(x.button)
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

export class MonitorViewCameraState extends CameraHandlerState {
  onPointerUp(data: PointerData): void {
    
  }

  onPointerDown(data: PointerData): void {
    
  }
  
  onPointerMove(data: PointerData): void {
    
  }
}

export class FreeRoamCameraState extends CameraHandlerState {

  private previousMovementData: PointerData | null = null;
  private previousRotationData: PointerData | null = null;

  private handleDisplayClick(data: PointerData): void {
    const ctx = this.ctx;
    if (ctx === null) { return }

    const manager = this.manager;
    if (manager === null) { return }

    const raycaster = new Raycaster();
    const point     = new Vector2();

    point.x = (data.x / window.innerWidth) * 2 - 1;
    point.y = -(data.y / window.innerHeight) * 2 + 1;

    const camera = ctx.cameraController.getCamera();
    raycaster.setFromCamera(point, camera);

    const intersects = raycaster.intersectObjects(ctx.cameraController.getScene().children);
    const first = intersects[0] ?? null;

    if (first === null) { return; }
    if (first.object.name !== "Display") { return; }

    manager.changeState(new MonitorViewCameraState());
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

    this.ctx?.cameraController.moveCameraForward(forward);
    this.ctx?.cameraController.moveCameraLeft(left);

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

    this.ctx?.cameraController.rotateCamera(phi, theta);

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
    if (data.buttonDown === MouseEventButton.Primary) { this.handleDisplayClick(data); }
  }

  onPointerMove(data: PointerData): void {
    if (data.primaryPointerDown) { this.rotateCamera(data); }
    if (data.secondaryPointerDown) { this.moveCamera(data); }
  }
}
