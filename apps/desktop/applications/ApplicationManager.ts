import { FileSystem, FileSystemApplication } from "@/components/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "@/components/util";


export type ApplicationOpenEvent = {
  kind: 'open'
}

export type ApplicationCloseEvent = {
  kind: 'close'
}

function createOpenEvent(): ApplicationOpenEvent {
  return { kind: 'open' };
}

function createCloseEvent(): ApplicationCloseEvent {
  return { kind: 'close' };
}

export type ApplicationEvent = ApplicationOpenEvent | ApplicationCloseEvent;

export class ApplicationContext {
  constructor(
    public readonly path: string,
    public readonly isFirstProcess: boolean,
    public readonly compositor: LocalWindowCompositor
  ) {}
}

export interface Application {
  on(event: ApplicationEvent, context: ApplicationContext, windowContext?: WindowContext): void;
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

  private openApplication(application: FileSystemApplication, path: string): Result<number, Error> {
    const compositor = new LocalWindowCompositor(this.windowCompositor);
    const isFirstProcess = !this.processes.find(x => x?.context.path === path);

    const instance = {
      application: application.entrypoint(),
      context: new ApplicationContext(path, isFirstProcess, compositor),
    };

    this.processes.push(instance);

    instance.application.on(createOpenEvent(), instance.context);

    return Ok(this.processId++);
  }

  open(argument: string): Result<number, Error> {
    const args = argument.split(' ');

    const path = args[0] ?? '';
    const node = this.fileSystem.getNode(path);

    if (!node.ok) { return Err(Error("File not found")); }

    const value = node.value;

    // TODO: Open folder in folder exporer
    // TODO: Open text file in text file viewer
    switch (value.kind) {
      case 'application': return this.openApplication(value, path);
      default: return Err(Error("Not yet implemented"))
    }
  }

  quit(processId: number): void {
    const instance = this.processes[processId];

    if (instance === null) { return; }

    instance.application.on(createCloseEvent(), instance.context);
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
