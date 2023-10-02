import { Request } from "./structure";

export function sendRequestToParent(request: Request) {
  const parent = window.top;
  if (!parent) { throw new Error("Can not send a message to the parent"); }

  return sendRequest(parent, request);
}

export function sendRequest(target: Window, request: Request) {
  target.postMessage(request, '*');
}
