import { useEffect, useState } from 'react';
import { ApplicationConfig, ApplicationManager } from '@/applications/ApplicationManager';
import styles from '@/styles/Desktop.module.css';
import { aboutConfig } from '@/applications/AboutApplication';
import { finderConfig } from '@/applications/Finder/Finder';
import { infoConfig } from '@/applications/InfoApplication';
import { Chain } from '../data/Chain';
import { Window, WindowCompositor } from './WindowManagement/WindowCompositor';
import { WindowEvent } from './WindowManagement/WindowEvents';

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

// Extend the notification system of the dock events (by adding closed/open application)
// And implement a reducer like in Desktop.tsx
export const Dock = (props: { manager: ApplicationManager, windowCompositor: WindowCompositor }) => {
  const { manager, windowCompositor } = props;
  const [dockItems, setDockItems] = useState<DockItems>(new DockItems());

  function constructDock(manager: ApplicationManager, windowCompositor: WindowCompositor): DockItems {
    const dockItems = new DockItems();

    const dockApplications    = DockApplications;
    const activeApplications  = manager.listApplications().map(x => x.config());
    const minimizedWindows    = windowCompositor.listMinimizedWindows();

    const items: Record<string, { config: ApplicationConfig, active: boolean }> = {};

    {
      dockApplications.forEach(x => items[x.displayName] = {
        config: x,
        active: false
      });

      activeApplications.forEach(x => items[x.displayName] = {
        config: x,
        active: true
      });

      let result = new Chain<DockApplication>();

      // TODO: Special rules for Finder
      // TODO: Add a bin
      Object.values(items).forEach(x => {
        result.append({
          displayName: x.config.displayName,
          active: x.active,
          onClick: () => { manager.open(x.config.path + x.config.appName); }
        })
      });

      dockItems.applications = result.toArray();
    }

    {
      function onClickWindow(window: Window) {
        window.minimized = false;
        windowCompositor.update(window);
        windowCompositor.focus(window.id, true);
      }

      const windows: DockWindow[] = minimizedWindows.map(x => {
        return { displayName: x.title, onClick: () => { onClickWindow(x); }}
      });

      dockItems.minimizedWindows = windows;
    }

    return dockItems;
  }

  function handleApplicationManager() {
    setDockItems(constructDock(manager, windowCompositor));
  }

  function handleWindowCompositor(windowEvent: WindowEvent) {
    if (windowEvent.event === 'update_window') {
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
      {dockItems.applications.map((x, i) => <button key={i} onPointerDown={() => { x.onClick(); }}>{x.displayName}{x.active ? ' [active]' : ''}</button>)}
      {dockItems.minimizedWindows.map((x, i) => <button key={i} onPointerDown={() => { x.onClick(); }}>{x.displayName} [minimized]</button>)}
    </div>
  </>
}
