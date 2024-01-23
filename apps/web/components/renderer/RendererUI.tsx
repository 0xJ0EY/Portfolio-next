import { useState } from "react";
import { CameraHandlerState } from "./camera/CameraHandler";
import styles from "./RendererUI.module.css"
import { sendMessageToChild } from "rpc";

function useSoundManagement() {
  const [isSoundEnabled, setSoundEnabled] = useState(true);

  function toggleSound() {
    if (isSoundEnabled) {
      disableSound();
    } else {
      enableSound();
    }
  }

  function sendSoundStateToChild(enabled: boolean) {
    const iframe = document.getElementById('operating-system-iframe') as HTMLIFrameElement;
    sendMessageToChild(iframe.contentWindow, { method: 'enable_sound_message', enabled });
  }

  function enableSound() {
    setSoundEnabled(true);
    sendSoundStateToChild(true);
  }

  function disableSound() {
    setSoundEnabled(false);
    sendSoundStateToChild(false);
  }

  return {isSoundEnabled, toggleSound, enableSound, disableSound};
}

export type RendererUIProps = {
  cameraHandlerState: CameraHandlerState
}

type SubViewSound = {
  isSoundEnabled: boolean,
  toggleSound: () => void
}

type SubViewProps = {
  sound: SubViewSound,
}

function SoundManagementButton(props: { sound: SubViewSound }) {
  const { isSoundEnabled, toggleSound } = props.sound;

  return <button className={styles['mute-button']} onClick={() => toggleSound()}>{isSoundEnabled ? 'Mute' : 'Unmute'}</button>
}

function FreeRoamUI(props: SubViewProps) {
  return <>
    FreeRoam
    <SoundManagementButton sound={props.sound}/>
  </>
}

function MonitorViewUI(props: SubViewProps) {
  return <>
    Monitor
    <SoundManagementButton sound={props.sound}/>
  </>
}

function CinematicUI(props: SubViewProps) {
  return <>
    Cinematic
    <SoundManagementButton sound={props.sound}/>
  </>
}

function DeskViewUI(props: SubViewProps) {
  return <>
    DeskView
    <SoundManagementButton sound={props.sound}/>  
  </>
}

export function RendererUI(props: RendererUIProps) {
  const { cameraHandlerState } = props;
  const soundManagement = useSoundManagement();

  // A switch statement wrapped in a function breaks the rules of hooks, but this doesn't?
  // Just looks ugly, but it works
  return (
    <div className={styles['ui']}>
      {cameraHandlerState === CameraHandlerState.FreeRoam && <FreeRoamUI sound={soundManagement}/>}
      {cameraHandlerState === CameraHandlerState.MonitorView && <MonitorViewUI sound={soundManagement}/>}
      {cameraHandlerState === CameraHandlerState.Cinematic && <CinematicUI sound={soundManagement}/>}
      {cameraHandlerState === CameraHandlerState.DeskView && <DeskViewUI sound={soundManagement}/>}
    </div>
  );
}