import { Result, Err, Ok } from "result";
import { RequestToParent, MessageFromParent } from "./structure";

export function sendMessageToChild(target: Window | null, message: MessageFromParent) {
  if (!target) { return; }
  
  target.postMessage(message, '*');
}

export function parseRequestFromChild(event: MessageEvent): Result<RequestToParent> {
  // NOTE: As this is the serialization function, we do not know for certain that the data from event.data[...] exists.
  const method = event.data['method'] ?? null;

  switch (method) {
    case 'camera_zoom_distance_request': {
      return Ok({ method: 'camera_zoom_distance_request' });
    }

    case 'set_possible_camera_parameters_request': {
      return Ok({
        method: 'set_possible_camera_parameters_request',
        currentZoom: event.data['currentZoom'],
        horizontalOffset: event.data['horizontalOffset'],
        verticalOffset: event.data['verticalOffset'],
      });
    }

    case 'set_camera_parameters_request': {
      return Ok({
        method: 'set_camera_parameters_request',
        currentZoom: event.data['currentZoom'],
        horizontalOffset: event.data['horizontalOffset'],
        verticalOffset: event.data['verticalOffset'],
      });
    }

    case 'touch_interaction_request': {
      return Ok({
        'method': 'touch_interaction_request',
        'data': event.data['data'],
      });
    }

    default: {
      return Err(Error("Not a deserializable data structure"));
    }
  }
}
