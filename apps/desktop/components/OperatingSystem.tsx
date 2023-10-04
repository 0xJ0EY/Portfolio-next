import { ApplicationManager } from "@/applications/ApplicationManager";
import { WindowCompositor } from "./WindowManagement/WindowCompositor";
import { DragAndDropService } from "@/apis/DragAndDrop/DragAndDrop";
import { createBaseFileSystem } from "@/apis/FileSystem/FileSystem";
import React, { useEffect, useRef } from "react";
import { MenuBar } from "./MenuBar";
import { Desktop } from "./Desktop";
import { Dock } from "./Dock";
import { FileSystem } from '@/apis/FileSystem/FileSystem';
import styles from '@/styles/Desktop.module.css';
import { DragAndDropView } from "./DragAndDropView";
import { sendRequestToParent, TouchInteraction, TouchInteractionData } from "rpc";

const fileSystem = createBaseFileSystem();
const dragAndDrop = new DragAndDropService();

export type SystemAPIs = { dragAndDrop: DragAndDropService, fileSystem: FileSystem };
const apis: SystemAPIs = { dragAndDrop, fileSystem };

const windowCompositor = new WindowCompositor();
const applicationManager = new ApplicationManager(windowCompositor, fileSystem, apis);

function buildTouchInteractionRequestData(source: 'start' | 'move' | 'end', evt: TouchEvent): TouchInteractionData {
  let touches: TouchInteraction[] = new Array(evt.touches.length);

  for (let i = 0; i < evt.touches.length; i++) {
    const touch = evt.touches[i];

    touches[i] = { x: touch.pageX, y: touch.pageY };
  }

  return { source, touches };
}

export const OperatingSystem = () => {
  const ref = useRef<HTMLDivElement>(null);

  function handleTouchStartEvent(evt: TouchEvent) {
    evt.preventDefault();
    
    const data = buildTouchInteractionRequestData('start', evt);
    sendRequestToParent({ method: 'touch_interaction_request', data });
  }

  function handleTouchMoveEvent(evt: TouchEvent) {
    evt.preventDefault();

    // We provide our own zooming of the page, by zoom/move the camera instead of the page
    // And it is not useful to send the single touches to the host window, so we don't
    if (evt.touches.length !== 2) { return; }

    const data = buildTouchInteractionRequestData('move', evt);
    sendRequestToParent({ method: 'touch_interaction_request', data });
  }

  function handleTouchEndEvent(evt: TouchEvent) {
    evt.preventDefault();

    const data = buildTouchInteractionRequestData('end', evt);
    sendRequestToParent({ method: 'touch_interaction_request', data });
  }

  function disableBrowserZoomTouchInteraction(element: HTMLElement): void {
    element.addEventListener('touchstart', handleTouchStartEvent);
    element.addEventListener('touchmove', handleTouchMoveEvent);
    element.addEventListener('touchend', handleTouchEndEvent);
  }

  function enableBrowserZoomTouchInteraction(element: HTMLElement): void {
    element.removeEventListener('touchstart', handleTouchStartEvent);
    element.removeEventListener('touchmove', handleTouchMoveEvent);
    element.removeEventListener('touchend', handleTouchEndEvent);
  }

  useEffect(() => {
    applicationManager.open('/Applications/Finder.app /Users/joey/Desktop');

    if (ref.current) {
      disableBrowserZoomTouchInteraction(ref.current)
    }

    return () => {
      // Needs to be done, due to this class also opening files in the application manager
      applicationManager.reset();
      windowCompositor.reset();

      if (ref.current) {
        enableBrowserZoomTouchInteraction(ref.current);
      }
    }
  }, []);

  return <>
   <div ref={ref} className={styles.operatingSystem}>
      <MenuBar manager={applicationManager}/>
      <Desktop apis={apis} manager={applicationManager} windowCompositor={windowCompositor} />
      <Dock manager={applicationManager} windowCompositor={windowCompositor}></Dock>
      <DragAndDropView apis={apis}/>
    </div>
  </>
}
