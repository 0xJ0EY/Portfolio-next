import { useEffect, useRef, useState } from "react";
import { CameraHandlerState } from "./camera/CameraHandler";
import { sendMessageToChild } from "rpc";
import { joinStyles, writeOutChars, writeOutCharsStreaming } from "./util";
import styles from "./RendererUI.module.css"

const MStoWriteChar = 35;

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

type ElementStateProps = {
  state: CameraHandlerState
}

type SubViewProps = {
  state: CameraHandlerState,
  sound: SubViewSound,
}

function SoundManagementButton(props: { sound: SubViewSound }) {
  const { isSoundEnabled, toggleSound } = props.sound;

  return <button className={styles['mute-button']} onClick={() => toggleSound()}>{isSoundEnabled ? 'Mute' : 'Unmute'}</button>
}

function NameAndTime(props: ElementStateProps) {
  const { state } = props;

  const firstTime = useRef<boolean>(true);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const isActive = (
    state === CameraHandlerState.DeskView ||
    state === CameraHandlerState.FreeRoam
  );

  function formatTime(dateTime: Date): string {
    const hours   = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  function writeOutContent() {
    function writeAfterDelay(stream: () => string, setter: (value: string) => void, charDelay: number): void {
      setTimeout(() => writeOutCharsStreaming(stream, setter, MStoWriteChar), charDelay * MStoWriteChar);
    }

    const name = "Joey de Ruiter";
    const title = "Software engineer";

    // Write all the content
    writeAfterDelay(() => name, setName, 0);
    writeAfterDelay(() => title, setTitle, name.length + 1);
    writeAfterDelay(() => formatTime(new Date()), setTime, name.length + title.length + 2);

    // After everything is done writing, start a loop to update the time
    const timeLength = 8;
    const totalWaitTime = (timeLength + name.length + title.length + 2) * MStoWriteChar;

    setTimeout(() => {
      setInterval(() => { setTime(formatTime(new Date())); }, 1000);
    }, totalWaitTime);
  }

  useEffect(() => {
    if (!isActive) { return; }
    const isFirstTime = firstTime.current;

    console.log(firstTime);

    if (isFirstTime) {
      writeOutContent();
      firstTime.current = false;
    }
  }, [state])

  return (
    <div className={joinStyles([
      styles['name-container'],
      isActive ? styles['fade-in'] : null
    ])}>
      <div>{name && <span>{name}</span>}</div>
      <div>{title && <span>{title}</span>}</div>
      <div>{time && <span>{time}</span>}</div>
    </div>
  );
}

function CinematicInstructions(props: ElementStateProps) {
  const { state } = props;

  const [instructions, setInstructions] = useState("");

  const isActive = state === CameraHandlerState.Cinematic;

  useEffect(() => {
    if (!isActive) { return; }

    const cancelation = writeOutChars("Click anywhere to start", setInstructions, MStoWriteChar);

    return () => { cancelation(); }

  }, [state]);

  return (
    <span className={joinStyles([
      styles['cinematic-instructions'],
      !isActive ? styles['fade-out'] : null,
    ])}>{instructions}</span>
  );
}

export function RendererUI(props: RendererUIProps) {
  const { cameraHandlerState } = props;
  const soundManagement = useSoundManagement();

  // A switch statement wrapped in a function breaks the rules of hooks, but this doesn't?
  // Just looks ugly, but it works
  return (
    <div className={styles['ui']}>
      <NameAndTime state={cameraHandlerState} />
      <CinematicInstructions state={cameraHandlerState} />
    </div>
  );
}