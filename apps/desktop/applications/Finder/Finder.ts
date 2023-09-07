import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { SystemAPIs } from "@/components/OperatingSystem";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./FinderView'));

export class FinderConfig implements ApplicationConfig {
  public readonly displayName = 'Finder';
  public readonly path = '/Applications/';
  public readonly appName = 'Finder.app';
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new Finder(compositor, manager, apis);
}

export const finderConfig = new FinderConfig();

export class Finder extends Application {

  config(): ApplicationConfig {
    return finderConfig;
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'application-open') {
      const window = this.compositor.open({
        x: 100,
        y: 100,
        height: 400,
        width: 650,
        title: `Finder`,
        application: this,
        args: event.args.length !== 0 ? event.args : '/',
        generator: () => { return View; }
      });

      window.minimalHeight  = 250;
      window.minimalWidth   = 400;
    };

    if (event.kind === 'finder-open-file-event') {
      if (!windowContext) { return }

      this.manager.open(event.path);
    }
  }
}
