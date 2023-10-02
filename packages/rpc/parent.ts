import { Result, Err, Ok } from "result";
import { Request } from "./structure";

export function parseRequestFromChild(event: MessageEvent): Result<Request> {
  const method = event.data['method'] ?? null;

  switch (method) {
    case 'touch_interaction_request': {
      return Ok({
        'method': 'touch_interaction_request',
        'event': event.data['event'],
      });
    }
    default: {
      return Err(Error("Not a deserializable data structure"));
    }
  }
}
