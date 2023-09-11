import { useEffect, useState } from 'react';
import styles from './MenuBar.module.css';
import { ApplicationManager, ApplicationManagerEvent, MenuEntries, MenuItem } from '@/applications/ApplicationManager';
import { minimumDigits } from './util';

function renderApplicationMenu(menuItems: MenuEntries | null) {
  if (!menuItems) { return <>Loading</> };

  return <>{menuItems.displayName}</>
}

function renderClock(date: Date) { 
  
  const hours = minimumDigits(date.getHours(), 2);
  const minutes = minimumDigits(date.getMinutes(), 2);
  
  const time = `${hours} ${minutes}`

  return <>{time}</>
}

type MenuBarProps = {
  manager: ApplicationManager
}

export const MenuBar = (props: MenuBarProps) => {
  const { manager } = props;

  const [appMenuEntries, setAppMenuEntries] = useState<MenuEntries | null>(null);
  const [date, setDate] = useState(new Date());

  function handleApplicationManagerEvent(event: ApplicationManagerEvent) {
    if (event.kind !== 'focus') { return; }

    setAppMenuEntries(event.application.menuEntries());
  }

  useEffect(() => {
    const unsubscribe = manager.subscribe(handleApplicationManagerEvent);
    const interval = setInterval(() => setDate(new Date()), 1000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);  

  return <>
    <div className={styles.menuBar}>
      <div className={styles.appEntries}>
        { renderApplicationMenu(appMenuEntries) }
      </div>
      <div className={styles.utility}>
        { renderClock(date) }
      </div>
    </div>
  </>
}
