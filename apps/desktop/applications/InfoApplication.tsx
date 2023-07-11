import React from "react";
import { Application, ApplicationContext, ApplicationEvent } from "./ApplicationManager";

const View = React.lazy(() => import('./InfoApplicationView'));

export class InfoApplication implements Application {
  on(event: ApplicationEvent, context: ApplicationContext): void {
    if (event.kind === 'open') {
      context.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: "Random window",
        generator: () => { return View; }
      });
    };
  }
}
