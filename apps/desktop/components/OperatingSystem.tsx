import { ApplicationManager } from "@/applications/ApplicationManager";
import { WindowCompositor } from "./WindowManagement/WindowCompositor";
import { DragAndDropService } from "@/apis/DragAndDrop/DragAndDrop";
import { createBaseFileSystem } from "@/apis/FileSystem/FileSystem";
import React, { useEffect } from "react";
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
  useEffect(() => {
    applicationManager.open('/Applications/Finder.app /');
    // applicationManager.open('/Applications/Info.app');
    // applicationManager.open('/Applications/About.app');

    return () => {
      // Needs to be done, due to this class also opening files in the application manager
      applicationManager.reset();
      windowCompositor.reset();
    }
  }, []);

  return <>
    <div className={styles.operatingSystem}>
      <MenuBar/>
      <Desktop apis={apis} manager={applicationManager} windowCompositor={windowCompositor} />
      <Dock manager={applicationManager}></Dock>
      <DragAndDropView apis={apis}/>
    </div>
  </>
}
