import { useRef, useEffect, useState, RefObject } from 'react';
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

const buildResizableStyle = (cursor: string): React.CSSProperties => {
  return { cursor };
}

type ResizeAxis = 'none' | 'e' | 'w' | 'n' | 's' | 'ne' | 'se' | 'sw' | 'nw';
type ResizeCursor = 'none' | 'ew' | 'ns' | 'nesw' | 'nwse';

// TODO: Maybe performance gain? It should be possible to bind the window events to a singular component before these get rendered.
// So we don't have to process all these window events
const Resizable = (props: { windowData: Window, windowCompositor: WindowCompositor}) => {
  const { windowData, windowCompositor } = props;

  const [resizing, setResizing] = useState(false);
  const [cursor, setCursor] = useState('auto');

  const isDown = useRef(false);
  const axis = useRef<ResizeAxis>('none');
  const origin = useRef<{
    x: number,
    y: number,
    windowX: number,
    windowY: number,
    windowWidth: number,
    windowHeight: number
  }>({ x: 0, y: 0, windowX: 0, windowY: 0, windowWidth: 0, windowHeight: 0 });
  
  const output: RefObject<HTMLDivElement> = useRef(null);

  const getResizeAxis = (evt: PointerEvent): ResizeAxis => {
    const node = output.current;
    if (node === null) { return 'none'; }

    const bb = node.getBoundingClientRect();

    const margin = 30;

    const west  = Math.abs(evt.clientX - bb.left) < margin;
    const east  = Math.abs(evt.clientX - (bb.left + bb.width)) < margin;
    const north = Math.abs(evt.clientY - bb.top) < margin;
    const south = Math.abs(evt.clientY - (bb.top + bb.height)) < margin;

    if (north && west) { return 'nw'; }
    if (north && east) { return 'ne'; }
    if (south && west) { return 'sw'; }
    if (south && east) { return 'se'; }
    if (north) { return 'n'; }
    if (south) { return 's'; }
    if (east) { return 'e'; }
    if (west) { return 'w'; }

    return 'none';
  }

  const getResizeCursorAxis = (evt: PointerEvent): ResizeCursor => {
    const axis = getResizeAxis(evt);

    switch (axis) {
      case 'none': return 'none';
      case 'e':
      case 'w':
        return 'ew';
      case 'n':
      case 's':
        return 'ns';
      case 'ne':
      case 'sw':
        return 'nesw';
      case 'se':
      case 'nw':
        return 'nwse';
    }
  }

  function onPointerDown(evt: PointerEvent) {
    isDown.current = true;
    axis.current = getResizeAxis(evt);

    setResizing(true);
    origin.current = {
      x: evt.clientX,
      y: evt.clientY,
      windowX: windowData.x,
      windowY: windowData.y,
      windowWidth: windowData.width,
      windowHeight: windowData.height
    };
  }

  function onPointerUp(evt: PointerEvent) {
    isDown.current = false;
    setResizing(false);
  }

  function onPointerMove(evt: PointerEvent) {
    if (!isDown.current) { return; }

    const [deltaX, deltaY] = [
      origin.current.x - evt.clientX,
      origin.current.y - evt.clientY
    ];

    const [windowX, windowY] = [
      origin.current.windowX,
      origin.current.windowY
    ];

    const [windowWidth, windowHeight] = [
      origin.current.windowWidth,
      origin.current.windowHeight
    ];

    const axes = axis.current.split('');

    for (const axis of axes) {
      switch (axis) {
        case 'n':
          windowData.y = windowY - deltaY;
          windowData.height = windowHeight + deltaY;
          break;
        case 'e':
          windowData.width = windowWidth - deltaX;
          break;
        case 's':
          windowData.height = windowHeight - deltaY;
          break;
        case 'w':
          windowData.x = windowX - deltaX;
          windowData.width = windowWidth + deltaX;
          break;
      }
    }

    windowCompositor.update(windowData);
  }

  function onPointerMoveOnElement(evt: PointerEvent) {
    const axis = getResizeCursorAxis(evt);

    if (axis === 'none') {
      setCursor('auto');
      return;
    }

    setCursor(`${axis}-resize`);
  }

  useEffect(() => {
    const node = output.current;
    if (node === null) { return; }

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMoveOnElement);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    
    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMoveOnElement);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  const resizableStyle = buildResizableStyle(cursor);
  
  return <>
   <div ref={output} className={styles.resizable} style={resizableStyle}></div>
   { resizing && <>Resizing</>}  
  </>;
}

const WindowHeader = (window: Window, windowCompositor: WindowCompositor) => {
  const classes = [styles.header];

  if (window.focused) { classes.push(styles.focused); }

  return (
    <div className={classes.join(' ')}>
      <span>{ window.title }</span>
      <button onClick={() => { windowCompositor.close(window.id) }}>Close</button>
    </div>
  ) 
}

export default function WindowContainer(props: { window: Window, Application: WindowApplication, windowCompositor: WindowCompositor }) {
  const { window, Application, windowCompositor } = props;

  function focus() { windowCompositor.focus(window.id); }

  const style = calculateStyle(window);
  const header = WindowHeader(window, windowCompositor);

  const focusedClass = window.focused ? styles.focused : ''; 
  const contentContainerClasses = `${styles.contentContainer} ${focusedClass}`;

  return (
    <div style={style}>
      <div className={styles.container}>
        {!window.focused && <div onClick={focus} className={styles.focusLayer}></div>}
        {window.focused && <Resizable windowData={window} windowCompositor={windowCompositor} />}

        <div className={contentContainerClasses}>
          {header}

          <div className={styles.content}>
            <Application/>
          </div>
        </div>
      </div>
    </div>
  )
}
