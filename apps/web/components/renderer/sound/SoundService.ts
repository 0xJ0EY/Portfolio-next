import { sendMessageToChild } from "rpc";

export type SoundServiceObserver = (enabled: boolean) => void;
export type SoundServiceAction = () => void;

export class SoundService {
  private observers: (SoundServiceObserver)[] = [];
  private enabled: boolean = false;

  private index = 0;
  private activeAudio: HTMLAudioElement[] = [];

  private notifyOtherWebpage(enabled: boolean) {
    const iframe = document.getElementById('operating-system-iframe') as HTMLIFrameElement;
    sendMessageToChild(iframe.contentWindow, { method: 'enable_sound_message', enabled });
  }

  private notify(status: boolean): void {
    for (const listener of this.observers) {
      listener(status);
    }
  }

  public enable(): void {
    this.enabled = true;
    this.notify(this.enabled);
    this.notifyOtherWebpage(this.enabled);
  }

  public disable(): void {
    this.enabled = false;
    this.notify(this.enabled);
    this.notifyOtherWebpage(this.enabled);
  }

  public mute(index: number): void {
    const audio = this.activeAudio[index] ?? null;

    if (!audio) { return; }

    audio.muted = true;
  }

  public unmute(index: number): void {
    const audio = this.activeAudio[index] ?? null;

    if (!audio) { return; }

    audio.muted = false;
  }

  public volume(index: number, volume: number): void {
    const audio = this.activeAudio[index] ?? null;

    if (!audio) { return; }

    audio.volume = volume;
  }

  // NOTE(Joey): Due to how the Audio interface only mutes and unmutes its own "audio" and not other audio elements that might be
  // toggled by the isEnabled status. Having these methods public might give the wrong impression, so we refrain from that.
  private muteAll(): void {
    for (const key of this.activeAudio.keys()) {
      this.mute(key);
    }
  }

  private unmuteAll(): void {
    for (const key of this.activeAudio.keys()) {
      this.unmute(key);
    }
  }

  public stop(index: number): void {
    const audio = this.activeAudio[index] ?? null;

    if (!audio) { return; }

    audio.pause();
    delete this.activeAudio[index];
  }

  public clear(): void {
    this.index = 0;
    this.activeAudio = [];
  }

  public play(source: string, volume: number = 1.0): number {
    const currentIndex = this.index++;

    const audio = new Audio(source);
    audio.volume = volume;
    audio.muted = !this.enabled;
    audio.play();

    this.activeAudio[currentIndex] = audio;
    audio.addEventListener('ended', () => { delete this.activeAudio[currentIndex]; });

    return currentIndex;
  }

  public playOnRepeat(source: string, volume: number = 1.0): number {
    const currentIndex = this.index++;

    const audio = new Audio(source);
    audio.volume = volume;
    audio.muted = !this.enabled;
    audio.play();

    this.activeAudio[currentIndex] = audio;

    audio.addEventListener('ended', () => { this.activeAudio[currentIndex]?.play(); });

    return currentIndex;
  }

  public subscribe(listener: SoundServiceObserver): SoundServiceAction {
    this.observers.push(listener);

    return () => { this.unsubscribe(listener); };
  }

  public unsubscribe(listener: SoundServiceObserver): void {
    for (const [index, observer] of this.observers.entries()) {
      if (observer === listener) {
        this.observers.splice(index);
        return;
      }
    }
  }
}
