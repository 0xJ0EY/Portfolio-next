import { CommandInterface, Emulators } from "emulators";
import { EmulatorsUi } from "emulators-ui";
import { Layers } from "emulators-ui/dist/types/dom/layers";
import { useEffect, useRef, useState } from "react";

declare const emulators: Emulators;
declare const emulatorsUi: EmulatorsUi;


class Runner {
  private active: boolean = true;
  private audioHandler: ((volume: number) => void) | null = null;
  private ci: CommandInterface | null = null;

  constructor() {}

  private changeVolume(volume: number): void {
    if (!this.audioHandler) { return; }

    this.audioHandler(volume);
  }

  public async start(canvas: HTMLCanvasElement, gameLocation: string) {
    // this.active = true;
    const bundle = await emulatorsUi.network.resolveBundle(gameLocation);
    this.ci = await emulators.dosboxWorker(bundle);

    this.audioHandler = emulatorsUi.sound.audioNode(this.ci);

    const rgba = new Uint8ClampedArray(320 * 200 * 4);
    

    // This is a quite leaky abstraction, because we force as cast to layers
    // This is due to me not wanting to implementing everything there is in the layers object
    // and the webgl function only depending on a few items
    // const layers = {
    //   canvas,
    //   width: canvas.clientWidth,
    //   height: canvas.clientHeight,
    //   addOnResize: (params: (w: number, h: number) => {}) => {},
    //   removeOnResize: (params: (w: number, h: number) => {}) => {},
    // } as Layers;

    // emulatorsUi.graphics.webGl(layers, this.ci);
    

    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    this.ci.events().onFrame((rgb) => {
      if (!this.active || !rgb) { this.ci?.exit(); return; }

      for (let frame = 0; frame < 320 * 200; ++frame) {
        rgba[frame * 4 + 0] = rgb![frame * 3 + 0];
        rgba[frame * 4 + 1] = rgb![frame * 3 + 1];
        rgba[frame * 4 + 2] = rgb![frame * 3 + 2];
        rgba[frame * 4 + 3] = 255;
      }

      ctx.putImageData(new ImageData(rgba, 320, 200), 0, 0);
    });
  }

  public stop() {
    this.changeVolume(0);
    this.ci?.exit();
    this.active = false;
  }
}

export default function DosEmulator(props: { gameLocation: string }) { 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    emulators.pathPrefix = "/emulators/";

    if (canvasRef.current === null) { return; }

    const runner = new Runner();
    
    runner.start(canvasRef.current, props.gameLocation);

    return () => {
      console.log('destroy');
      runner.stop();
    }
  }, []);

  return (
    <>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}