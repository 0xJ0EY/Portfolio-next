import { useEffect } from 'react';
import { Window, WindowApplication, WindowCompositor } from "./WindowCompositor";
import styles from '@/styles/WindowContainer.module.css';

const calculateStyle = (window: Window): React.CSSProperties => {
  return {
    position: 'absolute',
    display: 'block',
    top: `${window.y}px`,
    left: `${window.x}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    backgroundColor: 'red',
    zIndex: window.order
  };
}

const buildResizableStyle = (window: Window): React.CSSProperties => {
  return {
    cursor: window.resizingCursor,
  };
}

export const WindowHeader = (window: Window, windowCompositor: WindowCompositor) => {

  const classes = [styles.header];

  if (window.focused) { classes.push(styles.focused); }

  return (
    <div className={classes.join(' ')}>
      <span>{ window.title }</span>
      <button onClick={() => { windowCompositor.close(window.id) }}>Close</button>
    </div>
  ) 
}

export default function(props: { window: Window, Application: WindowApplication, windowCompositor: WindowCompositor }) {
  const { window, Application, windowCompositor } = props;

  function focus() { windowCompositor.focus(window.id); }
  function onMouseOver() {
    if (window.resizingCursor !== "wait") {
      window.resizingCursor = "wait";
      windowCompositor.update(window);
    }
  };

  const style = calculateStyle(window);
  const header = WindowHeader(window, windowCompositor);

  const focusedClass = window.focused ? styles.focused : ''; 
  const contentContainerClasses = `${styles.contentContainer} ${focusedClass}`;

  const resizableStyle = buildResizableStyle(window);
  
  return <div style={style} key={window.id}>
    
    <div className={styles.container}>
        {!window.focused && <div onClick={focus} className={styles.focusLayer}></div>}
        {window.focused && <div className={styles.resizable} style={resizableStyle} onMouseOver={onMouseOver}></div>}

        <div className={contentContainerClasses}>
          {header}

          <div className={styles.content}>
            <Application/>
          </div>
        </div>
      </div>
    </div>
}
