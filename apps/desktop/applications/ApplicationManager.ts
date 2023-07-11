import { FileSystem, FileSystemApplication } from "@/components/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "@/components/util";

export type ApplicationOpenEvent = {
  kind: 'open',
  isFirst: boolean,
}

export type ApplicationCloseEvent = {
  kind: 'close',
}

function createOpenEvent(isFirst: boolean): ApplicationOpenEvent {
  return { kind: 'open', isFirst };
}

function createCloseEvent(): ApplicationCloseEvent {
  return { kind: 'close' };
}

export type ApplicationEvent = ApplicationOpenEvent | ApplicationCloseEvent;

// ApplicationContext should hold meta data/instances that is important to the application manager, but not to anyone else.
class ApplicationContext {
  constructor(
    public readonly path: string,
    public readonly compositor: LocalWindowCompositor
  ) {}
}

export abstract class Application {
  constructor(
    protected readonly compositor: LocalWindowCompositor,
  ) {}

  abstract displayName(): string;
  abstract on(event: ApplicationEvent, windowContext?: WindowContext): void;
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
      application: application.entrypoint(compositor),
      context: new ApplicationContext(path, compositor),
    };

    this.processes.push(instance);

    instance.application.on(createOpenEvent(isFirstProcess));

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

    instance.application.on(createCloseEvent());
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
