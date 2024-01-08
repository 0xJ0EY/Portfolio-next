import React, { useEffect, useRef, useState } from 'react';
import { ApplicationConfig, ApplicationManager, ApplicationManagerEvent } from '@/applications/ApplicationManager';
import styles from './Dock.module.css';
import { aboutConfig } from '@/applications/About/About';
import { finderConfig } from '@/applications/Finder/Finder';
import { debugConfig } from '@/applications/Debug/DebugApplication';
import { Window, WindowCompositor } from '../WindowManagement/WindowCompositor';
import { WindowEvent } from '../WindowManagement/WindowEvents';
import Image from 'next/image';
import { ApplicationIcon } from '@/apis/FileSystem/FileSystem';
import { SystemAPIs } from '../OperatingSystem';

const DockApplications = [
  finderConfig,
  aboutConfig
];

const DebugDockApplications = [
  ...DockApplications,
  debugConfig
];

const ActiveIcon = 'data:image/png;base64,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Y0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAAuIwAALiMBeKU/dgAABPRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMS1jMDAxIDc5LmE4ZDQ3NTM0OSwgMjAyMy8wMy8yMy0xMzowNTo0NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjYgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTExLTIwVDEyOjI2OjI0KzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0xMS0yMFQxMjoyOToyOCswMTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0xMS0yMFQxMjoyOToyOCswMTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YTFjZDA3YzMtMjAyNC00M2U0LWE2YzctYjIyNzFiMTIyZGVjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOmExY2QwN2MzLTIwMjQtNDNlNC1hNmM3LWIyMjcxYjEyMmRlYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmExY2QwN2MzLTIwMjQtNDNlNC1hNmM3LWIyMjcxYjEyMmRlYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTFjZDA3YzMtMjAyNC00M2U0LWE2YzctYjIyNzFiMTIyZGVjIiBzdEV2dDp3aGVuPSIyMDIzLTExLTIwVDEyOjI2OjI0KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjQuNiAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7qfM6HAAAAxUlEQVQ4jaWSQQrCMBREp27cKdLqrYqKoJfQOwiCBxKvIYorF96hdSF0Y5+LJhpLW5o6MJskM0n+TADoH/Qq1iJJO0kXSZnhVdLe7P0CcLkAUuqRAHNXUxbnDWKLHFiVDSbAo4XYIgVC4DODjaSBx+yGktbuEGMPsUUsSYGJMZPU9zRIJY2qYmwLpO8Xbh0M7q7BoYPBsXhHEePYM8bExugWaU67Ir2AJRVNFDAz7k03T6mpsmUEbIET8DQ8m7WwfN72oDPeoSunCY8Gh3QAAAAASUVORK5CYII=';

type ApplicationDockItem = { kind: 'application', config: ApplicationConfig, active: boolean, onClick: () => void }
type MinimizedApplicationDockItem = { kind: 'minimized_application', title: string, config: ApplicationConfig, onClick: () => void }
type SeparatorDockItem = { kind: 'separator' }
type DirectoryDockItem = { kind: 'directory', title: string, icon: ApplicationIcon, onClick: () => void }

type DockItem = ApplicationDockItem | MinimizedApplicationDockItem | SeparatorDockItem | DirectoryDockItem;

function DockItemViewApplication(item: ApplicationDockItem) {
  return (<>
    <button className={styles['dock-application']} onClick={() => item.onClick()} data-tooltip={item.config.displayName}>
      <Image className={styles['dock-app-image']} src={item.config.appIcon.src} alt={item.config.appIcon.alt} width={64} height={64}></Image>
      <div className={[styles.status, item.active ? styles.active : styles.inactive].join(' ')}>
        {item.active ? <img className={styles['dock-app-active-image']} src={ActiveIcon} /> : <></>}
      </div>
    </button>
  </>)
}

function DockItemMinimizedApplication(item: MinimizedApplicationDockItem) {
  return (<>
    <button className={styles['dock-application']} onClick={() => item.onClick()} data-tooltip={item.config.displayName}>
      <Image className={styles['dock-app-image']} src={item.config.appIcon.src} alt={item.config.appIcon.alt} width={64} height={64}></Image>
      <div className={[styles.status].join(' ')}></div>
    </button>
  </>)
}

function DockItemSeparator() {
  return (<div className={styles.separator}></div>)
}

function DockItemDirectory(item: DirectoryDockItem) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) { return; }
    const container = ref.current;

    console.log(container);

    container.addEventListener('click', () => { console.log('click')});

    return () => {

    }
  }, []);

  return (<>
    <button ref={ref} className={styles['dock-application']} onClick={() => item.onClick()} data-tooltip={item.title}>
      <Image className={styles['dock-app-image']} src={item.icon.src} alt={item.icon.alt} width={64} height={64}></Image>
      <div className={styles.status}></div>
    </button>
  </>)
}

function DockItemView(item: DockItem) {
  switch (item.kind) {
    case 'application': return DockItemViewApplication(item)
    case 'minimized_application': return DockItemMinimizedApplication(item);
    case 'separator': return DockItemSeparator();
    case 'directory': return DockItemDirectory(item);
  }
}

export function Dock(props: { apis: SystemAPIs, manager: ApplicationManager, windowCompositor: WindowCompositor }) {
  const { apis, manager, windowCompositor } = props;
  const [dockItems, setDockItems] = useState<DockItem[]>(constructDock(manager, windowCompositor, apis.system.isDebug()));
  const [directoryItems] = useState<DockItem[]>(constructDirectoryItems());

  function constructDock(manager: ApplicationManager, windowCompositor: WindowCompositor, debug: boolean): DockItem[] {
    let content: DockItem[] = [];

    const dockApplications    = !debug ? DockApplications : DebugDockApplications;

    const activeApplications  = manager.listApplications().map(x => x.config());
    const minimizedWindows    = windowCompositor.listMinimizedWindows();

    {
      const items: Record<string, { config: ApplicationConfig, active: boolean }> = {};

      dockApplications.forEach(x => items[x.appName] = {
        config: x,
        active: false
      });

      activeApplications.forEach(x => items[x.appName] = {
        config: x,
        active: true
      });

      Object.values(items)
        .sort((a, b) => { 
        // Bubble sorting time 😎
          const aPriority = a.config.dockPriority ?? 0;
          const bPriority = b.config.dockPriority ?? 0;

          return aPriority - bPriority;
        }).forEach(item => {
          content.push({
            kind: 'application',
            config: item.config,
            active: item.active,
            onClick: () => { manager.open(item.config.path + item.config.appName); }
          });
        });
    }

    content.push({ kind: 'separator' });

    {
      function onClickMinimizedApplicationWindow(applicationWindow: Window) {
        applicationWindow.minimized = false;
        windowCompositor.update(applicationWindow);
        windowCompositor.focus(applicationWindow.id, true);
      }

      minimizedWindows
        .slice(0, Math.min(minimizedWindows.length, 5))
        .forEach(window => {
        content.push({
          kind: 'minimized_application',
          title: window.title,
          config: window.application.config(),
          onClick: () => onClickMinimizedApplicationWindow(window)
        });
      });
    }

    return content;
  }

  function constructDirectoryItems(): DockItem[] {
    let content: DockItem[] = [];

    function onClickDirectory(path: string) {
      manager.open(`/Applications/Finder.app ${path}`);
    }

    content.push({
      kind: 'directory',
      title: 'Applications',
      icon:  { src: '/icons/folder-icon.png', alt: 'File icon' },
      onClick: () => onClickDirectory('/Applications')
    });
    
    content.push({
      kind: 'directory',
      title: 'Documents',
      icon:  { src: '/icons/folder-icon.png', alt: 'File icon' },
      onClick: () => onClickDirectory('/Users/joey/Documents')
    });

    content.push({
      kind: 'directory',
      title: 'Trash',
      icon:  { src: '/icons/folder-icon.png', alt: 'File icon' },
      onClick: () => onClickDirectory('/Users/joey/Trash')
    });
  
    return content;
  }

  function handleApplicationManager() {
    setDockItems(constructDock(manager, windowCompositor, apis.system.isDebug()));
  }

  function handleWindowCompositor(windowEvent: WindowEvent) {
    if (windowEvent.event === 'minimize_window' || windowEvent.event === 'maximize_window') {
      setDockItems(constructDock(manager, windowCompositor, apis.system.isDebug()));
    }
  }

  useEffect(() => {
    const applicationManagerUnsubscribe = manager.subscribe(handleApplicationManager);
    const windowCompositorUnsubscribe = windowCompositor.subscribe(handleWindowCompositor);

    return () => {
      applicationManagerUnsubscribe();
      windowCompositorUnsubscribe();
    }
  }, []);

  return <>
    <div className={styles.dock}>
      <div data-drop-point="true" className={styles.dockContainer}>
        { dockItems.map((item, i) => <React.Fragment key={i}>{DockItemView(item)}</React.Fragment>) }
        { directoryItems.map((item, i) => <React.Fragment key={i}>{DockItemView(item)}</React.Fragment>) }
      </div>
    </div>
  </>
}
