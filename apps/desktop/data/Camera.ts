import { CameraZoomDistanceResponse } from "rpc";

export class Camera {
  constructor(
    public readonly minZoom: number,
    public readonly maxZoom: number,
    public currentZoom: number,

    public horizontalOffset: number,
    public readonly maxHorizontalOffset: number,

    public verticalOffset: number,
    public readonly maxVerticalOffset: number,
  ) {}

  public static handleParentResponse(response: CameraZoomDistanceResponse): Camera {
    const minZoom = response.min_distance;
    const maxZoom = response.max_distance;
    const currentZoom = response.current_distance;

    const horizontalOffset = response.horizontal_offset;
    const maxHorizontalOffset = response.max_horizontal_offset;

    const verticalOffset = response.horizontal_offset;
    const maxVerticalOffset = response.horizontal_offset;

    return new Camera(
      minZoom,
      maxZoom,
      currentZoom,
      horizontalOffset,
      maxHorizontalOffset,
      verticalOffset,
      maxVerticalOffset
    );
  }

  get horizontal() {
    return {
      max: this.maxHorizontalOffset,
      current: this.horizontalOffset
    }
  }

  get vertical() {
    return {
      max: this.maxVerticalOffset,
      current: this.verticalOffset
    }
  }

  get zoom() {
    return {
      min: this.minZoom,
      max: this.maxZoom,
      current: this.currentZoom
    }
  }
}
