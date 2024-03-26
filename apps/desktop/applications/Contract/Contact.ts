import { SystemAPIs } from "@/components/OperatingSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { Window, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent, ApplicationOpenEvent } from "../ApplicationEvents";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./ContactView'));

export class ContactConfig implements ApplicationConfig {
  public readonly displayName = 'Contact';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Contact.app';
  public readonly appIcon = { src: '/icons/contact-app.png', alt: 'Contact application' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new ContactApplication(compositor, manager, apis);
}

export const contactConfig = new ContactConfig();

export class ContactApplication extends Application {
  private currentWindow: Window | null = null;

  config(): ApplicationConfig {
    return contactConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Contact',
      items: []
    }];
  }

  private createNewWindow(event: ApplicationOpenEvent): Window {
    const y       = 90;
    const width   = window.innerWidth * 0.6;
    const height  = 600;
    const x       = (window.innerWidth - width) / 2;

    return this.compositor.open({
      x, y,
      height,
      width,
      title: `Contact`,
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

    if (event.kind === 'application-quit') {
      this.currentWindow = null;
    }
  }
}
