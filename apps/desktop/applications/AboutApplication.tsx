import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import React from "react";
import { Application, ApplicationEvent } from "./ApplicationManager";

const View = React.lazy(() => import('./AboutApplicationView'));

export class AboutApplication extends Application {

  displayName() { return "About" }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'open') {
      this.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: "About application",
        application: this,
        generator: () => { return View; }
      });
    };

    if (event.kind === 'close') {
      if (!windowContext) { return; }

      this.compositor.close(windowContext!.id);
    }
  }
}
