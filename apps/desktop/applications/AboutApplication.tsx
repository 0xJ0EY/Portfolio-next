import React from "react";
import { Application, ApplicationContext, ApplicationEvent } from "./ApplicationManager";

const View = React.lazy(() => import('./AboutApplicationView'));

export class AboutApplication implements Application {
  on(event: ApplicationEvent, context: ApplicationContext): void {

    console.log('about');
    if (event.kind === 'open') {
      context.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: "About application",
        generator: () => { return View; }
      });
    };
  }
}
