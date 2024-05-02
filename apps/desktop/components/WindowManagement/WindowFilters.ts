import { WindowEvent } from "./WindowEvents";

export function resizableWindowEventFilter(evt: WindowEvent): boolean {
  if (evt.event !== 'update_window') { return false; }

  return evt.resized;
}
