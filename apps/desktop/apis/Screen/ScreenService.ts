import { ObserverSubject } from "@/data/Observer"

const MobileDeviceWidthThreshold = 700;

export class ScreenResolution {
  constructor(
    public width: number,
    public height: number
  ) {}

  public isMobileDevice(): boolean {
    return this.width < MobileDeviceWidthThreshold;
  }
}

export class ScreenService extends ObserverSubject<ScreenResolution> {
  private resolution: ScreenResolution | null = null;

  public getResolution(): ScreenResolution | null {
    return this.resolution;
  }

  public setResolution(width: number, height: number): void {
    this.resolution = new ScreenResolution(width, height);

    this.notify(this.resolution);
  }
}
