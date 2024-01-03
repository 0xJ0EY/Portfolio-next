import { Mesh, Raycaster, Scene, Spherical, Vector2, Vector3 } from "three";
import { CameraHandlerContext } from "../CameraHandler";
import { MouseData, PointerCoordinates, TouchData } from "@/events/UserInteractionEvents";
import { CameraController } from "../Camera";
import { degToRad } from "three/src/math/MathUtils";
import { calculateAspectRatio } from "../../util";
import { DisplayName, DisplayParentName } from "@/components/asset-loader/Loaders";

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

export function isOwnOrigin(data: TouchData): boolean {
  return data.origin === 'self';
}

export function isRpcOrigin(data: TouchData): boolean {
  return data.origin === 'rpc';
}

export const getDisplay = (scene: Scene): Mesh | undefined => {
  // NOTE(Joey): This makes it that there may only be *one* display on the scene.
  const parent = scene.children.find(x => x.name === DisplayParentName);
  const display = parent?.children.find(x => x.name === DisplayName) as Mesh | undefined;

  return display;
}

export const calculateCameraPosition = (display: Mesh, fov: number, zoomDistance: number) => {
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
  spherical.phi = Math.atan2(height, depth) - 0.02;

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

export function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
