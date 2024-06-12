import { CameraController } from "./Camera";
import { FreeRoamCameraState } from "./states/FreeRoamCameraState";
import { CameraState, UpdatableCameraState } from "./CameraState";
import { MonitorViewCameraState } from "./states/MonitorViewCameraState";
import { UserInteractionEvent, UserInteractionEventBus } from "@/events/UserInteractionEvents";
import { UnsubscribeHandler } from "@/events/EventBus";
import { Scene } from "three";
import { CinematicCameraState } from "./states/CinematicCameraState";

export class CameraHandlerContext {

  private initialScene = true;

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

  public transitionScene(): void {
    this.initialScene = false;
  }

  public isInitialScene(): boolean {
    return this.initialScene;
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
  Cinematic,
}

export class CameraHandler {
  private ctx: CameraHandlerContext;
  private state: CameraState;

  private userInteractionEventBusUnsubscribeHandler: UnsubscribeHandler;

  constructor(
    cameraController: CameraController,
    webglNode: HTMLElement,
    private userInteractionEventBus: UserInteractionEventBus,
    private onChangeState?: (state: CameraHandlerState) => void
  ) {
    this.ctx = new CameraHandlerContext(cameraController, webglNode);
    this.state = this.stateToInstance(CameraHandlerState.Cinematic)!;

    this.state.transition();

    this.userInteractionEventBusUnsubscribeHandler = this.userInteractionEventBus.subscribe(this.onUserInteractionEvent.bind(this));
  }

  public destroy() {
    this.userInteractionEventBusUnsubscribeHandler();
  }

  private stateToInstance(state: CameraHandlerState): CameraState {
    switch (state) {
      case CameraHandlerState.FreeRoam: return new FreeRoamCameraState(this, this.ctx);
      case CameraHandlerState.MonitorView: return new MonitorViewCameraState(this, this.ctx);
      case CameraHandlerState.Cinematic: return new CinematicCameraState(this, this.ctx);
      default: throw new Error("unsupported state");
    }
  }

  public getContext(): CameraHandlerContext {
    return this.ctx;
  }

  public changeState(state: CameraHandlerState) {
    if (this.state.isTransitioning()) return;

    this.getContext().setCursor('default');

    this.state = this.stateToInstance(state);
    this.state.transition();

    this.getContext().transitionScene();

    if (this.onChangeState) { this.onChangeState(state); }
  }

  public emitUserInteractionEvent(event: UserInteractionEvent) {
    this.userInteractionEventBus.emit(event);
  }

  public onUserInteractionEvent(event: UserInteractionEvent) {
    this.state.onUserEvent(event);
  }

  public update(deltaTime: number): void {
    if (this.state instanceof UpdatableCameraState) {
      this.state.update(deltaTime);
    }
  }
}
