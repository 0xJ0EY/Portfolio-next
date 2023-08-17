import { FileSystem, FileSystemApplication } from "@/apis/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "@/components/util";
import { LocalApplicationManager } from "./LocalApplicationManager";
import { ApplicationEvent, ApplicationWindowEvent, createApplicationOpenEvent, createApplicationQuitEvent } from "./ApplicationEvents";
import { SystemAPIs } from "@/components/OperatingSystem";
import { Action } from "@/components/util";

// ApplicationContext should hold meta data/instances that is important to the application manager, but not to anyone else.
class ApplicationContext {
  constructor(
    public readonly path: string,
    public readonly compositor: LocalWindowCompositor
  ) {}
}

export interface ApplicationConfig {
  readonly displayName: string,
  readonly path: string,
  readonly appName: string,
  readonly entrypoint: (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => Application
}

type ApplicationWindowListener = (event: ApplicationWindowEvent) => void;

export abstract class Application {
  constructor(
    protected readonly compositor: LocalWindowCompositor,
    protected readonly manager: LocalApplicationManager,
    public readonly apis: SystemAPIs
  ) {}

  private windowListeners: Record<number, ApplicationWindowListener[]> = {};

  abstract config(): ApplicationConfig;

  protected baseHandler(event: ApplicationEvent, windowContext?: WindowContext): void {
    if (event.kind === 'all-windows-closed') {
      this.manager.quit();
      return;
    }

    if (event.kind === 'application-kill') {
      this.manager.quit();
      return;
    }
  }

  subscribeToWindowEvents(windowId: number, listener: ApplicationWindowListener): Action<void> {
    if (!this.windowListeners[windowId]) {
      this.windowListeners[windowId] = [];
    }

    this.windowListeners[windowId].push(listener);

    return () => { this.unsubscribeFromWindowEvents(windowId, listener); };
  }

  unsubscribeFromWindowEvents(windowId: number, listener: ApplicationWindowListener) {
    for (const [index, entry] of this.windowListeners[windowId].entries()) {
      if (entry === listener) {
        this.windowListeners[windowId].splice(index);
        return;
      }
    }
  }

  sendEventToView(windowId: number, event: ApplicationWindowEvent) {
    const listeners = this.windowListeners[windowId];
    if (!listeners) { return; }

    for (const listener of listeners) { listener(event); }
  }

  sendEventToAllViews(event: ApplicationWindowEvent) {
    for (const listeners of Object.values(this.windowListeners)) {
      for (const listener of listeners) { listener(event); }
    }
  }

  abstract on(event: ApplicationEvent, windowContext?: WindowContext): void;
}

type ApplicationInstance = {
  application: Application,
  context: ApplicationContext,
  processId: number,
}

export interface BaseApplicationManager {
  open(argument: string): Result<number, Error>;
  kill(processId: number): void;
}

export type ApplicationManagerListener = () => void;

export class ApplicationManager implements BaseApplicationManager {

  private processId: number = 0;
  private processes: (ApplicationInstance | null)[] = [];

  private observers: (ApplicationManagerListener)[] = [];

  constructor(
    private windowCompositor: WindowCompositor,
    private fileSystem: FileSystem,
    private apis: SystemAPIs
  ) {
    windowCompositor.registerApplicationManager(this);
  }

  public subscribe(listener: ApplicationManagerListener) {
    this.observers.push(listener);
    return () => { this.unsubscribe(listener); }
  }

  public unsubscribe(listener: ApplicationManagerListener) {
    for (const [index, observer] of this.observers.entries()) {
      if (observer === listener) {
        this.observers.splice(index);
        return;
      }
    }
  }

  private publishChanges(): void {
    for (const observer of this.observers) {
      observer();
    }
  }

  public focus(application: Application) {
    console.log(`Application focussed: ${application.config().displayName}`);
  }

  public listApplications(): Application[] {
    return this.processes
      .filter(x => x !== null)
      .map(x => x!.application);
  }

  private openApplication(application: FileSystemApplication, path: string, args: string): Result<number, Error> {
    const compositor = new LocalWindowCompositor(this.windowCompositor);
    const manager = new LocalApplicationManager(this.processId, this);

    const parent = this.processes.find(x => x?.context.path === path);

    if (parent) {
      parent.application.on(createApplicationOpenEvent(false, args));

      return Ok(parent.processId);
    } else {
      const instance = {
        application: application.entrypoint(compositor, manager, this.apis),
        context: new ApplicationContext(path, compositor),
        processId: this.processId
      };

      this.processes.push(instance);

      instance.application.on(createApplicationOpenEvent(true, args));

      this.publishChanges();

      return Ok(this.processId++);
    }
  }

  open(argument: string): Result<number, Error> {
    const parts = argument.split(' ');

    const path = parts.splice(0, 1)[0] ?? '';
    const args = parts.join(' ') ?? '';

    const node = this.fileSystem.getNode(path);

    if (!node.ok) { return Err(Error("File not found")); }

    const value = node.value;

    // TODO: Open folder in folder exporer
    // TODO: Open text file in text file viewer
    switch (value.kind) {
      case 'application': return this.openApplication(value, path, args);
      default: return Err(Error("Not yet implemented"))
    }
  }

  kill(processId: number): void {
    const instance = this.processes[processId];

    if (instance === null) { return; }

    instance.application.on(createApplicationQuitEvent());
    instance.context.compositor.closeAll();

    this.processes[processId] = null;

    this.publishChanges();
  }

  reset(): void {
    for (let i = 0; i < this.processId; i++) {
      this.kill(i);
    }

    this.processId = 0;
    this.processes = [];

    this.observers = [];
  }
}
