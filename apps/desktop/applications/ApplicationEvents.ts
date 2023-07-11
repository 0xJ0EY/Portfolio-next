export type ApplicationOpenEvent = {
  kind: 'application-open',
  isFirst: boolean,
}

export type ApplicationQuitEvent = {
  kind: 'application-quit',
}

export type WindowOpenEvent = {
  kind: 'window-open',
  windowId: number
}

export type WindowCloseEvent = {
  kind: 'window-close',
  windowId: number
}

export type AllWindowsClosedEvent = {
  kind: 'all-windows-closed',
}

export function createApplicationOpenEvent(isFirst: boolean): ApplicationOpenEvent {
  return { kind: 'application-open', isFirst };
}

export function createApplicationQuitEvent(): ApplicationQuitEvent {
  return { kind: 'application-quit' };
}

export function createWindowOpenEvent(windowId: number): WindowOpenEvent {
  return { kind: 'window-open', windowId };
}

export function createWindowCloseEvent(windowId: number): WindowCloseEvent {
  return { kind: 'window-close', windowId };
}

export function createAllWindowsClosedEvent(): AllWindowsClosedEvent {
  return { kind: 'all-windows-closed' };
}

export type ApplicationEvent =
  ApplicationOpenEvent | ApplicationQuitEvent |
  WindowOpenEvent | WindowCloseEvent | AllWindowsClosedEvent;
