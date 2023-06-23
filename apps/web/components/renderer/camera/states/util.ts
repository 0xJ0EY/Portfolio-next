import { Raycaster, Vector2 } from "three";
import { CameraHandlerContext } from "../CameraHandler";
import { PointerCoordinates } from "@/events/UserInteractionEvents";

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