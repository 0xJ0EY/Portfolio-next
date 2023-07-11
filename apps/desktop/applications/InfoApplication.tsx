import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import React from "react";
import { ApplicationEvent } from "./ApplicationEvents";
import { Application, ApplicationConfig } from "./ApplicationManager";

const View = React.lazy(() => import('./InfoApplicationView'));

export class InfoApplication extends Application {

  config(): ApplicationConfig {
    return {
      displayName: 'Info'
    }
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'application-open') {
      for (let i = 1; i <= 5; i++) {
        this.compositor.open({
          x: 200 + (20 * i),
          y: 200 + (20 * i),
          height: 400,
          width: 400,
          title: `Info application (${i})`,
          application: this,
          generator: () => { return View; }
        });  
      }
    };

    if (event.kind === 'application-quit') {
      // this.manager.exit();
    }
  }
}
