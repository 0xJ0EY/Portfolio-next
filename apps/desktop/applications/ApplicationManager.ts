import { FileSystem } from "@/components/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "@/components/util";

export type ApplicationEvent = 'open' | 'close';

export class ApplicationContext {
  constructor(
    public readonly path: string,
    public readonly isFirstProcess: boolean,
    public readonly compositor: LocalWindowCompositor
  ) {}
}

export interface Application {
  on(event: ApplicationEvent, context: ApplicationContext): void;
}

type ApplicationInstance = {
  application: Application,
  context: ApplicationContext
}

export class ApplicationManager {

  private processId: number = 0;
  private processes: (ApplicationInstance | null)[] = [];

  constructor(
    private windowCompositor: WindowCompositor,
    private fileSystem: FileSystem
  ) {}

  open(argument: string): Result<number, Error> {
    const args = argument.split(' ');

    const path = args[0] ?? '';
    const node = this.fileSystem.getApplication(path);

    if (!node.ok) { return Err(Error("File not found")); }

    const application = node.value;
    const isFirstProcess = !this.processes.find(x => x?.context.path === path);

    const compositor = new LocalWindowCompositor(this.windowCompositor);

    const instance = {
      application: application.entrypoint(),
      context: new ApplicationContext(path, isFirstProcess, compositor),
    };

    this.processes.push(instance);

    instance.application.on('open', instance.context);

    return Ok(this.processId++);
  }

  quit(processId: number): void {
    const instance = this.processes[processId];

    if (instance === null) { return; }

    instance.application.on('close', instance.context);
    instance.context.compositor.closeAll();

    this.processes[processId] = null;
  }

  reset(): void {
    for (let i = 0; i < this.processId; i++) {
      this.quit(i);
    }

    this.processId = 0;
    this.processes = [];
  }
}
