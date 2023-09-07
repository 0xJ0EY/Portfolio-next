import { useRef, useEffect, useState, RefObject, MutableRefObject } from 'react';
import { Window, WindowApplication, WindowCompositor, WindowContext } from "./WindowCompositor";
import styles from '@/styles/WindowContainer.module.css';
import { clamp } from '../util';

const calculateWindowZIndex = (order: number): number => {
  return 1000 + order * 1000;
}

const calculateStyle = (window: Window): React.CSSProperties => {
  return {
    position: 'absolute',
    display: 'block',
    top: `${window.y}px`,
    left: `${window.x}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    backgroundColor: 'red',
    zIndex: calculateWindowZIndex(window.order),
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

  public offset: {
    x: number,
    y: number
  } = { x: 0, y: 0 };

  public window: {
    x: number,
    y: number,
    width: number,
    height: number
  } = { x: 0, y: 0, width: 0, height: 0 };
}

// TODO: Maybe performance gain? It should be possible to bind the window events to a singular component before these get rendered.
// So we don't have to process all these window events
const Resizable = (props: { windowData: Window, windowCompositor: WindowCompositor, parent: HTMLDivElement, isMaximized: MutableRefObject<boolean>}) => {
  const { windowData, windowCompositor, parent, isMaximized } = props;

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

    // Register the event listeners here, so we don't pollute the window with all event listeners
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    isDown.current = true;
    const resizeAxis = getResizeAxis(evt);

    axis.current = resizeAxis;

    const bb = node.getBoundingClientRect();

    setResizing(true);
    isMaximized.current = false;
  
    origin.current.cursor = { x: evt.clientX, y: evt.clientY };
    
    origin.current.window = {
      x: windowData.x,
      y: windowData.y,
      width: windowData.width,
      height: windowData.height
    };

    const correctedWindowY = windowData.y + parent.offsetTop;
    const correctedWindowX = windowData.x + parent.offsetLeft;

    resizeAxis.split('').forEach(x => {
      switch (x) {
        case 'n':
          origin.current.offset.y = origin.current.cursor.y - correctedWindowY;
          break;
        case 's':
          origin.current.offset.y = origin.current.cursor.y - (correctedWindowY + windowData.height);
          break;
        case 'w':
          origin.current.offset.x = origin.current.cursor.x - correctedWindowX;
          break;
        case 'e':
          origin.current.offset.x = origin.current.cursor.x - (correctedWindowX + windowData.width);
          break;
      }
    });

    origin.current.boundingBox = {
      top: bb.top,
      left: bb.left,
      width: bb.width,
      height: bb.height
    };
  }

  function onPointerUp(evt: PointerEvent) {
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointermove', onPointerMove);
    
    isDown.current = false;
    setResizing(false);
  }

  function onPointerMove(evt: PointerEvent) {
    if (!isDown.current) { return; }

    console.log(windowData.minimalHeight);

    const windowMinHeight = windowData.minimalHeight;
    const windowMinWidth  = windowData.minimalWidth;

    const windowMaxHeight = window.innerHeight;
    const windowMaxWidth  = window.innerWidth;

    const offsetX = origin.current.offset.x;
    const offsetY = origin.current.offset.y;

    const [deltaX, deltaY] = [
      origin.current.cursor.x - clamp(evt.clientX, parent.offsetLeft + offsetX, parent.offsetWidth + offsetX),
      origin.current.cursor.y - clamp(evt.clientY, parent.offsetTop + offsetY, parent.offsetTop + parent.offsetHeight + offsetY)
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
          const clampedHeight = clamp(windowHeight + deltaY, windowMinHeight, windowMaxHeight);

          windowData.y = clampedY;
          windowData.height = clampedHeight;
        } break;
        case 'e': {
          const clampedWidth = clamp(windowWidth - deltaX, windowMinWidth, windowMaxWidth);
          windowData.width = clampedWidth;
        } break;
        case 's': {
          const clampedHeight = clamp(windowHeight - deltaY, windowMinHeight, windowMaxHeight);
          windowData.height = clampedHeight;
        } break;
        case 'w': {
          const maxDelta = windowX + (windowWidth - windowMinWidth);
          
          const clampedX = Math.min(windowX - deltaX, maxDelta);
          const clampedWidth = clamp(windowWidth + deltaX, windowMinWidth, windowMaxWidth);

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
    
    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMoveOnElement);
    };
  }, []);

  const resizableStyle = buildResizableStyle(cursor);
  
  return <>
   <div ref={output} className={styles.resizable} style={resizableStyle}></div>
   { resizing && <div className={styles.resizingMask} style={resizableStyle}></div>}
  </>;
}


type OriginWindow = {
  x: number,
  y: number,
  width: number,
  height: number
}

const MaximizeIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAACpJREFUKJFjYBhZ4D8uCUYiNGCowaYJmw2MODn4nISsFlkTPg24LBk2AADhTAUEHwpXHwAAAABJRU5ErkJggg==';
const CloseIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAEhJREFUKJFjYKAA/IdiotQwYZHApQEOGHFI4BVHlsSmAKtB6JpwOZERJwefkwhpImgTvtDDFRiUhR5eP6DLozsPV8DgEiceAADT2BMJIsMZOQAAAABJRU5ErkJggg==';

const WindowHeader = (
  windowData: Window,
  windowCompositor: WindowCompositor,
  parent: HTMLDivElement,
  maximized: MutableRefObject<boolean>
) => {
  const [dragging, setDragging] = useState(false);
  
  const output: RefObject<HTMLDivElement> = useRef(null);
  const isMaximized = maximized;

  const isDown = useRef(false);
  const origin = useRef<Origin>(new Origin());

  const originalWindow = useRef<OriginWindow>({ x: 0, y: 0, width: 0, height: 0 });

  const classes = [styles.header];
  if (windowData.focused) { classes.push(styles.focused); }

  function onClickMaximize() {
    if (isMaximized.current === false) {
      originalWindow.current = {
        x: windowData.x,
        y: windowData.y,
        width: windowData.width,
        height: windowData.height
      };

      windowData.x = 0;
      windowData.y = 0;

      windowData.width = parent.offsetWidth;
      windowData.height = parent.offsetHeight;

      windowCompositor.update(windowData);
      windowCompositor.focus(windowData.id);
    } else {
      windowData.x = originalWindow.current.x;
      windowData.y = originalWindow.current.y;
      windowData.width = originalWindow.current.width;
      windowData.height = originalWindow.current.height;

      windowCompositor.update(windowData);
    }

    isMaximized.current = !isMaximized.current;
  }

  function onPointerDown(evt: PointerEvent) {
    if (evt.target !== output.current) { return; }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    
    // I cannot put a ref on the root, due to rerenders to this is the solution :^)
    const windowRoot = output.current!.parentNode!.parentNode!.parentNode as HTMLDivElement;
    
    setDragging(true);
    isDown.current = true;
    isMaximized.current = false;

    const headerBoundingClient = windowRoot.getBoundingClientRect();
    const offset = evt.clientY - headerBoundingClient.y;

    origin.current.offset.y = offset;
    origin.current.offset.x = 0;

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

    const clientX = clamp(evt.clientX, parent.offsetLeft, parent.offsetWidth);
    const clientY = clamp(evt.clientY,
      parent.offsetTop + origin.current.offset.y,
      parent.offsetHeight + origin.current.offset.y
    );

    const deltaX = cursorRef.x - clientX;
    const deltaY = cursorRef.y - clientY;

    const windowX = windowRef.x - deltaX;
    const windowY = windowRef.y - deltaY;

    windowData.x = windowX;
    windowData.y = windowY;

    windowCompositor.update(windowData);
  }

  function onPointerUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    setDragging(false);
    isDown.current = false;
  }

  useEffect(() => {
    const node = output.current;
    if (node === null) { return; }

    node.addEventListener('pointerdown', onPointerDown);

    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
    }

  }, []);

  return <>
    <div ref={output} className={classes.join(' ')}>
      <span className={styles.headerTitle}>{ windowData.title }</span>

      <div className={styles.headerButtons}>
        <button className='systemButton' onClick={onClickMaximize}><img src={MaximizeIcon} alt='Maximize window'/></button>
        <button className='systemButton' onClick={() => { windowCompositor.close(windowData.id) }}><img src={CloseIcon} alt='Close window'/></button>
      </div>
    </div>
    { dragging && <div className={styles.draggingMask}></div> }
    </>
}

export default function WindowContainer(props: { window: Window, WindowApp: WindowApplication, windowCompositor: WindowCompositor, parent: HTMLDivElement | null}) {
  const { window, WindowApp, windowCompositor } = props;

  const maximized = useRef(false);

  if (props.parent === null) { return <></>; }
  const parent = props.parent;

  function focus() { windowCompositor.focus(window.id); }

  const style = calculateStyle(window);
  const header = WindowHeader(window, windowCompositor, parent, maximized);

  const focusedClass = window.focused ? styles.focused : ''; 
  const contentContainerClasses = `${styles.contentContainer} ${focusedClass}`;

  const windowContext: WindowContext = {
    id: window.id
  };

  return (
    <div style={style} data-window-root="true">
      <div className={styles.container}>
        {!window.focused && <div onClick={focus} className={styles.focusLayer}></div>}
        {window.focused && <Resizable
          windowData={window}
          windowCompositor={windowCompositor}
          parent={parent}
          isMaximized={maximized} />}

        <div className={contentContainerClasses}>
          {header}

          <div className={styles.content}>
            <WindowApp application={window.application} args={window.args} windowContext={windowContext} />
          </div>
        </div>
      </div>
    </div>
  )
}
