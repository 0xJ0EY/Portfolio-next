export type ApplicationOpenEvent = {
  kind: 'application-open',
  isFirst: boolean,
  args: string
}

export type ApplicationQuitEvent = {
  kind: 'application-quit',
}

export type ApplicationKillEvent = {
  kind: 'application-kill'
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

export type FinderOpenFileEvent = {
  kind: 'finder-open-file-event',
  path: string
}

export type AboutOpenContactEvent = {
  kind: 'about-open-contact-event',
}

export function createApplicationOpenEvent(isFirst: boolean, args: string): ApplicationOpenEvent {
  return { kind: 'application-open', isFirst, args };
}

export function createApplicationQuitEvent(): ApplicationQuitEvent {
  return { kind: 'application-quit' };
}

export function createApplicationKillEvent(): ApplicationKillEvent {
  return { kind: 'application-kill' };
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

type BaseApplicationEvents = ApplicationOpenEvent | ApplicationQuitEvent | ApplicationKillEvent | WindowOpenEvent | WindowCloseEvent | AllWindowsClosedEvent;
type FinderApplicationEvents = FinderOpenFileEvent;
type AboutApplicationEvents = AboutOpenContactEvent;

export type ApplicationEvent = BaseApplicationEvents | FinderApplicationEvents | AboutApplicationEvents;

export type ApplicationWindowMessage = {
  kind: 'message',
  message: string
}

export type FinderChangePath = {
  kind: 'finder-change-path',
  path: string
}

export type ApplicationWindowEvent = ApplicationWindowMessage | FinderChangePath;
