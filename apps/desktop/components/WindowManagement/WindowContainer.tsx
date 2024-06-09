import { useRef, useEffect, useState, RefObject, MutableRefObject, useReducer, FormEvent } from 'react';
import { Window, WindowAction, WindowActionAlert, WindowActionPrompt, WindowApplication, WindowCompositor, WindowContext } from "./WindowCompositor";
import styles from '@/styles/WindowContainer.module.css';
import { clamp } from '../util';
import { ScreenResolution } from '@/apis/Screen/ScreenService';

const DoubleClickHeaderForMaximizingTimeInMs = 1000;

const calculateWindowZIndex = (order: number): number => {
  return 1000 + order * 10;
}

const calculateStyle = (window: Window): React.CSSProperties => {
  return {
    position: 'absolute',
    display: !window.minimized ? 'block' : 'none',
    top: `${window.y}px`,
    left: `${window.x}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
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
const Resizable = (props: { windowData: Window, windowCompositor: WindowCompositor, parent: HTMLDivElement, isMaximized: MutableRefObject<boolean> }) => {
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

    const west = Math.abs(evt.clientX - bb.left) < margin;
    const east = Math.abs(evt.clientX - (bb.left + bb.width)) < margin;
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

    const original = {
      x: windowData.x,
      y: windowData.y,
      height: windowData.height,
      width: windowData.width,
    };

    const windowMinHeight = windowData.minimalHeight;
    const windowMinWidth = windowData.minimalWidth;

    const windowMaxHeight = window.innerHeight;
    const windowMaxWidth = window.innerWidth;

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

    const moved = original.x !== windowData.x || original.y !== windowData.y;
    const resized = original.height !== windowData.height || original.width !== windowData.width;

    windowCompositor.update(windowData, { moved, resized });
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
    <div ref={output} data-interactive-window className={styles['resizable']} style={resizableStyle}></div>
    {resizing && <div data-interactive-window className={styles['resizing-mask']} style={resizableStyle}></div>}
  </>;
}


type OriginWindow = {
  x: number,
  y: number,
  width: number,
  height: number
}

const MinimizeIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAC5JREFUKJFjYBh+gBFK/ydFDyMShxiNjMg2EaOREYNBQCMjTg4OjbjUENQ4lAAAsBUGBRYmg2IAAAAASUVORK5CYII=';
const MaximizeIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAADBJREFUKJFjYBhZ4D8uCUYiNGCowaYJmw2MODn4nISsFlkTPg0o6mGaiNGAzaLBCACuAwYFQV/6vgAAAABJRU5ErkJggg==';
const CloseIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAEhJREFUKJFjYKAA/IdiotQwYZHApQEOGHFI4BVHlsSmAKtB6JpwOZERJwefkwhpImgTvtDDFRiUhR5eP6DLozsPV8DgEiceAADT2BMJIsMZOQAAAABJRU5ErkJggg==';

const WindowHeader = (
  windowData: Window,
  windowCompositor: WindowCompositor,
  parent: HTMLDivElement,
  maximized: MutableRefObject<boolean>
) => {
  const [dragging, setDragging] = useState(false);
  const [needsMobileView, setNeedsMobileView] = useState(false);
  const apis = windowData.application.apis;

  const output: RefObject<HTMLDivElement> = useRef(null);
  const lastTimeHeaderClicked = useRef<number>(0);
  const isMaximized = maximized;

  const isDown = useRef(false);
  const origin = useRef<Origin>(new Origin());

  const originalWindow = useRef<OriginWindow>({ x: 0, y: 0, width: 0, height: 0 });

  const classes = [styles.header];

  if (needsMobileView) { classes.push(styles.mobile); }
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

  function resetDoubleClickOnHeader(): void {
    lastTimeHeaderClicked.current = 0;
  }

  function handleDoubleClickOnHeader(): void {
    if (lastTimeHeaderClicked.current === null) { return; }

    const now = Date.now();
    const timeDifference = now - lastTimeHeaderClicked.current;

    if (timeDifference < DoubleClickHeaderForMaximizingTimeInMs) {
      onClickMaximize();

      resetDoubleClickOnHeader();
    } else {
      lastTimeHeaderClicked.current = now;
    }
  }

  function onPointerDown(evt: PointerEvent) {
    if (evt.target !== output.current) {
      resetDoubleClickOnHeader();
      return;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    handleDoubleClickOnHeader();

    // I cannot put a ref on the root, due to rerenders so this is the solution :^)
    const windowRoot = output.current!.parentNode!.parentNode!.parentNode as HTMLDivElement;

    setDragging(true);
    isDown.current = true;

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

    isMaximized.current = false;
    resetDoubleClickOnHeader();

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
    windowData.y = Math.max(windowY, 0);

    windowCompositor.update(windowData);
  }

  function onPointerUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    setDragging(false);
    isDown.current = false;
  }

  function onScreenChangeListener(resolution: ScreenResolution): void {
    setNeedsMobileView(resolution.isMobileDevice());
  }

  useEffect(() => {
    const node = output.current;
    if (node === null) { return; }

    const unsubscribe = apis.screen.subscribe(onScreenChangeListener);

    const resolution = apis.screen.getResolution();
    if (resolution) { onScreenChangeListener(resolution); }

    node.addEventListener('pointerdown', onPointerDown);

    return () => {
      unsubscribe();
      node.removeEventListener('pointerdown', onPointerDown);
    }

  }, []);

  return <>
    <div ref={output} data-interactive-window className={classes.join(' ')}>
      <span className={styles['header-title']}>{windowData.title}</span>
      <div className={styles.lines}></div>
      <div className={styles['header-buttons']}>
        <button className='header-button' onClick={() => { windowCompositor.minimize(windowData.id) }}><img src={MinimizeIcon} alt='Minimize window' draggable={false} /></button>
        <button className='header-button' onClick={onClickMaximize}><img src={MaximizeIcon} alt='Maximize window' draggable={false} /></button>
        <button className='header-button' onClick={() => { windowCompositor.close(windowData.id) }}><img src={CloseIcon} alt='Close window' draggable={false} /></button>
      </div>
    </div>
    {dragging && <div className={styles['dragging-mask']}></div>}
  </>
}

function HandleWindowActionPrompt(props: {prompt: WindowActionPrompt | null}) {
  const prompt = props.prompt;
  const inputRef = useRef<HTMLInputElement>(null);

  // A hack to force a rerender when a "valid" prompt is used
  const [onMountComponent, forceRerender] = useReducer((p) => !p, true);

  function onCancel() {
    if (!prompt) { return; }

    prompt.reject("Prompt canceled by user");
  }

  const onSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    if (!prompt) { return; }
    if (!inputRef.current) { return; }
    const value = inputRef.current.value;

    prompt.resolve(value);
  }

  useEffect(() => {
    if (!prompt) { return; }

    forceRerender();
  }, [prompt]);

  useEffect(() => {
    if (!inputRef.current) { return; }
    inputRef.current.select();

  }, [onMountComponent]);

  if (!prompt) { return <></> }

  return <>
    <div className={styles['action-overlay']}>
      <div className={styles['action-container']}>
        <span>{prompt.prompt}</span>
        <form onSubmit={onSubmit}>
          <input ref={inputRef} type="text" className='system-text-input' defaultValue={prompt.defaultValue} required />
          <div className={styles['action-buttons']}>
            <button className="system-button" type="button" onClick={() => onCancel()}>Cancel</button>
            <button className="system-button" type="submit">Ok</button>
          </div>
        </form>
      </div>
    </div>
  </>
}

function HandleWindowActionAlert(props: {alert: WindowActionAlert | null}) {
  const alert = props.alert;
  const buttonRef = useRef<HTMLButtonElement>(null);

    // A hack to force a rerender when a "valid" prompt is used
    const [onMountComponent, forceRerender] = useReducer((p) => !p, true);

  function onOk() {
    if (!alert) { return; }

    alert.resolve();
  }

  useEffect(() => {
    if (!alert) { return; }

    forceRerender();
  }, [alert]);

  useEffect(() => {
    if (!buttonRef.current) { return; }
    buttonRef.current.focus();

  }, [onMountComponent]);

  if (!alert) { return <></> }

  return <>
    <div className={styles['action-overlay']}>
      <div className={styles['action-container']}>
        <span>{alert.alert}</span>
        <div className={styles['action-buttons']}>
          <button ref={buttonRef} className="system-button" type="submit" onClick={() => onOk()}>Ok</button>
        </div>
      </div>
    </div>
  </>
}

function HandleWindowAction(props: { action: WindowAction | null }) {
  const action = props.action;
  
  return (<>
    <HandleWindowActionPrompt prompt={action?.action === 'prompt' ? action : null} />
    <HandleWindowActionAlert alert={action?.action === 'alert' ? action : null} />
  </>)
}

export default function WindowContainer(props: { window: Window, WindowApp: WindowApplication, windowCompositor: WindowCompositor, parent: HTMLDivElement | null }) {
  const { window, WindowApp, windowCompositor } = props;

  const maximized = useRef(false);

  if (props.parent === null) { return <></>; }
  const parent = props.parent;

  function focus() { windowCompositor.focus(window.id); }

  const style = calculateStyle(window);
  const header = WindowHeader(window, windowCompositor, parent, maximized);

  const focusedClass = window.focused ? styles.focused : '';
  const contentContainerClasses = `${styles['content-container']} ${focusedClass}`;

  const windowContext: WindowContext = {
    id: window.id
  };

  return (
    <div style={style} data-window-root="true">
      <div className={styles.container}>
        {!window.focused && <div onPointerDown={focus} className={styles['focus-layer']}></div>}
        {window.focused && <Resizable
          windowData={window}
          windowCompositor={windowCompositor}
          parent={parent}
          isMaximized={maximized} />}

        <div className={contentContainerClasses}>
          {header}

          <div className={styles.content}>
            <HandleWindowAction action={window.action} />
            <WindowApp application={window.application} args={window.args} windowContext={windowContext} />
          </div>
        </div>
      </div>
    </div>
  )
}
