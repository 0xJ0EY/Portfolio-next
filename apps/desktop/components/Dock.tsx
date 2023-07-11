import { useEffect } from 'react';
import { ApplicationManager } from '@/applications/ApplicationManager';
import styles from '@/styles/Desktop.module.css';

export const Dock = (manager: ApplicationManager) => {
  useEffect(() => {
    const unsubscribe = manager.subscribe(() => { console.log('update'); });

    return () => { unsubscribe(); }
  }, []);

  return <>
    <div className={styles.dock}>
      <button onClick={() => { manager.open('/Applications/About.app') }}>Open about</button>
    </div>
  </>
}
