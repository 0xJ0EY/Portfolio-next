import styles from '@/styles/Desktop.module.css';
import { useEffect, useState } from "react";
import { OrderedWindow, WindowManager } from './WindowManager';
import { WindowContainer } from './WindowContainer';

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

export const Desktop = (props: { windowManager: WindowManager }) => {
  const [windows, setWindows] = useState<OrderedWindow[]>([]);

  useEffect(() => {
    const updateWindows = () => {
      setWindows(props.windowManager.getOrderedWindows());
    };
    
    const unsubscriber = props.windowManager.subscribe(updateWindows);

    setWindows(props.windowManager.getOrderedWindows());

    return () => {
      unsubscriber();
    }
    
    // setWindows(props.windowManager.get());
  }, []);

  const rows = windows.map(x => WindowContainer(x, props.windowManager));

  return <>
    <div className={styles.desktop}>
      {rows}
      <Dock/>
    </div>
  </>
}

const Test = (text: string) => {
  return <><h1>{text}</h1></>
}; 

export const DesktopComposition = () => {
  const windowManager = new WindowManager();

  windowManager.open({
    x: 0,
    y: 0,
    height: 400,
    width: 400,
    title: "Test2",
    content: Test("Foobar")
  });

  windowManager.open({
    x: 100,
    y: 200,
    height: 400,
    width: 400,
    title: "Test1",
    content: Test("Foobar123")
  });

  // useEffect(() => {

  // }, [])




  // windowManager.open(n(100, 100, 400, 80, "Foobar", Test("Hello")));
  // windowManager.open(new Window(100, 400, 400, 80, "Foobar", Test("World")));
  
  return <>
  <div className={styles.operatingSystem}>
    <MenuBar/>
    <Desktop windowManager={windowManager}  />
  </div>
  </>
}
