import styles from '@/styles/Desktop.module.css';
import React, { useEffect, useRef, useReducer, useState } from "react";
import { Window, WindowApplication, WindowCompositor } from './WindowManagement/WindowCompositor';
import { WindowEvent } from './WindowManagement/WindowEvents';
import dynamic from 'next/dynamic';
import { SystemAPIs } from './OperatingSystem';

const FolderView = dynamic(() => import('./Folder/FolderView'));
const WindowContainer = dynamic(() => import('./WindowManagement/WindowContainer'));

interface ApplicationData {
  window: Window,
  application: WindowApplication
}

const applicationReducer = (windowCompositor: WindowCompositor) => {  
  return (state: ApplicationData[], action: WindowEvent) => {
    
    switch (action.event) {
      case 'create_window': { 
        const window = windowCompositor.getById(action.windowId);
        if (!window) { return state; }

        if (state.find(x => x.window.id === window.id)) { break; }

        const application = window.generator();
        const entry = { window, application };
        
        state = [...state, entry];
      }
      break;

      case 'update_window': {
        const window = windowCompositor.getById(action.windowId);
        if (!window) { return state; }

        state = state.map(x => {
          if (x.window.id !== window.id) { return x; }

          x.window = window;

          return x;
        });
      }
      break;

      case 'update_windows': {
        state = state.map(x => {
          const window = windowCompositor.getById(x.window.id);
          if (window === null) {  throw new Error('Attempting to update a window that doesn\'t exist') }

          x.window = window;
          return x;
        });
      }
      break;

      case 'destroy_window':
        state = state.filter(x => x.window.id !== action.windowId);
      break;
    }
    
    return state;
  }
};

export const Desktop = (props: { windowCompositor: WindowCompositor, apis: SystemAPIs }) => {
  const { windowCompositor, apis } = props;

  const parentNode = useRef(null);

  const reducer = applicationReducer(windowCompositor);
  const [applicationWindows, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    const unsubscribe = windowCompositor.subscribe((evt: WindowEvent) => {
      dispatch(evt);
    });

    return () => { unsubscribe(); }
  }, []);

  return <>
    <div ref={parentNode} className={styles.windowContainer}>
      <FolderView directory='/Users/joey/Desktop' apis={apis}/>

      {applicationWindows.map(x => 
        <div key={x.window.id}>
          <WindowContainer
            window={x.window}
            WindowApp={x.application}
            windowCompositor={windowCompositor}
            parent={parentNode.current}/>
        </div>)}
    </div>
  </>
}
