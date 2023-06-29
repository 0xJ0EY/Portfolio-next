import styles from '@/styles/Desktop.module.css';
import { useEffect, useState, useReducer, Reducer, createRef, useRef, memo, createContext } from "react";
import { OrderedWindow, WindowManager as WindowCompositor, WindowEvent, Window } from './WindowManager';
import { WindowContainer, calculateStyle } from './WindowContainer';
import React from 'react';

const MenuBar = () => {
  return <>
    <div className={styles.menuBar}>menu</div>
  </>
}

const Dock = () => {
  return <>
    <div className={styles.dock}>dock</div>
  </>
}


const LazyComponent = React.lazy(() => import('./LazyComponent'));

const createLazy = () => {
  return LazyComponent;
}

const applicationReducer = (windowCompositor: WindowCompositor) => {  
  return (state: any[], action: WindowEvent) => {
    
    switch (action.event) {
      case 'create_window': { 
          const window = windowCompositor.getById(action.windowId);
          if (window === null) { return state; }

          if (state.find(x => x.id === window.id)) { break; }

          const component = window.content();
          const data = WindowContainer(window, component, windowCompositor);




          const entry = { id: window.id, data: data };
          state = [...state, entry];
        }
        break;

      case 'update_windows': {
        console.log('update windows');

          state = state.map(x => {
            const window = windowCompositor.getById(x.id);
            if (window === null) { return x; }

            

            // console.log(x.data.props.style = calculateStyle(window));
            return x;
          });
        }
        break;

      case 'destroy_window':
        console.log('destroy');
        const window = windowCompositor.getById(action.windowId);
        if (window === null) { return state; }

        state = state.filter(x => x.id !== window.id);
        break;
    }
    
    return state;
  }
};



export const Desktop = (props: { windowCompositor: WindowCompositor}) => {
  const { windowCompositor } = props;

  const reducer = applicationReducer(windowCompositor);
  const [applicationWindows, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    const unsubscribe = windowCompositor.subscribe((evt: WindowEvent) => { console.log(evt);    
      dispatch(evt);
    })
    return () => { unsubscribe(); }
  }, [])

  return <>
    {applicationWindows.map(x => x.data)}
    <Dock/>
  </>
}

const addWindow = (wm: WindowCompositor, x: number) => {
  wm.open({
    x,
    y: 200,
    height: 400,
    width: 400,
    title: "Random window",
    content: () => createLazy()
  });
}

export const OperatingSystem = () => {
  const windowCompositor = new WindowCompositor();

  

  useEffect(() => {
    console.log('mounted');

    addWindow(windowCompositor, 100);
    addWindow(windowCompositor, 250);
    addWindow(windowCompositor, 400);

    // TODO: Might be removed?
    return () => { windowCompositor.clear(); }
  }, []);
  /*

  // windowManager.open({
  //   x: 0,
  //   y: 0,
  //   height: 400,
  //   width: 400,
  //   title: "Test2",
  //   content: Test("Foobar")
  // });

  windowManager.open({
    x: 100,
    y: 200,
    height: 400,
    width: 400,
    title: "Test1",
    content: Test("Foobar123")
  });


  // for (let x = 0; x < 100; x++) {
  //   windowManager.open({
  //     x: 100 + x * 10,
  //     y: 100 + x * 10,
  //     height: 400,
  //     width: 400,
  //     title: x.toString(),
  //     content: Test("Foobar123")
  //   });
  // }

  // useEffect(() => {

  // }, [])




  // windowManager.open(n(100, 100, 400, 80, "Foobar", Test("Hello")));
  // windowManager.open(new Window(100, 400, 400, 80, "Foobar", Test("World")));

  let foo = Test("foo");
  
  return <>
  <div className={styles.operatingSystem}>
    <MenuBar/>
    {foo}
    <button onClick={() => {addWindow(windowManager)}}>Add random window</button>
    <Desktop windowManager={windowManager} />

    
  </div>
  </>
  */

  return <>
    <MenuBar/>
    <Desktop windowCompositor={windowCompositor} />
  </>
}
