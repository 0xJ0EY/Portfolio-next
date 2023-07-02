import { useRef, useEffect, useState, RefObject } from 'react';
import { Window, WindowApplication, WindowCompositor } from "./WindowCompositor";
import styles from '@/styles/WindowContainer.module.css';
import { clamp } from '../util';

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

class Origin {
  public cursor: {
    x: number,
    y: number
  } = { x: 0, y: 0 }

  public boundingBox: {
    top: number,
    left: number,
    width: number,
    height: number
  } = { top: 0, left: 0, width: 0, height: 0 };

  public window: {
    x: number,
    y: number,
    width: number,
    height: number
  } = { x: 0, y: 0, width: 0, height: 0 };
}

// TODO: Maybe performance gain? It should be possible to bind the window events to a singular component before these get rendered.
// So we don't have to process all these window events
const Resizable = (props: { windowData: Window, windowCompositor: WindowCompositor}) => {
  const { windowData, windowCompositor } = props;

  const [resizing, setResizing] = useState(false);
  const [cursor, setCursor] = useState('auto');

  const isDown = useRef(false);
  const axis = useRef<ResizeAxis>('none');
  const origin = useRef<Origin>(new Origin());
  
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

  const onPointerDown = (evt: PointerEvent) => {
    const node = output.current;
    if (node === null) { return; }

    isDown.current = true;
    axis.current = getResizeAxis(evt);

    const bb = node.getBoundingClientRect();

    setResizing(true);
  
    origin.current.cursor = { x: evt.clientX, y: evt.clientY };
    
    origin.current.window = {
      x: windowData.x,
      y: windowData.y,
      width: windowData.width,
      height: windowData.height
    };

    origin.current.boundingBox = {
      top: bb.top,
      left: bb.left,
      width: bb.width,
      height: bb.height
    };
  }

  function onPointerUp(evt: PointerEvent) {
    isDown.current = false;
    setResizing(false);
  }

  function onPointerMove(evt: PointerEvent) {
    if (!isDown.current) { return; }

    // TODO: Should be configurable per window
    const windowMinHeight = 100;
    const windowMinWidth  = 200; 

    const [deltaX, deltaY] = [
      origin.current.cursor.x - evt.clientX,
      origin.current.cursor.y - evt.clientY
    ];

    const [windowX, windowY] = [
      origin.current.window.x,
      origin.current.window.y
    ];

    const [windowWidth, windowHeight] = [
      origin.current.window.width,
      origin.current.window.height
    ];

    const axes = axis.current.split('');

    for (const axis of axes) {
      switch (axis) {
        case 'n': {
          const maxDelta = windowY + (windowHeight - windowMinHeight);

          const clampedY = Math.min(windowY - deltaY, maxDelta);
          const clampedHeight = Math.max(windowHeight + deltaY, windowMinHeight);

          windowData.y = clampedY;
          windowData.height = clampedHeight;
        } break;
        case 'e': {
          const clampedWidth = Math.max(windowWidth - deltaX, windowMinWidth);
          windowData.width = clampedWidth;
        } break;
        case 's': {
          const clampedHeight = Math.max(windowHeight - deltaY, windowMinHeight);
          windowData.height = clampedHeight;
        } break;
        case 'w': {
          const maxDelta = windowX + (windowWidth - windowMinWidth);
          
          const clampedX = Math.min(windowX - deltaX, maxDelta);
          const clampedWidth = Math.max(windowWidth + deltaX, windowMinWidth);

          windowData.x = clampedX;
          windowData.width = clampedWidth;
        } break;
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
   { resizing && <div className={styles.resizingMask} style={resizableStyle}></div>}
  </>;
}


const WindowHeader = (windowData: Window, windowCompositor: WindowCompositor) => {
  const [dragging, setDragging] = useState(false);
  const output: RefObject<HTMLDivElement> = useRef(null);
  const isDown = useRef(false);
  const origin = useRef<Origin>(new Origin());

  const classes = [styles.header];
  if (windowData.focused) { classes.push(styles.focused); }

  function onPointerDown(evt: PointerEvent) {
    if (evt.target !== output.current) { return; }

    setDragging(true);
    isDown.current = true;

    if (!windowData.focused) { windowCompositor.focus(windowData.id); }

    origin.current.cursor = { x: evt.clientX, y: evt.clientY };

    origin.current.window = {
      x: windowData.x,
      y: windowData.y,
      width: windowData.width,
      height: windowData.height
    };
  }
  function onPointerMove(evt: PointerEvent) {
    if (!isDown.current) { return; }

    const cursorRef = origin.current.cursor;
    const windowRef = origin.current.window;

    const clientX = clamp(evt.clientX, 0, window.innerWidth);
    const clientY = clamp(evt.clientY, 0, window.innerHeight);

    const deltaX = cursorRef.x - clientX;
    const deltaY = cursorRef.y - clientY;

    const windowX = windowRef.x - deltaX;
    const windowY = windowRef.y - deltaY;

    windowData.x = windowX;
    windowData.y = windowY;

    windowCompositor.update(windowData);
  }
  function onPointerUp(evt: PointerEvent) {
    setDragging(false);
    isDown.current = false;
  }

  useEffect(() => {
    const node = output.current;
    if (node === null) { return; }

    node.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

  }, []);

  return <>
    <div ref={output} className={classes.join(' ')}>
      <span>{ windowData.title }</span>
      <button onClick={() => { windowCompositor.close(windowData.id) }}>Close</button>
    </div>
    { dragging && <div className={styles.draggingMask}></div>}
    </>
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
