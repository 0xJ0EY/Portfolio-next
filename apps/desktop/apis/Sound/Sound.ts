import { ObserverSubject } from "@/data/Observer";

export class SoundService extends ObserverSubject<boolean> {
  private enabled = true;

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

  public play(source: string): void {
    if (!this.enabled) { return; }

    const audio = new Audio(source);
    audio.play();
  }
}
