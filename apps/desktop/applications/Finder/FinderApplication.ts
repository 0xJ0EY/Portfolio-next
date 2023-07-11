import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application } from "../ApplicationManager";

export class FinderApplication extends Application {

  displayName(): string {
    return "Finder";
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {

  }
}
