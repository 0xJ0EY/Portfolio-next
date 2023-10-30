import { Raycaster, Vector2 } from "three";
import { CameraHandlerContext } from "../CameraHandler";
import { MouseData, PointerCoordinates, TouchData } from "@/events/UserInteractionEvents";
import { CameraController } from "../Camera";

export const constructIsOverDisplay = (ctx: CameraHandlerContext): ((data: PointerCoordinates) => boolean) => {
  // Use a closure so we don't need to init a new raycaster whenever isOverDisplay is called (every mouse movement)
  const raycaster = new Raycaster();
  const point = new Vector2();

  return (data: PointerCoordinates) => {
    point.x = (data.x / window.innerWidth) * 2 - 1;
    point.y = -(data.y / window.innerHeight) * 2 + 1;

    const camera = ctx.cameraController.getCamera();
    raycaster.setFromCamera(point, camera);

    const intersects = raycaster.intersectObjects(ctx.cameraController.getScene().children);
    const first = intersects[0] ?? null;

    if (first === null) { return false; }
    if (first.object.name !== "Display") { return false; }

    return true;
  }
}

export function isMouseRotateCamera(data: MouseData): boolean {
  return data.isPrimaryDown();
}

export function isTouchTap(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

export function isTouchRotateCamera(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

export function isMouseMoveCamera(data: MouseData): boolean {
  return data.isSecondaryDown();
}

export function isTouchMoveCamera(data: TouchData): boolean {
  return data.hasTouchesDown(2) || data.hasTouchesDown(3);
}

export function isTouchZoom(data: TouchData): boolean {
  return data.hasTouchesDown(2);
}

export class PanOriginData {
  constructor(
    public touchData: TouchData,
    public zoomDistance: number
  ) {}

  static create(cameraController: CameraController, touchData: TouchData): PanOriginData {
    return new PanOriginData(touchData, cameraController.getZoom());
  }
}
