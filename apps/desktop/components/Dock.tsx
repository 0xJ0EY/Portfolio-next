import { useEffect, useState } from 'react';
import { Application, ApplicationConfig, ApplicationManager } from '@/applications/ApplicationManager';
import styles from '@/styles/Desktop.module.css';
import { aboutConfig } from '@/applications/AboutApplication';
import { finderConfig } from '@/applications/Finder/Finder';
import { infoConfig } from '@/applications/InfoApplication';
import { Chain } from '../data/Chain';

const DockApplications = [
  finderConfig,
  aboutConfig,
  infoConfig
];

interface DockItem {
  displayName: string,
  active: boolean,
  onClick: () => void
}

// Extend the notification system of the dock events (by adding closed/open application)
// And implement a reducer like in Desktop.tsx
export const Dock = (manager: ApplicationManager) => {
  const [dockItems, setDockItems] = useState<DockItem[]>([]);

  function constructDock(manager: ApplicationManager): DockItem[] {
    const dockApplications    = DockApplications;
    const activeApplications  = manager.listApplications().map(x => x.config());

    const items: Record<string, { config: ApplicationConfig, active: boolean }> = {};

    dockApplications.forEach(x => items[x.displayName] = {
      config: x,
      active: false
    });

    activeApplications.forEach(x => items[x.displayName] = {
      config: x,
      active: true
    });

    let result = new Chain<DockItem>();

    // TODO: Special rules for Finder
    // TODO: Add a bin
    Object.values(items).forEach(x => {
      result.append({
        displayName: x.config.displayName,
        active: x.active,
        onClick: () => { manager.open(x.config.path + x.config.appName); }
      })
    });

    return result.toArray();
  }

  useEffect(() => {
    // setDockItems(true);
    // setDockItems([{displayName: "foo", active: true}]);
    const unsubscribe = manager.subscribe(() => { setDockItems(constructDock(manager)); });

    setDockItems(constructDock(manager));

    return () => { unsubscribe(); }
  }, []);

  return <>
    <div className={styles.dock}>
      {dockItems.map((x, i) => <button key={i} onClick={() => { x.onClick(); }}>{x.displayName}{x.active ? ' [active]' : ''}</button>)}
    </div>
  </>
}

