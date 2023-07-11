import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import React from "react";
import { Application, ApplicationEvent } from "./ApplicationManager";

const View = React.lazy(() => import('./InfoApplicationView'));

export class InfoApplication extends Application {

  displayName() { return "Info" }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'open') {
      this.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: "Info application",
        application: this,
        generator: () => { return View; }
      });
    };

    if (event.kind === 'close') {
      console.log(windowContext);
    }
  }
}
