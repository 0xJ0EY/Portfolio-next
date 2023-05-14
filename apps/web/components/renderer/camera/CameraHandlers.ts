import { Camera, Raycaster, Spherical, Vector2, Vector3 } from "three";
import { CameraController } from "./Camera";

export class CameraHandlerContext {
  constructor(private _cameraController: CameraController, private _webglNode: HTMLElement) { }

  get cameraController(): CameraController {
    return this._cameraController;
  }

  get webglNode(): HTMLElement {
    return this._webglNode;
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

abstract class CameraState {
  constructor(protected manager: CameraHandler, protected ctx: CameraHandlerContext) {}

  abstract transition(): void;
  abstract onPointerUp(data: PointerData): void;
  abstract onPointerDown(data: PointerData): void;
  abstract onPointerMove(data: PointerData): void;
}

export enum CameraHandlerState {
  FreeRoam,
  MonitorView,
}

export class CameraHandler {
  private ctx: CameraHandlerContext;
  private state: CameraState;

  constructor(cameraController: CameraController, webglNode: HTMLElement) {
    this.ctx = new CameraHandlerContext(cameraController, webglNode);
    this.state = this.stateToInstance(CameraHandlerState.FreeRoam)!;
  }

  private stateToInstance(state: CameraHandlerState): CameraState {
    switch (state) {
      case CameraHandlerState.FreeRoam: return new FreeRoamCameraState(this, this.ctx);
      case CameraHandlerState.MonitorView: return new MonitorViewCameraState(this, this.ctx);
      default: throw new Error("unsupported state");
    }
  }

  changeState(state: CameraHandlerState) {
    this.state = this.stateToInstance(state);
    this.state.transition();
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

class MonitorViewCameraState extends CameraState {
  transition(): void {
    const ctx = this.ctx;
    if (ctx === null) { return; }

    const position = new Vector3();
    position.y = 0.5;

    const rotation = new Spherical();
    rotation.phi = 1.2;
    rotation.theta = 0.0;

    const zoom = 5.0;

    ctx.cameraController.transition(position, rotation, zoom, 1000); 

    ctx.webglNode.style.pointerEvents = 'none';
  }
  
  onPointerUp(data: PointerData): void {
    const manager = this.manager;
    if (manager === null) { return; }

    manager.changeState(CameraHandlerState.FreeRoam);
  }

  onPointerDown(data: PointerData): void {
    
  }
  
  onPointerMove(data: PointerData): void {
    
  }
}

class FreeRoamCameraState extends CameraState {
  
  private previousMovementData: PointerData | null = null;
  private previousRotationData: PointerData | null = null;

  transition(): void {
    const ctx = this.ctx;
    if (ctx === null) { return; }
    
    ctx.webglNode.style.pointerEvents = 'auto';

    const position = new Vector3();

    const rotation = new Spherical();
    rotation.phi = 1.0;
    rotation.theta = 0.0;

    const zoom = 10.0;

    ctx.cameraController.transition(position, rotation, zoom, 1000); 
  }

  private handleDisplayClick(data: PointerData): void {
    const ctx = this.ctx;
    if (ctx === null) { return; }

    const manager = this.manager;
    if (manager === null) { return; }

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

    manager.changeState(CameraHandlerState.MonitorView);
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
