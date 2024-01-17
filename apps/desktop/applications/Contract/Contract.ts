import { ApplicationIcon } from "@/apis/FileSystem/FileSystem";
import { SystemAPIs } from "@/components/OperatingSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./ContactView'));

export class ContactConfig implements ApplicationConfig {
  public readonly displayName = 'Contact';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Contact.app';
  public readonly appIcon = { src: '/icons/file-icon.png', alt: 'Contact application' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new ContactApplication(compositor, manager, apis);
}

export const contactConfig = new ContactConfig();

export class ContactApplication extends Application {
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

  on(event: ApplicationEvent, windowContext?: WindowContext | undefined): void {
    this.baseHandler(event, windowContext);

    if (event.kind === 'application-open') {
      this.compositor.open({
        x: 200,
        y: 200,
        height: 400,
        width: 400,
        title: `Contact`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      });
    };
  }
}
