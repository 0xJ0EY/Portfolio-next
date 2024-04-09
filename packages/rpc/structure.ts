export type TouchInteraction = {
  x: number,
  y: number
}

export type TouchInteractionData = {
  source: 'start' | 'move' | 'end',
  touches: TouchInteraction[]
}

export type TouchInteractionRequest = {
  method: 'touch_interaction_request',
  data: TouchInteractionData,
}

export type Mounted = {
  method: 'mounted'
}

export type DisplaySize = {
  method: 'display_size',
  width: number,
  height: number
}

export type CameraZoomDistanceRequest = {
  method: 'camera_zoom_distance_request'
}

export type SetPossibleCameraParametersRequest = {
  method: 'set_possible_camera_parameters_request',
  currentZoom: number,
  verticalOffset: number,
  horizontalOffset: number,
}

export type SetCameraParametersRequest = {
  method: 'set_camera_parameters_request',
  currentZoom: number,
  verticalOffset: number,
  horizontalOffset: number,
}

export type CameraZoomDistanceResponse = {
  method: 'camera_zoom_distance_response',
  
  min_distance: number,
  max_distance: number,
  current_distance: number,

  horizontal_offset: number,
  max_horizontal_offset: number,

  vertical_offset: number,
  max_vertical_offset: number,
}

export type EnableSoundMessage = {
  method: 'enable_sound_message',
  enabled: boolean,
}

export type RequestToParent = Mounted | TouchInteractionRequest | CameraZoomDistanceRequest | SetPossibleCameraParametersRequest | SetCameraParametersRequest;
export type MessageFromParent = CameraZoomDistanceResponse | EnableSoundMessage | DisplaySize;
