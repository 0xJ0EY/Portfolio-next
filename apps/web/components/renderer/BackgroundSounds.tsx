import { useEffect, useRef } from "react";
import { CameraHandlerState } from "./camera/CameraHandler"
import { SoundService } from "./sound/SoundService"

export type BackgroundSoundsProps = {
  cameraHandlerState: CameraHandlerState,
  soundService: SoundService
}

export function BackgroundSounds(props: BackgroundSoundsProps) {
  const { cameraHandlerState, soundService } = props;
  
  const active = useRef(false);

  useEffect(() => {

    

    return () => {}
  }, []);

  useEffect(() => {
    active.current = cameraHandlerState === CameraHandlerState.MonitorView;
  }, [cameraHandlerState]);

  return <></>
}
