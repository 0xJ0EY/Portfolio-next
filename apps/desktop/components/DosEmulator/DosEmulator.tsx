import { CommandInterface, Emulators } from "emulators";
import { EmulatorsUi } from "emulators-ui";
import { useEffect, useRef } from "react";
import { DosWebGLRenderer } from "./DosWebGLRenderer";
import { SoundService } from "@/apis/Sound/Sound";
import styles from './DosEmulator.module.css';

declare const emulators: Emulators;
declare const emulatorsUi: EmulatorsUi;

class Runner {
  private active: boolean = true;
  private volume: number = 1.0;

  private audioHandler: ((volume: number) => void) | null = null;
  private ci: CommandInterface | null = null;

  private renderer: DosWebGLRenderer | null = null;

  public changeVolume(volume: number): void {
    this.volume = volume;

    if (!this.audioHandler) { return; }
    this.audioHandler(this.volume);
  }

  public async start(
    settings: {
      canvas: HTMLCanvasElement,
      width: number,
      height: number
    },
    gameLocation: string
  ) {
    this.active = true;

    const bundle = await emulatorsUi.network.resolveBundle(gameLocation);
    this.ci = await emulators.dosboxWorker(bundle);

    this.audioHandler = emulatorsUi.sound.audioNode(this.ci);

    console.log(this.volume);
    this.changeVolume(this.volume);
    
    this.renderer = new DosWebGLRenderer(
      settings.canvas,
      this.ci,
      settings.width,
      settings.height,
      () => this.active
   );
  }

  public resize(width: number, height: number): void {
    this.renderer?.resize(width, height);
  }

  public stop() {
    this.active = false;

    this.changeVolume(0);
    this.ci?.exit();
  }
}

export default function DosEmulator(props: { gameLocation: string, soundService: SoundService }) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleSound(isEnabled: boolean, runner: Runner): void {
    runner.changeVolume(isEnabled ? 0.6 : 0.0);
  }
  
  useEffect(() => {
    emulators.pathPrefix = "/emulators/";

    if (canvasContainerRef.current === null) { return; }
    if (canvasRef.current === null) { return; }

    const runner = new Runner();
    const observer = new ResizeObserver((target) => {
      const width   = target[0].target.clientWidth;
      const height  = target[0].target.clientHeight;

      runner.resize(width, height);
    });

    const width   = canvasContainerRef.current.clientWidth;
    const height  = canvasContainerRef.current.clientHeight;

    const soundServiceUnsubscribe = props.soundService.subscribe((isEnabled) => handleSound(isEnabled, runner));
    handleSound(props.soundService.isEnabled(), runner);

    runner.start(
      {
        canvas: canvasRef.current,
        width, height
      },
      props.gameLocation
    );

    observer.observe(canvasContainerRef.current);

    return () => {
      runner.stop();
      observer.disconnect();
      soundServiceUnsubscribe();
    }
  }, []);

  return (
    <>
      <div className={styles['emulator-container']} ref={canvasContainerRef}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </>
  );
}