import { ApplicationIcon } from "@/apis/FileSystem/FileSystem";
import { SystemAPIs } from "@/components/OperatingSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./ImageViewerView'));

export class ImageViewerConfig implements ApplicationConfig {
  public readonly displayName = 'Image';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Image.app';
  public readonly appIcon = { src: '/icons/file-icon.png', alt: 'Image' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new ImageViewerApplication(compositor, manager, apis);
}

export const imageViewerConfig = new ImageViewerConfig();

export class ImageViewerApplication extends Application {
  config(): ApplicationConfig {
    return imageViewerConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Image',
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
        title: `Image`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      });
    };
  }
}
