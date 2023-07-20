import styles from '@/styles/Desktop.module.css';
import React, { useEffect, useRef, useReducer, useState } from "react";
import { Window, WindowApplication, WindowCompositor } from './WindowManagement/WindowCompositor';
import { WindowEvent } from './WindowManagement/WindowEvents';
import { ApplicationManager } from '@/applications/ApplicationManager';
import { FileSystem } from './FileSystem/FileSystem';
import { Dock } from './Dock';
import { MenuBar } from './MenuBar';
import dynamic from 'next/dynamic';

const DesktopIcon = dynamic(() => import('./Icons/DesktopIcon'));
const WindowContainer = React.lazy(() => import('./WindowManagement/WindowContainer'));

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

export const Desktop = (props: { windowCompositor: WindowCompositor}) => {
  const { windowCompositor } = props;

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
      <div>
        <DesktopIcon/>
      </div>

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

const fileSystem = new FileSystem();
fileSystem.init();

const windowCompositor = new WindowCompositor();
const applicationManager = new ApplicationManager(windowCompositor, fileSystem);

export const OperatingSystem = () => {
  useEffect(() => {
    applicationManager.open('/Applications/Finder.app');
    applicationManager.open('/Applications/Info.app');
    applicationManager.open('/Applications/About.app');

    return () => {
      // Needs to be done, due to this class also opening files in the application manager
      applicationManager.reset();  
      windowCompositor.reset();
    }
  }, []);

  const dock = Dock(applicationManager);

  return <>
    <div className={styles.operatingSystem}>
    <MenuBar/>
    <Desktop windowCompositor={windowCompositor} />
    {dock}
    </div>
  </>
}
