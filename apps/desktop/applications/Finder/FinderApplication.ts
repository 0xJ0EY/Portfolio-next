import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";

export class FinderConfig implements ApplicationConfig {
  public readonly displayName = 'Finder';
  public readonly path = '/Applications/';
  public readonly appName = 'Finder.app'
  public readonly entrypoint = (compositor: LocalWindowCompositor, manager: LocalApplicationManager) => new FinderApplication(compositor, manager);
}

export const finderConfig = new FinderConfig();

export class FinderApplication extends Application {

  config(): ApplicationConfig {
    return finderConfig;
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {

  }
}
