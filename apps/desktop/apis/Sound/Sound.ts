import { ObserverSubject } from "@/data/Observer";

export class SoundService extends ObserverSubject<boolean> {
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
    this.notifyEnabledStatus();
  }

  public disable(): void {
    this.enabled = false;
    this.notifyEnabledStatus();
  }

  private notifyEnabledStatus(): void {
    this.notify(this.enabled);
  }
}
