import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "./ApplicationEvents";
import { Application, ApplicationConfig } from "./ApplicationManager";
import { LocalApplicationManager } from "./LocalApplicationManager";
import dynamic from 'next/dynamic';
import { SystemAPIs } from "@/components/Desktop";

const View = dynamic(() => import('./AboutApplicationView'));

export class AboutConfig implements ApplicationConfig {
  public readonly displayName = 'About';
  public readonly path = '/Applications/';
  public readonly appName = 'About.app';
  public readonly entrypoint = (
    compositor:LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new AboutApplication(compositor, manager, apis);
}

export const aboutConfig = new AboutConfig();

export class AboutApplication extends Application {
  
  config(): ApplicationConfig {
    return aboutConfig;
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    this.baseHandler(event, windowContext);

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
