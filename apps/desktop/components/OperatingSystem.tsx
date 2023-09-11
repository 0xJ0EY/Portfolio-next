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

const fileSystem = createBaseFileSystem();
const dragAndDrop = new DragAndDropService();

export type SystemAPIs = { dragAndDrop: DragAndDropService, fileSystem: FileSystem };
const apis: SystemAPIs = { dragAndDrop, fileSystem };

const windowCompositor = new WindowCompositor();
const applicationManager = new ApplicationManager(windowCompositor, fileSystem, apis);

export const OperatingSystem = () => {
  const ref = useRef<HTMLDivElement>(null);

  function noopTouchEvent(evt: TouchEvent) { evt.preventDefault(); }

  function disableTouchInteraction(element: HTMLElement): void {
    element.addEventListener('touchmove', noopTouchEvent);
  }

  function enableTouchInteraction(element: HTMLElement): void {
    element.removeEventListener('touchmove', noopTouchEvent);
  }

  useEffect(() => {
    applicationManager.open('/Applications/Finder.app /Users/joey/Desktop');

    if (ref.current) {
      disableTouchInteraction(ref.current)
    }

    return () => {
      // Needs to be done, due to this class also opening files in the application manager
      applicationManager.reset();
      windowCompositor.reset();

      if (ref.current) {
        enableTouchInteraction(ref.current);
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
