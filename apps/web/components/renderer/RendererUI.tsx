import { useEffect, useState } from "react";
import { CameraHandlerState } from "./camera/CameraHandler";
import styles from "./RendererUI.module.css"

export type RendererUIProps = {
  cameraHandlerState: CameraHandlerState
}

function FreeRoamUI() {
  useEffect(() => {
    console.log('free roam ui');
  }, []);
  
  return <>FreeRoam</>
}

function MonitorViewUI() {
  useEffect(() => {
    console.log('monitor view ui');
  }, []);

  return <>Monitor</>
}

function CinematicUI() {
  useEffect(() => {
    console.log('cinematic ui');
  }, []);

  return <>Cinematic</>
}

function DeskViewUI() {
  return <>Deskview</>
}

export function RendererUI(props: RendererUIProps) {
  const { cameraHandlerState } = props;

  // A switch statement wrapped in a function breaks the rules of hooks, but this doesn't?
  // Just looks ugly, but it works
  return (
    <div className={styles['ui']}>
      {cameraHandlerState === CameraHandlerState.FreeRoam && <FreeRoamUI/>}
      {cameraHandlerState === CameraHandlerState.MonitorView && <MonitorViewUI/>}
      {cameraHandlerState === CameraHandlerState.Cinematic && <CinematicUI/>}
      {cameraHandlerState === CameraHandlerState.DeskView && <DeskViewUI/>}
    </div>
  );
}