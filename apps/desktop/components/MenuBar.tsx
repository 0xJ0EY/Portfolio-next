import { useEffect, useState } from 'react';
import styles from '@/styles/Desktop.module.css';
import { ApplicationManager, ApplicationManagerEvent, MenuEntries, MenuItem } from '@/applications/ApplicationManager';

function renderApplicationMenu(menuItems: MenuEntries | null) {
  if (!menuItems) { return <>Loading</> };

  return <>{menuItems.displayName}</>
}

type MenuBarProps = {
  manager: ApplicationManager
}

export const MenuBar = (props: MenuBarProps) => {
  const { manager } = props;

  const [appMenuEntries, setAppMenuEntries] = useState<MenuEntries | null>(null);

  function handleApplicationManagerEvent(event: ApplicationManagerEvent) {
    if (event.kind !== 'focus') { return; }

    setAppMenuEntries(event.application.menuEntries());
  }

  useEffect(() => {
    const unsubscribe = manager.subscribe(handleApplicationManagerEvent);

    return () => { unsubscribe(); };
  }, []);  

  return <>
    <div className={styles.menuBar}>
      { renderApplicationMenu(appMenuEntries) }
    </div>
  </>
}
