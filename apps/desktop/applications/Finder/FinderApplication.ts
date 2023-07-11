import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig } from "../ApplicationManager";

export class FinderApplication extends Application {

  config(): ApplicationConfig {
    return {
      displayName: "Finder"
    }
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {

  }
}
