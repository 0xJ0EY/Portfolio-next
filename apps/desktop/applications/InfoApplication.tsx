import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "./ApplicationEvents";
import { Application, ApplicationConfig } from "./ApplicationManager";
import { LocalApplicationManager } from "./LocalApplicationManager";
import dynamic from 'next/dynamic';
import { SystemAPIs } from "@/components/Desktop";

const View = dynamic(() => import('./InfoApplicationView'));

export class InfoConfig implements ApplicationConfig {
  public readonly displayName = 'Info';
  public readonly path = '/Applications/';
  public readonly appName = 'Info.app';
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new InfoApplication(compositor, manager, apis);
}

export const infoConfig = new InfoConfig();

export class InfoApplication extends Application {

  config(): ApplicationConfig {
    return infoConfig;
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    this.baseHandler(event, windowContext);

    if (event.kind === 'application-open') {
      this.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: `Info application`,
        application: this,
        generator: () => { return View; }
      });
    };

    if (event.kind === 'application-quit') {
      // this.manager.exit();
    }
  }
}
