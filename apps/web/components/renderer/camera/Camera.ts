import { AssetKeys } from "@/components/asset-loader/AssetKeys";
import { Vector3, Spherical, PerspectiveCamera, Quaternion, Raycaster, Scene, Object3D, Intersection, Vector } from "three";
import { clamp, degToRad, radToDeg } from "three/src/math/MathUtils";


type Action = (deltaTime: number) => ActionResult;

type ActionResult = {
  done: boolean,
  blocking: boolean
}

// Should be responsible for managing the different states of camera
// and that the camera will not collide with the nearest object
export class CameraController {
  private actions: Action[] = [];

  private enabled: boolean = true;
  private target: Vector3 = new Vector3(0, 0, 0);

  private cameraFollowEnabled: boolean = false;
  private cameraFollowLimitMovementSpeed: boolean = true;
  private cameraFollowMaxMovementSpeed: number = 0.35;
  private cameraFollowDampingFactor: number = 2;
  private targetFollowPosition: Vector3 = new Vector3(0, 0, 0);
  private cameraFollowPosition: Vector3 = new Vector3(0, 0, 0);
  private cameraPosition: Vector3 = new Vector3(0, 0, 0);

  private dampingEnabled: boolean = false;
  private dampingFactor: number = 20;

  private origin: Vector3 = new Vector3(0, 0, 0);
  private originBoundaryX: number | null = null;
  private originBoundaryY: number | null = null;
  private originBoundaryZ: number | null = null;

  private spherical: Spherical = new Spherical();
  private sphericalDelta: Spherical = new Spherical();

  private panOffset: Vector3 = new Vector3();

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  public minPolarAngle = 0; // radians
  public maxPolarAngle = Math.PI - degToRad(45); // radians

  private quat = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3(0, 1, 0));
  private quatInverse = this.quat.clone().invert();

  private minZoomDistance = 2.5;
  private maxZoomDistance = 15.0;
  private currentZoomDistance = 10;

  constructor(private camera: PerspectiveCamera, private scene: Scene) {}

  public getTarget(): Vector3 {
    return this.target;
  }

  public getOrigin(): Vector3 {
    return this.origin;
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public enableDamping(): void {
    this.dampingEnabled = true;
  }

  public disableDamping(): void {
    this.dampingEnabled = false;
  }

  public enableCameraFollow(): void {
    this.cameraFollowEnabled = true;
    this.syncFollowPositionToTarget();
  }

  public disableCameraFollow(): void {
    this.cameraFollowEnabled = false;
    this.syncTargetToFollowPosition();
  }

  public syncFollowPositionToTarget(): void {
    this.targetFollowPosition.copy(this.target);
    this.cameraFollowPosition.copy(this.target);
  }

  public syncTargetToFollowPosition(): void {
    this.target.copy(this.targetFollowPosition);
  }

  public enableCameraFollowLimitMovementSpeed(): void {
    this.cameraFollowLimitMovementSpeed = true;
  }

  public disableCameraFollowLimitMovementSpeed(): void {
    this.cameraFollowLimitMovementSpeed = false;
  }

  public setCameraFollowMaxMovementSpeed(value: number): void {
    this.cameraFollowMaxMovementSpeed = value;
  }

  public moveCameraForward(distance: number): void {
    const x = distance * Math.sin(this.spherical.theta);
    const z = distance * Math.cos(this.spherical.theta);

    this.panOffset.x -= x;
    this.panOffset.z -= z;
  }

  public moveToHeight(height: number): void {
    const delta = this.target.y - height;

    this.moveCameraUp(delta);
  }

  public moveCameraUp(distance: number): void {
    this.panOffset.y += distance;
  }

  public moveCameraLeft(distance: number): void {
    const angle = this.spherical.theta + degToRad(90);

    const x = distance * Math.sin(angle);
    const z = distance * Math.cos(angle);

    this.panOffset.x -= x;
    this.panOffset.z -= z;
  }

  public rotateCamera(phi: number, theta: number): void {
    if (!this.enabled) { return; }

    this.sphericalDelta.phi -= phi;
    this.sphericalDelta.theta -= theta;
  }

  public rotateCameraUp(radians: number): void {
    if (!this.enabled) { return; }

    this.sphericalDelta.phi -= radians;
  }

  public rotateCameraLeft(radians: number): void {
    if (!this.enabled) { return; }

    this.sphericalDelta.theta -= radians;
  }

  // TODO: Move this to a math util lib
  private lerp(start: number, end: number, amt: number): number {
    return (1 - amt) * start + amt * end;
  }

  public autoZoom(targetZoom: number, durationInMs: number, callback?: () => void) {
    let timePassedInMs = 0;
    const originalZoom = this.currentZoomDistance;

    const action = (deltaTime: number) => {
      timePassedInMs += 1000 * deltaTime;
      const progress = Math.min(timePassedInMs / durationInMs, 1);

      this.currentZoomDistance = this.lerp(originalZoom, targetZoom, progress);

      const isDone = progress === 1;

      if (isDone && callback !== undefined) {
        callback();
      }

      return { done: isDone, blocking: false };
    }

    this.actions.push(action);
  }

  public transition(
    targetPosition: Vector3,
    targetRotation: Spherical,
    targetZoom: number,
    durationInMs: number,
    callback?: () => void
    ) {
    let timePassedInMs = 0;

    const originalPosition = this.cameraFollowEnabled ? this.targetFollowPosition.clone() : this.target.clone();
    const originalRotation = this.spherical.clone();
    const originalZoom = this.currentZoomDistance;

    this.setOriginToPosition(targetPosition);

    const action = (deltaTime: number) => {
      timePassedInMs += 1000 * deltaTime;
      const progress = Math.min(timePassedInMs / durationInMs, 1);

      const x = this.lerp(originalPosition.x, targetPosition.x, progress);
      const y = this.lerp(originalPosition.y, targetPosition.y, progress);
      const z = this.lerp(originalPosition.z, targetPosition.z, progress);

      const phi   = this.lerp(originalRotation.phi, targetRotation.phi, progress);
      const theta = this.lerp(originalRotation.theta, targetRotation.theta, progress);

      // Calculate deltas for the position / rotation
      this.panOffset.x = -(this.target.x - x);
      this.panOffset.y = -(this.target.y - y);
      this.panOffset.z = -(this.target.z - z);

      this.sphericalDelta.phi   = -(this.spherical.phi - phi);
      this.sphericalDelta.theta = -(this.spherical.theta - theta);

      this.currentZoomDistance = this.lerp(originalZoom, targetZoom, progress);

      const isDone = progress === 1;

      if (isDone && callback !== undefined) {
        callback();
      }

      return { done: isDone, blocking: true };
    }

    this.actions.push(action);
  }

  public getPanOffset(): Vector3 {
    return this.panOffset;
  }

  public setPanOffsetX(value: number): void {
    this.panOffset.setX(value);
  }

  public setPanOffsetY(value: number): void {
    this.panOffset.setY(value);
  }

  public setPanOffsetZ(value: number): void {
    this.panOffset.setZ(value);
  }

  public setMinZoom(zoom: number): void {
    this.minZoomDistance = zoom;
  }

  public getMinZoom(): number {
    return this.minZoomDistance;
  }

  public setMaxZoom(zoom: number): void {
    this.maxZoomDistance = zoom;
  }

  public getMaxZoom(): number {
    return this.maxZoomDistance;
  }

  public getZoom(): number {
    return this.currentZoomDistance;
  }

  public updateOrigin(): void {
    this.setOriginToPosition(this.target);
  }

  public setOriginToPosition(target: Vector3): void {
    this.origin.copy(target);
  }

  public resetOriginBoundary(): void {
    this.setOriginBoundaryX(null);
    this.setOriginBoundaryY(null);
    this.setOriginBoundaryZ(null);
  }

  public getOriginBoundaryX(): number | null {
    return this.originBoundaryX;
  }

  public setOriginBoundaryX(value: number | null) {
    this.originBoundaryX = value;
  }

  public getOriginBoundaryY(): number | null {
    return this.originBoundaryY;
  }

  public setOriginBoundaryY(value: number | null) {
    this.originBoundaryY = value;
  }

  public getOriginBoundaryZ(): number | null {
    return this.originBoundaryZ;
  }

  public setOriginBoundaryZ(value: number | null) {
    this.originBoundaryZ = value;
  }

  public setZoom(distance: number): void {
    this.currentZoomDistance = clamp(
      distance,
      this.minZoomDistance,
      this.maxZoomDistance
    );
  }

  public zoom(amount: number): void {
    const zoom = this.calculateRadiusLimit(this.currentZoomDistance) + amount;

    this.currentZoomDistance = clamp(
      zoom,
      this.minZoomDistance,
      this.maxZoomDistance
    );
  }

  private calculateRadiusLimit: (maxDistance: number) => number = (() => {
    const upperBoundsCaster = new Raycaster();
    const upperBoundsSpherical: Spherical = new Spherical();
    const upperBoundsVector: Vector3 = new Vector3();
    const upperBoundsAngle: number = degToRad(2.5);

    const lowerBoundsCaster = new Raycaster();
    const lowerBoundsSpherical: Spherical = new Spherical();
    const lowerBoundsVector: Vector3 = new Vector3();
    const lowerBoundsAngle: number = degToRad(2.5);

    const findFirstCollidableObject = (intersections: Array<Intersection<Object3D>>): Intersection<Object3D> | null => {
      for (let i = 0; i < intersections.length; i++) {
        const intersection: Intersection<Object3D> = intersections[i];

        if (intersection.object.userData[AssetKeys.CameraCollidable]) {
          return intersection;
        }
      }

      return null;
    }

    return (maxDistance: number): number => {
      upperBoundsCaster.far = maxDistance;
      lowerBoundsCaster.far = maxDistance;

      upperBoundsSpherical.copy(this.spherical).phi += upperBoundsAngle;
      lowerBoundsSpherical.copy(this.spherical).phi -= lowerBoundsAngle;

      upperBoundsVector.setFromSpherical(upperBoundsSpherical).normalize();
      lowerBoundsVector.setFromSpherical(lowerBoundsSpherical).normalize();

      upperBoundsCaster.set(this.target, upperBoundsVector);
      lowerBoundsCaster.set(this.target, lowerBoundsVector);

      const upperIntersect = findFirstCollidableObject(upperBoundsCaster.intersectObjects(this.scene.children));
      const lowerIntersect = findFirstCollidableObject(lowerBoundsCaster.intersectObjects(this.scene.children));

      const upperIntersectDistance = upperIntersect?.distance ?? maxDistance;
      const lowerIntersectDistance = lowerIntersect?.distance ?? maxDistance;

      return Math.min(upperIntersectDistance, lowerIntersectDistance);
    }
  })();

  public isTransitioning(): boolean {
    return this.hasActions();
  }

  private hasActions(): boolean {
    return this.actions.length > 0;
  }

  private getAction(): Action {
    return this.actions[0];
  }

  private popAction(): Action {
    return this.actions.shift()!;
  }

  private processActions(deltaTime: number) {
    if (!this.hasActions()) { return; }

    // Disable user interaction when executing actions
    const action = this.getAction();
    const result = action(deltaTime);

    this.enabled = !result.blocking;

    if (result.done === true) { this.popAction(); }

    const isDone = result.done === true && !this.hasActions();

    if (isDone) { this.enabled = true; }
  }

  public update(deltaTime: number): void {
    this.processActions(deltaTime);

    const dampingFactor = this.dampingFactor * deltaTime;

    const offset: Vector3 = new Vector3();
    offset.copy(this.cameraPosition).sub(this.target);
    offset.applyQuaternion(this.quat);

    this.spherical.setFromVector3(offset);

    if (this.dampingEnabled) {
      this.spherical.theta += this.sphericalDelta.theta * dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * dampingFactor;
    } else {
      this.spherical.theta += this.sphericalDelta.theta;
      this.spherical.phi += this.sphericalDelta.phi;
    }

    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    this.spherical.makeSafe();
    this.spherical.radius = this.calculateRadiusLimit(this.currentZoomDistance);

    offset.setFromSpherical(this.spherical);
    offset.applyQuaternion(this.quatInverse);

    if (this.dampingEnabled) {
      this.target.addScaledVector(this.panOffset, dampingFactor);
    } else {
      this.target.add(this.panOffset);
    }

    function applyBoundaryClamping(clampValue: number, origin: number, value: number): number {
      const upper = value <= origin + clampValue;
      const lower = value >= origin - clampValue;

      if (upper && lower) { return value; }

      return origin + (upper ? -clampValue : clampValue);
    }

    if (this.originBoundaryX) { this.target.setX(applyBoundaryClamping(this.originBoundaryX, this.origin.x, this.target.x)); }
    if (this.originBoundaryY) { this.target.setY(applyBoundaryClamping(this.originBoundaryY, this.origin.y, this.target.y)); }
    if (this.originBoundaryZ) { this.target.setZ(applyBoundaryClamping(this.originBoundaryZ, this.origin.z, this.target.z)); }


    if (this.cameraFollowEnabled) {
      const targetPositionDelta = new Vector3();
      targetPositionDelta.copy(this.target).sub(this.targetFollowPosition);

      if (this.cameraFollowLimitMovementSpeed) {
        const ms = this.cameraFollowMaxMovementSpeed;

        targetPositionDelta.x = clamp(targetPositionDelta.x, -ms, ms);
        targetPositionDelta.y = clamp(targetPositionDelta.y, -ms, ms);
        targetPositionDelta.z = clamp(targetPositionDelta.z, -ms, ms);
      }

      targetPositionDelta.multiplyScalar(this.cameraFollowDampingFactor * deltaTime);
      this.targetFollowPosition.add(targetPositionDelta);

      const followPositionDelta = new Vector3();
      followPositionDelta.copy(this.targetFollowPosition).sub(this.cameraFollowPosition);
      followPositionDelta.multiplyScalar(this.cameraFollowDampingFactor * deltaTime);

      this.cameraFollowPosition.add(followPositionDelta);

      this.cameraPosition.copy(this.target).add(offset);
      this.camera.position.copy(this.cameraFollowPosition).add(offset);

      this.camera.lookAt(this.targetFollowPosition);
    } else {
      this.cameraPosition.copy(this.target).add(offset);
      this.camera.position.copy(this.cameraPosition);

      this.camera.lookAt(this.target);
    }

    if (this.dampingEnabled) {
      this.sphericalDelta.theta *= (1 - dampingFactor);
      this.sphericalDelta.phi   *= (1 - dampingFactor);

      this.panOffset.multiplyScalar(1  - dampingFactor);
    } else {
      this.sphericalDelta.set(0,0,0);
      this.panOffset.set(0, 0, 0);
    }
  }
}
