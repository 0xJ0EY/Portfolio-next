export type TouchInteraction = {
  x: number,
  y: number
}

export type TouchInteractionData = {
  source: 'start' | 'move' | 'end',
  touches: TouchInteraction[]
}

export type TouchInteractionRequest = {
  'method': 'touch_interaction_request',
  'data': TouchInteractionData,
}

export type Request = TouchInteractionRequest;
