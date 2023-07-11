import { ApplicationManager } from '@/applications/ApplicationManager';
import styles from '@/styles/Desktop.module.css';

interface DockItem {
  displayName: string,
  onClick: () => void
}

export const Dock = (manager: ApplicationManager) => {

  

  const dockItems: DockItem[] = [
    { displayName: 'Finder', onClick: () => { manager.open('/Applications/Finder.app') }}
  ]

  return <>
    <div className={styles.dock}>
      <button onClick={() => { manager.open('/Applications/About.app') }}>Open about</button>
    </div>
  </>
}
