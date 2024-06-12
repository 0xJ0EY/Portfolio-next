import { RefObject, useEffect, useRef, useState } from "react";
import { CameraHandler, CameraHandlerState } from "./camera/CameraHandler";
import { joinStyles, writeOutChars, writeOutCharsStreaming } from "./util";
import styles from "./RendererUI.module.css"
import { SoundService } from "./sound/SoundService";

const MStoWriteChar = 35;

function useSoundManagement(soundService: SoundService) {
  const [isSoundEnabled, setSoundEnabled] = useState(true);

  function toggleSound() {
    if (isSoundEnabled) {
      disableSound();
    } else {
      enableSound();
    }
  }

  function enableSound() {
    setSoundEnabled(true);
    soundService.enable();
  }

  function disableSound() {
    setSoundEnabled(false);
    soundService.disable(); 
  }

  return {isSoundEnabled, toggleSound, enableSound, disableSound};
}

export type RendererUIProps = {
  cameraHandlerState: CameraHandlerState,
  cameraHandler: RefObject<CameraHandler | null>,
  soundService: SoundService
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

  const icon = isSoundEnabled ? "/icons/mute-icon.svg" : "/icons/unmute-icon.svg"

  return (
    <button className={styles['mute-button']} onClick={() => toggleSound()}>
      <img draggable={false} src={icon} width={25} height={20}/>
    </button>
  )
}

function ChangeSceneButton(props: { targetState: CameraHandlerState, cameraHandler: RefObject<CameraHandler | null> }) {
  const icon = "/icons/camera.svg";

  const { targetState, cameraHandler } = props;

  function changeScene() {
    if (!cameraHandler.current) { return; }
    cameraHandler.current.changeState(targetState);
  }

  return (
    <button className={styles['camera-button']} onClick={() => changeScene()}>
      <img draggable={false} src={icon} width={25} height={20}/>
    </button>
  );
}

function NameAndTime(props: {
  state: CameraHandlerState,
  cameraHandler: RefObject<CameraHandler | null>,
  sound: SubViewSound,
}) {
  const { state, cameraHandler, sound } = props;

  const firstTime = useRef<boolean>(true);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const [done, setDone] = useState(false);

  const isActive = state === CameraHandlerState.FreeRoam;

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

    setTimeout(() => {
      setDone(true);
    }, totalWaitTime + MStoWriteChar);
  }

  useEffect(() => {
    if (!isActive) { return; }
    const isFirstTime = firstTime.current;

    if (isFirstTime) {
      writeOutContent();
      firstTime.current = false;
    }
  }, [state])

  return (
    <div className={joinStyles([
      styles['name-container'],
      isActive ? styles['fade-in'] : styles['fade-out']
    ])}>
      <div>{name && <span>{name}</span>}</div>
      <div>{title && <span>{title}</span>}</div>
      <div>
        {time && <span className={`${done ? styles['time-is-done'] : ''}`}>{time}</span>}
        {done && <SoundManagementButton sound={sound}/>}
        {done && <ChangeSceneButton targetState={CameraHandlerState.MonitorView} cameraHandler={cameraHandler}/>}
      </div>
    </div>
  );
}

function UserInteractionButtons(props: {
  state: CameraHandlerState,
  cameraHandler: RefObject<CameraHandler | null>,
  sound: SubViewSound,
}) {
  const { state, cameraHandler, sound } = props;

  const isActive = (
    state === CameraHandlerState.Cinematic ||
    state === CameraHandlerState.MonitorView 
  );

  return (<>
    <div className={joinStyles([
        styles['sound-container'],
        !isActive ? styles['fade-out'] : null
      ])}>
        <SoundManagementButton sound={sound}/>
        <ChangeSceneButton targetState={state === CameraHandlerState.Cinematic ? CameraHandlerState.MonitorView : CameraHandlerState.Cinematic} cameraHandler={cameraHandler}/>
    </div>
  </>);
}

function CinematicInstructions(props: SubViewProps) {
  const { state } = props;

  const [instructions, setInstructions] = useState("");

  const isActive = state === CameraHandlerState.Cinematic;

  useEffect(() => {
    if (!isActive) { return; }

    const cancelation = writeOutChars("Click anywhere to start", setInstructions, MStoWriteChar);

    return () => { cancelation(); }

  }, [state]);

  return (<>
    <div className={styles['cinematic-container']}>
      <span className={joinStyles([
        styles['cinematic-instructions'],
        !isActive ? styles['fade-out'] : null,
      ])}>{instructions}<span className={styles['blinking-cursor']}></span></span>
    </div>
  </>);
}

export function RendererUI(props: RendererUIProps) {
  const { cameraHandlerState, cameraHandler, soundService } = props;
  const soundManagement = useSoundManagement(soundService);

  // A switch statement wrapped in a function breaks the rules of hooks, but this doesn't?
  // Just looks ugly, but it works
  return (
    <div className={styles['ui']}>
      <UserInteractionButtons state={cameraHandlerState} cameraHandler={cameraHandler} sound={soundManagement} />
      <NameAndTime state={cameraHandlerState} cameraHandler={cameraHandler} sound={soundManagement} />
      <CinematicInstructions state={cameraHandlerState} sound={soundManagement} />
    </div>
  );
}