import { SystemAPIs } from "@/components/OperatingSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { Window, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent, ApplicationOpenEvent } from "../ApplicationEvents";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./DoomView'));

export class DoomConfig implements ApplicationConfig {
  public readonly displayName = 'Doom';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Doom.app';
  public readonly appIcon = { src: '/icons/folder-icon.png', alt: 'Doom application' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new NotesApplication(compositor, manager, apis);
}

export const doomConfig = new DoomConfig();

export class NotesApplication extends Application {
  private currentWindow: Window | null = null;

  config(): ApplicationConfig {
    return doomConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Doom',
      items: []
    }];
  }

  private createNewWindow(event: ApplicationOpenEvent): Window {
    return this.compositor.open({
      x: 200,
      y: 200,
      height: 400,
      width: 400,
      title: `Doom`,
      application: this,
      args: event.args,
      generator: () => { return View; }
    });
  }

  private focusWindow(): void {
    if (!this.currentWindow) { return; }

    this.compositor.focus(this.currentWindow.id);
  }

  on(event: ApplicationEvent, windowContext?: WindowContext | undefined): void {
    this.baseHandler(event, windowContext);

    if (event.kind === 'application-open') {
      if (!this.currentWindow) {
        this.currentWindow = this.createNewWindow(event);
      } else {
        this.focusWindow();
      }
    };
  }
}
