import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { ApplicationEvent } from "../ApplicationEvents";
import { Application, ApplicationConfig, MenuEntry } from "../ApplicationManager";
import { LocalApplicationManager } from "../LocalApplicationManager";
import dynamic from 'next/dynamic';
import { SystemAPIs } from "@/components/OperatingSystem";

const View = dynamic(() => import('./AlgorithmVisualizerView'));

export class AlgorithmVisualizerConfig implements ApplicationConfig {
  public readonly displayName = 'Algorithm visualizer';
  public readonly dockPriority = null;
  public readonly path = '/Applications/';
  public readonly appName = 'Algorithms.app';
  public readonly appIcon = { src: '/icons/algorithm-visualizer-icon.png', alt: 'Algorithm visualizer' };
  public readonly entrypoint = (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => new AlgorithmVisualizer(compositor, manager, apis);
}

export const algorithmVisualizerConfig = new AlgorithmVisualizerConfig();

export class AlgorithmVisualizer extends Application {

  config(): ApplicationConfig {
    return algorithmVisualizerConfig;
  }

  menuEntries(): MenuEntry[] {
    return [{
      displayOptions: { boldText: true },
      name: 'Algorithm visualizer',
      items: []
    }]
  }

  on(event: ApplicationEvent, windowContext?: WindowContext): void {
    this.baseHandler(event, windowContext);

    const y       = 70;
    const width   = 700;
    const height  = 650;
    const x       = (window.innerWidth - width) / 2;

    if (event.kind === 'application-open') {
      this.compositor.open({
        x, y,
        height,
        width,
        title: `Algorithm visualizer`,
        application: this,
        args: event.args,
        generator: () => { return View; }
      });
    };
  }
}
