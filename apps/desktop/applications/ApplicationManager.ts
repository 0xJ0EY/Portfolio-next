import { FileSystem, FileSystemApplication } from "@/components/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "@/components/util";
import { LocalApplicationManager } from "./LocalApplicationManager";
import { ApplicationEvent, createApplicationOpenEvent, createApplicationQuitEvent } from "./ApplicationEvents";

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
    protected readonly manager: LocalApplicationManager
  ) {}

  abstract displayName(): string;
  abstract on(event: ApplicationEvent, windowContext?: WindowContext): void;
}

type ApplicationInstance = {
  application: Application,
  context: ApplicationContext
}

export interface BaseApplicationManager {
  open(argument: string): Result<number, Error>;
  quit(processId: number): void;
}

export class ApplicationManager implements BaseApplicationManager {

  private processId: number = 0;
  private processes: (ApplicationInstance | null)[] = [];

  constructor(
    private windowCompositor: WindowCompositor,
    private fileSystem: FileSystem
  ) {
    windowCompositor.registerApplicationManager(this);
  }

  public focus(application: Application) {
    console.log(application.displayName());
  }

  private openApplication(application: FileSystemApplication, path: string): Result<number, Error> {
    const compositor = new LocalWindowCompositor(this.windowCompositor);
    const manager = new LocalApplicationManager(this.processId, this);

    const isFirstProcess = !this.processes.find(x => x?.context.path === path);

    const instance = {
      application: application.entrypoint(compositor, manager),
      context: new ApplicationContext(path, compositor),
    };

    this.processes.push(instance);

    instance.application.on(createApplicationOpenEvent(isFirstProcess));

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

    instance.application.on(createApplicationQuitEvent());
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
