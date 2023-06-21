import { ArrowHelper, BoxGeometry, Euler, Mesh, MeshBasicMaterial, Scene, Spherical, Vector3 } from "three";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { CameraState } from "../CameraState";
import { constructIsOverDisplay } from "./util";
import { MouseData, PointerCoordinates, TouchConfirmationData, TouchData, UserInteractionEvent, toUserInteractionTouchConfirmationEvent } from "@/events/UserInteractionEvents";
import { DisplayName, DisplayParentName } from "@/components/asset-loader/Loaders";
import { degToRad } from "three/src/math/MathUtils";
import { calculateAspectRatio } from "../../util";

function isTouchTap(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

const getDisplay = (scene: Scene): Mesh | undefined => {
  // NOTE(Joey): This makes it that there may only be *one* display on the scene.
  const parent = scene.children.find(x => x.name === DisplayParentName);
  const display = parent?.children.find(x => x.name === DisplayName) as Mesh | undefined;

  return display;
}

const calculateCameraPosition = (display: Mesh, fov: number) => {
  const zoomDistance = 3; // User defined number for setting up the zoom
  const bb = display.geometry.boundingBox!;

  const width   = bb.max.x - bb.min.x;
  const height  = bb.max.y - bb.min.y;
  const depth   = bb.max.z - bb.min.z;

  const centerPoint = new Vector3(
    bb.min.x + width / 2,
    bb.min.y + height / 2,
    bb.min.z + depth / 2
  );

  const position = new Vector3();
  position.add(display.position);
  position.add(centerPoint);

  const spherical = new Spherical();
  spherical.phi = Math.atan2(height, depth);

  const rotation = new Vector3();
  rotation.setFromSpherical(spherical);
  // TODO: Calculate in rotation, prob from mesh self, as bounding box does not contain the information needed

  const fovAngle      = fov / 2;
  const oppositeAngle = Math.tan(degToRad(fovAngle));

  const [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight];
  const aspectRatio = calculateAspectRatio(windowWidth, windowHeight);
  const zoom = zoomDistance / aspectRatio;

  const distance = oppositeAngle * ((width / 2) + zoom);

  return {
    spherical,
    position,
    distance
  }
}

export class MonitorViewCameraState extends CameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {
    const display = getDisplay(this.ctx.scene);
    if (!display) { return; }

    const cameraFov = this.ctx.cameraController.getCamera().fov;
    const { spherical, position, distance } = calculateCameraPosition(display, cameraFov);

    const callback = () => {
      this.ctx.disableWebGLPointerEvents();
    }

    this.ctx.cameraController.transition(position, spherical, distance, 1000, callback);
  }

  private updateCursor(data: PointerCoordinates): void {
    const overDisplay = this.isOverDisplay(data);

    if (overDisplay) {
      this.ctx.disableWebGLPointerEvents();
      this.ctx.setCursor('auto');
    } else {
      this.ctx.enableWebGLPointerEvents();
      this.ctx.setCursor('pointer');
    }
  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }

  handleMouseUp(data: MouseData): void {
    this.manager.changeState(CameraHandlerState.FreeRoam);
  }

  handleMouseMove(data: MouseData): void {
    this.updateCursor(data.pointerCoordinates());
  }

  handleMouseScroll(data: MouseData): void {
    this.ctx.cameraController.zoom(data.zoomDelta());
  }

  handleMouseEvent(data: MouseData) {
    switch (data.source) {
      case 'up': return this.handleMouseUp(data);
      case 'move': return this.handleMouseMove(data);
    }
  }

  private handleTouchOutsideDisplay(data: TouchData) {
    const onSuccess = () => {
      this.manager.changeState(CameraHandlerState.FreeRoam);
    };

    const confirm = TouchConfirmationData.fromTouchData(
      data,
      600,
      onSuccess,
      null
    );

    const event = toUserInteractionTouchConfirmationEvent(confirm);
    this.manager.emitUserInteractionEvent(event);
  }

  private handleTouchStart(data: TouchData) {
    if (isTouchTap(data)) {
      this.handleTouchOutsideDisplay(data);
    }
  }

  private handleTouchEvent(data: TouchData) {
    if (data.source === 'start') {
      this.handleTouchStart(data);
    }
  }
}
