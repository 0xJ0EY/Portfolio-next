export type WindowCreateEvent = {
  event: 'create_window',
  windowId: number
}

export type WindowUpdateEvent = {
  event: 'update_window',
  moved: boolean,
  resized: boolean,
  windowId: number
}

export type WindowFocusEvent = {
  event: 'focus_window',
  windowId: number,
}

export type WindowMinimizeEvent = {
  event: 'minimize_window',
  windowId: number
}

export type WindowMaximizeEvent = {
  event: 'maximize_window',
  windowId: number
}

export type WindowsUpdateEvent = {
  event: 'update_windows',
}

export type WindowDestroyEvent = {
  event: 'destroy_window',
  windowId: number
}

export function CreateWindowEvent(windowId: number): WindowCreateEvent {
  return {
    event: 'create_window',
    windowId
  }
}

export function UpdateWindowEvent(windowId: number, moved: boolean, resized: boolean): WindowUpdateEvent {
  return {
    event: 'update_window',
    moved,
    resized,
    windowId
  }
}

export function FocusWindowEvent(windowId: number): WindowFocusEvent {
  return {
    event: 'focus_window',
    windowId
  }
}

export function MinimizeWindowEvent(windowId: number): WindowMinimizeEvent {
  return {
    event: 'minimize_window',
    windowId
  }
}

export function MaximizeWindowEvent(windowId: number): WindowMaximizeEvent {
  return {
    event: 'maximize_window',
    windowId
  }
}

export function UpdateWindowsEvent(): WindowsUpdateEvent {
  return {
    event: 'update_windows'
  }
}

export function DestroyWindowEvent(windowId: number): WindowDestroyEvent {
  return {
    event: 'destroy_window',
    windowId
  }
}

export function toSingleWindowEvent(evt: WindowEvent): SingleWindowEvent | null {
  switch (evt.event) {
    case 'create_window':
    case 'update_window':
    case 'focus_window':
    case 'minimize_window':
    case 'maximize_window':
      return evt as SingleWindowEvent;
    default:
      return null;
  }
}

export type SingleWindowEvent = WindowCreateEvent | WindowUpdateEvent | WindowMinimizeEvent | WindowMaximizeEvent | WindowDestroyEvent | WindowFocusEvent;
export type MultiWindowEvent = WindowsUpdateEvent;
export type WindowEvent = SingleWindowEvent | MultiWindowEvent;

export type WindowEventHandler = (evt: WindowEvent) => void
