import { MouseData, PointerCoordinates, TouchData, UserInteractionEvent } from "@/events/UserInteractionEvents";
import { CameraState } from "../CameraState";
import { CameraHandler, CameraHandlerContext, CameraHandlerState } from "../CameraHandler";
import { constructIsOverDisplay } from "./util";

export class CinematicCameraState extends CameraState {

  private isOverDisplay: (data: PointerCoordinates) => boolean;

  constructor(manager: CameraHandler, ctx: CameraHandlerContext) {
    super(manager, ctx);

    this.isOverDisplay = constructIsOverDisplay(this.ctx);
  }

  transition(): void {

  }

  onUserEvent(data: UserInteractionEvent): void {
    switch (data.event) {
      case 'mouse_event': return this.handleMouseEvent(data.data);
      case 'touch_event': return this.handleTouchEvent(data.data);
    }
  }


  private handleMouseOverMonitor(data: PointerCoordinates): void {
    const overDisplay = this.isOverDisplay(data);

    if (overDisplay) {
      this.manager.changeState(CameraHandlerState.MonitorView);
    }
  }

  private handleMouseEvent(data: MouseData) {
    this.handleMouseOverMonitor(data);

  }

  private handleTouchEvent(data: TouchData) {}


}
