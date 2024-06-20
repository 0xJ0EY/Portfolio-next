import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import dynamic from 'next/dynamic';
import { SystemAPIs } from "@/components/OperatingSystem";

const View = dynamic(() => import('./TerminalApplicationView'));

export class TerminalConfig implements ApplicationConfig {
  public readonly displayName = 'Terminal';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Terminal.app';
  public readonly appIcon = { src: '/icons/folder-icon.png', alt: 'Terminal' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new TerminalApplication(compositor, manager, apis);
}

export const terminalConfig = new TerminalConfig();

export class TerminalApplication extends Application {

  config(): ApplicationConfig {
    return terminalConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Terminal',
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
        title: `Terminal`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      });
    };
  }
}
