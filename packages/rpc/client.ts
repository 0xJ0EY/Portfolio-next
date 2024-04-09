import { Err, Ok, Result } from "result";
import { RequestToParent, MessageFromParent } from "./structure";

export function sendRequestToParent(request: RequestToParent) {
  const parent = window.top;
  if (!parent) { throw new Error("Can not send a message to the parent"); }

  return sendRequest(parent, request);
}

export function sendRequest(target: Window, request: RequestToParent) {
  target.postMessage(request, '*');
}

export function parseMessageFromParent(event: MessageEvent): Result<MessageFromParent> {
  const method = event.data['method'] ?? null;

  switch (method) {
    case 'camera_zoom_distance_response': {
      return Ok({
        method: 'camera_zoom_distance_response',
        max_distance: event.data['max_distance'],
        min_distance: event.data['min_distance'],
        current_distance: event.data['current_distance'],
        
        horizontal_offset: event.data['horizontal_offset'],
        max_horizontal_offset: event.data['max_horizontal_offset'],

        vertical_offset: event.data['vertical_offset'],
        max_vertical_offset: event.data['max_vertical_offset'],
      });
    }

    case 'enable_sound_message': {
      return Ok({
        method: 'enable_sound_message',
        enabled: event.data['enabled']
      });
    }

    case 'display_size': {
      return Ok({
        method: 'display_size',
        width: event.data['width'],
        height: event.data['height']
      });
    }

    default: {
      return Err(Error("Not a deserializable data structure"));
    }
  }
}
