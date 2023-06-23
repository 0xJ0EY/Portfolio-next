import { OrderedWindow, Window, WindowManager } from "./WindowManager";

export const WindowContainer = (orderedWindow: OrderedWindow, wm: WindowManager) => {
  const window  = orderedWindow.getWindow();
  const order   = orderedWindow.getOrder(); // Order equals the Z-index

  const style = {
    position: 'absolute',
    display: 'block',
    top: `${window.y}px`,
    left: `${window.x}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    backgroundColor: 'red',
  } as React.CSSProperties;

  return <div onClick={() => wm.focus(window)} key={window.id} style={style}>{window.title}
    {window.content}
  </div>;
}
