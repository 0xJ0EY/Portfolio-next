import { CommandInterface, Emulators } from "emulators";
import { EmulatorsUi } from "emulators-ui";
import { useEffect, useRef, useState } from "react";
import { DosWebGLRenderer } from "./DosWebGLRenderer";
import { SoundService } from "@/apis/Sound/Sound";
import styles from './DosEmulator.module.css';
import { isFirefox } from "../util";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

declare const emulators: Emulators;
declare const emulatorsUi: EmulatorsUi;

const domKeyboardCodeToDosKeyCodes: Record<string, number> = {
  "none": 0,
  "Digit0": 48,
  "Digit1": 49,
  "Digit2": 50,
  "Digit3": 51,
  "Digit4": 52,
  "Digit5": 53,
  "Digit6": 54,
  "Digit7": 55,
  "Digit8": 56,
  "Digit9": 57,
  "KeyA": 65,
  "KeyB": 66,
  "KeyC": 67,
  "KeyD": 68,
  "KeyE": 69,
  "KeyF": 70,
  "KeyG": 71,
  "KeyH": 72,
  "KeyI": 73,
  "KeyJ": 74,
  "KeyK": 75,
  "KeyL": 76,
  "KeyM": 77,
  "KeyN": 78,
  "KeyO": 79,
  "KeyP": 80,
  "KeyQ": 81,
  "KeyR": 82,
  "KeyS": 83,
  "KeyT": 84,
  "KeyU": 85,
  "KeyV": 86,
  "KeyW": 87,
  "KeyX": 88,
  "KeyY": 89,
  "KeyZ": 90,
  "F1": 290,
  "F2": 291,
  "F3": 292,
  "F4": 293,
  "F5": 294,
  "F6": 295,
  "F7": 296,
  "F8": 297,
  "F9": 298,
  "F10": 299,
  "F11": 300,
  "F12": 301,
  "Escape": 256,
  "Tab": 258,
  "Backspace": 259,
  "Enter": 257,
  "Space": 32,
  "MetaLeft": 342,
  "MetaRight": 346,
  "ControlLeft": 341,
  "ControlRight": 345,
  "ShiftLeft": 340,
  "ShiftRight": 344,
  "CapsLock": 280,
  // ScrollLock
  // NumLock
  "Backquote": 96,
  "Backslash": 92,
  "BracketLeft": 91,
  "BracketRight": 93,
  "Quote": 39,
  "Period": 46,
  "Comma": 44,
  "Slash": 47,
  "ArrowUp": 265,
  "ArrowDown": 264,
  "ArrowLeft": 263,
  "ArrowRight": 262,
}

function domKeyboardCodeToDosKeyCode(code: string): number {
  return domKeyboardCodeToDosKeyCodes[code] ?? 0;
}

class Runner {
  private active: boolean = true;
  private volume: number = 0.25;

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
    this.changeVolume(this.volume);
    
    this.renderer = new DosWebGLRenderer(
      settings.canvas,
      this.ci,
      settings.width,
      settings.height,
      () => this.active
   );
  }

  public sendKeyEvent(keyCode: number, pressed: boolean) {
    this.ci?.sendKeyEvent(keyCode, pressed);
  }

  public resize(width: number, height: number): void {
    this.renderer?.resize(width, height);
  }

  public sendMouseClick(button: number, pressed: boolean): void {
    this.ci?.sendMouseButton(button, pressed);
  }

  public sendMouseMovement(x: number, y: number): void {
    this.ci?.sendMouseRelativeMotion(x, y);
  }

  public stop() {
    this.active = false;

    this.changeVolume(0);
    this.ci?.exit();
  }
}

function LoadingScreen(t: TFunction) {
  return (
    <div className="content-outer">
      <div className="content">
        <div className={styles['center']}>
          <span className={styles['loading-text']}>{t('dos_emulator.loading')}</span>
        </div>
      </div>
    </div>
  )
}

export default function DosEmulator(props: { gameLocation: string, soundService: SoundService }) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(true);

  function handleSound(isEnabled: boolean, runner: Runner): void {
    runner.changeVolume(isEnabled ? 0.6 : 0.0);
  }
  
  useEffect(() => {
    emulators.pathPrefix = "/emulators/";

    if (canvasContainerRef.current === null) { return; }
    if (canvasRef.current === null) { return; }

    let movementOrigin: { x: number, y: number } | null = null; 

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

    const handleKeyDown = (evt: KeyboardEvent) => runner.sendKeyEvent(domKeyboardCodeToDosKeyCode(evt.code), true);
    const handleKeyUp = (evt: KeyboardEvent) => runner.sendKeyEvent(domKeyboardCodeToDosKeyCode(evt.code), false);
    
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);

    const hasPointerLock = (): boolean => {
      return document.pointerLockElement === canvasRef.current;
    }

    const requestPointerLock = () => {
      if (!canvasRef.current) { return; }
      const canvas = canvasRef.current;

      canvas.requestPointerLock();
    }

    const handleMouseDown = (evt: MouseEvent) => {
      if (!hasPointerLock()) {
        requestPointerLock();
        return;
      }
      
      runner.sendMouseClick(evt.button, true);
    }

    const handleMouseUp = (evt: MouseEvent) => {
      runner.sendMouseClick(evt.button, false);
    } 

    const onMouseMove = (evt: MouseEvent) => {

      if (isFirefox()) {
        /*
        There is something wrong with the way Firefox calculates the movementX/movementY values
        It is depended on how to outer iframe looks at the monitor. To offset this issue, we take a initial measurement
        That we subtract from every following measurement

        This might have the consequence that the always have the wrong measurement if the initial measurement is off.
        */

        if (movementOrigin === null) {
          movementOrigin = { x: evt.movementX, y: evt.movementY };
        }
  
        const deltaX = evt.movementX - movementOrigin.x;
        const deltaY = evt.movementY - movementOrigin.y;
  
        runner.sendMouseMovement(deltaX, deltaY);
    } else {
        runner.sendMouseMovement(evt.movementX, evt.movementY);
      }
    }

    const onPointerLockChange = () => {
      if (hasPointerLock()) {
        document.addEventListener('mousemove', onMouseMove, false);
      } else {
        document.removeEventListener('mousemove', onMouseMove, false);
      }
    }

    document.addEventListener('pointerlockchange', onPointerLockChange, false);

    canvasRef.current.addEventListener('mousedown', handleMouseDown, false);
    canvasRef.current.addEventListener('mouseup', handleMouseUp, false);

    setIsLoading(true);

    runner.start(
      {
        canvas: canvasRef.current,
        width, height
      },
      props.gameLocation
    ).then(() => { setIsLoading(false) });

    observer.observe(canvasContainerRef.current);

    return () => {
      runner.stop();
      observer.disconnect();
      soundServiceUnsubscribe();

      document.removeEventListener('keydown', handleKeyDown, false);
      document.removeEventListener('keyup', handleKeyUp, false);
      document.removeEventListener('pointerlockchange', onPointerLockChange, false);

      document.removeEventListener('mousemove', onMouseMove, false);
    }
  }, []);

  return (
    <>
      <div className={styles['emulator-container']} ref={canvasContainerRef}>
        {isLoading && LoadingScreen(t)}
        <canvas ref={canvasRef}></canvas>
      </div>
    </>
  );
}