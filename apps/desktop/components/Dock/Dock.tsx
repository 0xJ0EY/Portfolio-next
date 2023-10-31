import React, { useEffect, useState } from 'react';
import { ApplicationConfig, ApplicationManager, ApplicationManagerEvent } from '@/applications/ApplicationManager';
import styles from './Dock.module.css';
import { aboutConfig } from '@/applications/About/AboutApplication';
import { finderConfig } from '@/applications/Finder/Finder';
import { infoConfig } from '@/applications/Info/InfoApplication';
import { Window, WindowCompositor } from '../WindowManagement/WindowCompositor';
import { WindowEvent } from '../WindowManagement/WindowEvents';
import Image from 'next/image';

const DockApplications = [
  finderConfig,
  aboutConfig,
  infoConfig
];

interface DockApplication {
  displayName: string,
  active: boolean,
  onClick: () => void
}

interface DockWindow {
  displayName: string,
  onClick: () => void
}

class DockItems {
  public applications: DockApplication[] = [];
  public minimizedWindows: DockWindow[] = [];
}

type ApplicationDockItem = { kind: 'application', config: ApplicationConfig, active: boolean, onClick: () => void }
type MinimizedApplicationDockItem = { kind: 'minimized_application', title: string, config: ApplicationConfig, onClick: () => void }
type SeparatorDockItem = { kind: 'separator' }
type DirectoryDockItem = { kind: 'directory' }

type DockItem = ApplicationDockItem | MinimizedApplicationDockItem | SeparatorDockItem | DirectoryDockItem;

function DockItemViewApplication(item: ApplicationDockItem) {
  return (<>
    <button className={styles.dockApplication} onPointerDown={() => item.onClick()} data-tooltip={item.config.displayName}>
      <Image src={item.config.appIcon.src} alt={item.config.appIcon.src} width={64} height={64}></Image>
      <div className={[styles.status, item.active ? styles.active : styles.inactive].join(' ')}></div>
    </button>
  </>)
}

function DockItemMinimizedApplication(item: MinimizedApplicationDockItem) {
  return (<>
    <button onPointerDown={() => item.onClick()}>
      <Image src={item.config.appIcon.src} alt={item.config.appIcon.src} width={30} height={30}></Image>
    </button>
  </>)
}

function DockItemSeparator() {
  return <>seperator</>
}

function DockItemDirectory(item: DirectoryDockItem) {
  return <>directory</>
}

function DockItemView(item: DockItem) {
  switch (item.kind) {
    case 'application': return DockItemViewApplication(item)
    case 'minimized_application': return DockItemMinimizedApplication(item);
    case 'separator': return DockItemSeparator();
    case 'directory': return DockItemDirectory(item);
  }
}

// Extend the notification system of the dock events (by adding closed/open application)
// And implement a reducer like in Desktop.tsx
export function Dock(props: { manager: ApplicationManager, windowCompositor: WindowCompositor }) {
  const { manager, windowCompositor } = props;
  const [dockItems, setDockItems] = useState<DockItem[]>([]);

  function constructDock(manager: ApplicationManager, windowCompositor: WindowCompositor): DockItem[] {
    let content: DockItem[] = [];

    const dockApplications    = DockApplications;
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

      minimizedWindows.forEach(window => {
        content.push({
          kind: 'minimized_application',
          title: window.title,
          config: window.application.config(),
          onClick: () => onClickMinimizedApplicationWindow(window)
        });
      });
    }

    // TODO: Add trash can

    return content;
  }

  function handleApplicationManager() {
    setDockItems(constructDock(manager, windowCompositor));
  }

  function handleWindowCompositor(windowEvent: WindowEvent) {
    if (windowEvent.event === 'minimize_window' || windowEvent.event === 'maximize_window') {
      setDockItems(constructDock(manager, windowCompositor));
    }
  }

  useEffect(() => {
    const applicationManagerUnsubscribe = manager.subscribe(handleApplicationManager);
    const windowCompositorUnsubscribe = windowCompositor.subscribe(handleWindowCompositor);

    setDockItems(constructDock(manager, windowCompositor));

    return () => {
      applicationManagerUnsubscribe();
      windowCompositorUnsubscribe();
    }
  }, []);

  return <>
    <div className={styles.dock}>
      <div data-drop-point="true" className={styles.dockContainer}>
        { dockItems.map((item, i) => <React.Fragment key={i}>{DockItemView(item)}</React.Fragment>) }
      </div>
    </div>
  </>
}
