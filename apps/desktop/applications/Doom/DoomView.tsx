import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { Emulators } from "emulators";
import { EmulatorsUi } from "emulators-ui";
import { useEffect, useRef, useState } from "react";

declare const emulators: Emulators;
declare const emulatorsUi: EmulatorsUi;

export default function DoomApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current == null) { return; }

    const ctx = canvasRef.current.getContext('2d');
    emulators.pathPrefix = "/emulators/";
    
    const loadGame = async () => {
      const bundle = await emulatorsUi.network.resolveBundle("/games/doom.jsdos");
      const ciPromise = emulators.dosboxWorker(bundle);

      const rgba = new Uint8ClampedArray(320 * 200 * 4);
      
      ciPromise.then((ci) => {
        emulatorsUi.sound.audioNode(ci);

        ci.events().onFrame((rgb) => {
          for (let next = 0; next < 320 * 200; ++next) {
            rgba[next * 4 + 0] = rgb![next * 3 + 0];
            rgba[next * 4 + 1] = rgb![next * 3 + 1];
            rgba[next * 4 + 2] = rgb![next * 3 + 2];
            rgba[next * 4 + 3] = 255;
          }

          ctx?.putImageData(new ImageData(rgba, 320, 200), 0, 0);
        });
      });
    }

    loadGame().catch(console.error);

    return () => {
      console.log('destroy');
    }
  }, []);

  return (
    <>  
      <canvas ref={canvasRef} width={320} height={200}></canvas>
    </>
  );
}
