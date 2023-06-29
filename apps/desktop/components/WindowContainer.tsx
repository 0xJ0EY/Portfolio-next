import { Window, WindowManager } from "./WindowManager";
import { LazyExoticComponent, useEffect, useState, useContext } from 'react';
import styles from '@/styles/WindowContainer.module.css';

export type LazyComponent = LazyExoticComponent<() => JSX.Element>;

export const calculateStyle = (window: Window): React.CSSProperties => {
  return {
    position: 'absolute',
    display: 'block',
    top: `${window.y}px`,
    left: `${window.x}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    backgroundColor: 'red',
  };
}

export const WindowContainer = (window: Window, Component: LazyComponent, windowCompositor: WindowManager) => {
  const style = calculateStyle(window);

  return (
    <div key={window.id} style={style}>
      <div className={styles.resizable}>
      <button onClick={() => { windowCompositor.focus(window.id) }}>Focus</button>
        <button onClick={() => { windowCompositor.close(window.id) }}>Close</button>
        <Component/>
      </div>
    </div>
  )
}

// export const WindowContainer = (orderedWindow: OrderedWindow, wm: WindowManager) => {
//   const window  = orderedWindow.getWindow();
//   const order   = orderedWindow.getOrder(); // Order equals the Z-index

//   const style = {
//     position: 'absolute',
//     display: 'block',
//     top: `${window.y}px`,
//     left: `${window.x}px`,
//     width: `${window.width}px`,
//     height: `${window.height}px`,
//     backgroundColor: 'red',
//   } as React.CSSProperties;
  
//   return (
//     <div onClick={() => wm.focus(window)} key={window.id} style={style}>
//       <div className={styles.resizable} onMouseMove={resize}>
//         <div className={styles.header}>
//           {window.title}
//         </div>
//         {/* <div className={styles.content}>
//           {window.content}
//         </div> */}
//       </div>
//     </div>
//   )
// }
