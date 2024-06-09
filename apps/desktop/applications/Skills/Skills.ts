import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import { SystemAPIs } from "@/components/OperatingSystem";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import dynamic from 'next/dynamic';

const View = dynamic(() => import('./SkillsView'));

export class SkillsConfig implements ApplicationConfig {
  public readonly displayName = 'Skills';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Skills.app';
  public readonly appIcon = { src: '/icons/skills-icon.png', alt: 'Skills application' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new SkillsApplication(compositor, manager, apis);
}

export const skillsConfig = new SkillsConfig();

export class SkillsApplication extends Application {
  config(): ApplicationConfig {
    return skillsConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Skills',
      items: []
    }]
  }

  on(event: ApplicationEvent, windowContext?: WindowContext | undefined): void {
    this.baseHandler(event, windowContext);

    if (event.kind === 'application-open') {
      const y       = 95;
      const width   = 700;
      const height  = 600;
      const x       = (window.innerWidth - width) / 2;

      this.compositor.open({
        x, y,
        height, width,
        title: `Skills`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      })
    }
  }
}
