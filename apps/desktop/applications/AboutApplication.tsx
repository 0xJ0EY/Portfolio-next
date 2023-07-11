import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import React from "react";
import { ApplicationEvent } from "./ApplicationEvents";
import { Application, ApplicationConfig } from "./ApplicationManager";

const View = React.lazy(() => import('./AboutApplicationView'));

export class AboutApplication extends Application {
  
  config(): ApplicationConfig {
    return {
      displayName: 'About'
    }
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'application-open') {
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

    if (event.kind === 'application-quit') {
      if (!windowContext) { return; }

      // this.manager.exit();
    }
  }
}
