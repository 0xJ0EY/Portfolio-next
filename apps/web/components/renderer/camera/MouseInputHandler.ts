import { CameraController } from "./Camera";

export class MouseInputHandler {
  constructor(private cameraController: CameraController,
    private cssRenderNode: HTMLElement,
    private webglRenderNode: HTMLElement
  ) {
    this.create();
  }

  create(): void {
    this.cssRenderNode.style.touchAction    = 'none';
    this.webglRenderNode.style.touchAction  = 'none';
  }

  update(): void {

  }

  delete(): void {

  }
}