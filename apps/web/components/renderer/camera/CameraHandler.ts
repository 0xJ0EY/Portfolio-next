import { CameraController } from "./Camera";
import { FreeRoamCameraState } from "./states/FreeRoamCameraState";
import { CameraState } from "./CameraState";
import { MonitorViewCameraState } from "./states/MonitorViewCameraState";

export class CameraHandlerContext {
  constructor(private _cameraController: CameraController, private _webglNode: HTMLElement) { }

  get cameraController(): CameraController {
    return this._cameraController;
  }

  get webglNode(): HTMLElement {
    return this._webglNode;
  }

  public setCursor(style: string): void {
    this._webglNode.style.cursor = style;
  }

  public enableWebGLPointerEvents(): void {
    this._webglNode.style.pointerEvents = 'auto';
  }

  public disableWebGLPointerEvents(): void {
    this._webglNode.style.pointerEvents = 'none';
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

export class BoundingBox {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {}

  width(): number {
    return this.x2 - this.x1;
  }

  height(): number {
    return this.y2 - this.y1;
  }

  center(): { x: number, y: number } {
    const x = this.x1 + this.width() / 2;
    const y = this.y1 + this.height() / 2;

    return { x, y };
  }

  diagonal(): number {
    return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2));
  }
}

export class TouchData {
  constructor(private touches: {x: number, y: number}[]) {}

  isRotateEvent(): boolean {
    const fingers = this.touches.length;
    return fingers === 1;
  }

  isPanEvent(): boolean {
    const fingers = this.touches.length;
    return fingers === 3 || fingers === 2;
  }

  isMovementEvent(): boolean {
    const fingers = this.touches.length;
    return fingers === 3 || fingers === 2;
  }

  boundingBox(): BoundingBox {
    if (this.touches.length === 1) {
      const touch = this.touches[0];

      const x = touch.x;
      const y = touch.y;

      return new BoundingBox(x, y, x, y);
    }

    const x = this.touches.map((touch) => touch.x);
    const y = this.touches.map((touch) => touch.y);

    const x1 = Math.min(...x);
    const x2 = Math.max(...x);

    const y1 = Math.min(...y);
    const y2 = Math.max(...y);

    return new BoundingBox(x1, y1, x2, y2);
  }

  static fromTouchEvent(evt: TouchEvent): TouchData {
    let touches = [];

    for (let touch of evt.touches) {
      touches.push({ x: touch.clientX, y: touch.clientY });
    }

    return new TouchData(touches);
  }

  public toPointerData(): PointerData {
    const bb = this.boundingBox();

    const { x, y } = bb.center();

    const isRotation = this.isRotateEvent();
    const isMovement = this.isMovementEvent();

    return new PointerData(x, y, isRotation, isMovement, 0x00);
  }
}

export class PointerData {
  constructor(
    public x: number,
    public y: number,
    public rotateCamera: boolean,
    public moveCamera: boolean,
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

  static fromTouchEvent(evt: TouchEvent): PointerData {
    switch (evt.touches.length) {
      case 1: {
        // Rotate
        const t1 = evt.touches[0];

        const x = t1.clientX;
        const y = t1.clientY;

        return new PointerData(x, y, true, false, 0x00);
      }

      case 2: {
        // Zoom
        return new PointerData(0, 0, false, false, 0x00);
      }

      case 3: {
        // Pan
        const t1 = evt.touches[0];
        const t2 = evt.touches[1];
        const t3 = evt.touches[2];

        const x = (t1.clientX + t2.clientX + t3.clientX) / 3;
        const y = (t1.clientY + t2.clientY + t3.clientY) / 3;

        return new PointerData(x, y, false, true, 0x00);
      }
      default: {
        return new PointerData(0, 0, false, false, 0x00);
      }
    }
  }
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

  getContext(): CameraHandlerContext {
    return this.ctx;
  }

  changeState(state: CameraHandlerState) {
    if (this.state.isTransitioning()) return;

    this.getContext().setCursor('default');

    this.state = this.stateToInstance(state);
    this.state.transition();
  }

  onPointerUp(data: PointerData): void {
    if (this.state.isTransitioning()) return;

    this.state.onPointerUp(data);
  }

  onPointerDown(data: PointerData): void {
    if (this.state.isTransitioning()) return;

    this.state.onPointerDown(data);
  }

  onPointerMove(data: PointerData): void {
    if (this.state.isTransitioning()) return;

    this.state.onPointerMove(data);
  }
}
