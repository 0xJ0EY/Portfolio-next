import { AssetKeys } from "@/components/asset-loader/AssetKeys";
import { Vector3, Spherical, PerspectiveCamera, Quaternion, Raycaster, Scene, Object3D, Intersection, Vector } from "three";
import { clamp, degToRad, radToDeg } from "three/src/math/MathUtils";

// Should be responsible for managing the different states of camera
// and that the camera will not collide with the nearest object
export class CameraController {
  private actions: ((deltaTime: number) => boolean)[] = [];

  private enabled: boolean = true;
  private target: Vector3 = new Vector3(0, 0, 0);

  private spherical: Spherical = new Spherical();
  private sphericalDelta: Spherical = new Spherical();

  private panOffset: Vector3 = new Vector3();

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  public minPolarAngle = 0; // radians
  public maxPolarAngle = Math.PI - degToRad(45); // radians

  private quat = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3( 0, 1, 0 ));
  private quatInverse = this.quat.clone().invert();

  private minZoomDistance = 2.5;
  private maxZoomDistance = 15.0;
  private currentZoomDistance = 10;

  constructor(private camera: PerspectiveCamera, private scene: Scene) {}

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public moveCameraForward(distance: number): void {
    const x = distance * Math.sin(this.spherical.theta);
    const z = distance * Math.cos(this.spherical.theta);

    this.panOffset.x -= x;
    this.panOffset.z -= z;
  }

  public moveCameraUp(distance: number): void {
    this.panOffset.y -= distance;
  }

  public moveCameraLeft(distance: number): void {
    // 1.5708 is 90 deg in radians
    const angle = this.spherical.theta + 1.5708;

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

  public transition(targetPosition: Vector3, targetRotation: Spherical, targetZoom: number, durationInMs: number) {
    let timePassedInMs = 0;

    const originalPosition = this.target.clone();
    const originalRotation = this.spherical.clone();
    const originalZoom = this.currentZoomDistance;

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

      return progress === 1;
    }

    this.actions.push(action);
  }

  public getZoom(): number {
    return this.currentZoomDistance;
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

  private getAction(): ((deltaTime: number) => boolean) {
    return this.actions[0];
  }

  private popAction(): ((deltaTime: number) => boolean) {
    return this.actions.shift()!;
  }

  private processActions(deltaTime: number) {
    if (!this.hasActions()) { return; }

    // Disable user interaction when executing actions
    this.enabled = false;

    const action = this.getAction();
    const result = action(deltaTime);

    if (result === true) { this.popAction(); }

    const done = result === true && !this.hasActions();

    if (done) { this.enabled = true; }
  }

  public update(deltaTime: number): void {
    this.processActions(deltaTime);

    const offset: Vector3 = new Vector3();

    offset.copy(this.camera.position).sub(this.target);
    offset.applyQuaternion(this.quat);

    this.spherical.setFromVector3(offset);

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    this.spherical.makeSafe();
    this.spherical.radius = this.calculateRadiusLimit(this.currentZoomDistance);

    offset.setFromSpherical(this.spherical);
    offset.applyQuaternion(this.quatInverse);

    this.target.add(this.panOffset);

    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.sphericalDelta.set(0,0,0);
    this.panOffset.set(0, 0, 0);
  }
};
