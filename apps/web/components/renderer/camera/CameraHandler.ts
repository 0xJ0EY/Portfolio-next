import { CameraController } from "./Camera";
import { FreeRoamCameraState } from "./states/FreeRoamCameraState";
import { CameraState } from "./CameraState";
import { MonitorViewCameraState } from "./states/MonitorViewCameraState";
import { UserInteractionEvent, UserInteractionEventBus } from "@/events/UserInteractionEvents";
import { UnsubscribeHandler } from "@/events/EventBus";
import { Scene } from "three";

export class CameraHandlerContext {
  constructor(
    private _cameraController: CameraController,
    private _webglNode: HTMLElement,
  ) { }

  get cameraController(): CameraController {
    return this._cameraController;
  }

  get webglNode(): HTMLElement {
    return this._webglNode;
  }

  get scene(): Scene {
    return this._cameraController.getScene();
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

export enum CameraHandlerState {
  FreeRoam,
  MonitorView,
}

export class CameraHandler {
  private ctx: CameraHandlerContext;
  private state: CameraState;

  private eventBusUnsubscribeHandler: UnsubscribeHandler;

  constructor(
    cameraController: CameraController,
    webglNode: HTMLElement,
    private eventBus: UserInteractionEventBus
  ) {
    this.ctx = new CameraHandlerContext(cameraController, webglNode);

    this.state = this.stateToInstance(CameraHandlerState.FreeRoam)!;
    cameraController.moveCameraUp(5.5); // TODO: Move this to an actual camera init state

    this.eventBusUnsubscribeHandler = this.eventBus.subscribe(this.onUserInteractionEvent.bind(this));
  }

  public destroy() {
    this.eventBusUnsubscribeHandler();
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

  emitUserInteractionEvent(event: UserInteractionEvent) {
    this.eventBus.emit(event);
  }

  onUserInteractionEvent(event: UserInteractionEvent) {
    this.state.onUserEvent(event);
  }
}
