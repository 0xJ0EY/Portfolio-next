import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { SystemAPIs } from "@/components/Desktop";

export class FinderConfig implements ApplicationConfig {
  public readonly displayName = 'Finder';
  public readonly path = '/Applications/';
  public readonly appName = 'Finder.app';
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new FinderApplication(compositor, manager, apis);
}

export const finderConfig = new FinderConfig();

export class FinderApplication extends Application {

  config(): ApplicationConfig {
    return finderConfig;
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
  }
}
