export type WindowCreateEvent = {
  event: 'create_window',
  windowId: number
}

export type WindowUpdateEvent = {
  event: 'update_window',
  windowId: number
}

export type WindowsUpdateEvent = {
  event: 'update_windows',
}

export type WindowDestroyEvent = {
  event: 'destroy_window',
  windowId: number
}

export const CreateWindowEvent = (windowId: number): WindowCreateEvent => {
  return {
    event: 'create_window',
    windowId
  }
}

export const UpdateWindowEvent = (windowId: number): WindowUpdateEvent => {
  return {
    event: 'update_window',
    windowId
  }
}

export const UpdateWindowsEvent = (): WindowsUpdateEvent => {
  return {
    event: 'update_windows'
  }
}

export const DestroyWindowEvent = (windowId: number): WindowDestroyEvent => {
  return {
    event: 'destroy_window',
    windowId
  }
}

export type WindowEvent = WindowCreateEvent | WindowUpdateEvent | WindowsUpdateEvent | WindowDestroyEvent;
export type WindowEventHandler = (evt: WindowEvent) => void
