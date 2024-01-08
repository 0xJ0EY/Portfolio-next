import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import dynamic from 'next/dynamic';
import { SystemAPIs } from "@/components/OperatingSystem";

const View = dynamic(() => import('./DebugApplicationView'));

export class DebugConfig implements ApplicationConfig {
  public readonly displayName = 'Debug';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Debug.app';
  public readonly appIcon = { src: '/icons/folder-icon.png', alt: 'Debug application' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new DebugApplication(compositor, manager, apis);
}

export const debugConfig = new DebugConfig();

export class DebugApplication extends Application {

  config(): ApplicationConfig {
    return debugConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Debug',
      items: []
    }]
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    this.baseHandler(event, windowContext);

    if (event.kind === 'application-open') {
      this.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: `Debug application`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      });
    };
  }
}
