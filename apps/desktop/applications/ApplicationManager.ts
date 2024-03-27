import { ApplicationIcon, FileSystem, FileSystemApplication, FileSystemDirectory, FileSystemNode } from "@/apis/FileSystem/FileSystem";
import { LocalWindowCompositor } from "@/components/WindowManagement/LocalWindowCompositor";
import { WindowCompositor, WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Err, Ok, Result } from "result";
import { LocalApplicationManager } from "./LocalApplicationManager";
import { ApplicationEvent, ApplicationWindowEvent, createApplicationOpenEvent, createApplicationQuitEvent } from "./ApplicationEvents";
import { SystemAPIs } from "@/components/OperatingSystem";
import { Action } from "@/components/util";
import { parseCommand } from "@/apis/FileSystem/CommandEncoding";
import { constructPath } from "@/apis/FileSystem/util";

// ApplicationContext should hold meta data/instances that is important to the application manager, but not to anyone else.
class ApplicationContext {
  constructor(
    public readonly path: string,
    public readonly compositor: LocalWindowCompositor
  ) {}
}

export interface ApplicationConfig {
  readonly displayName: string,
  readonly dockPriority: number | null,
  readonly path: string,
  readonly appName: string,
  readonly appIcon: ApplicationIcon,
  readonly entrypoint: (
    compositor: LocalWindowCompositor,
    manager: LocalApplicationManager,
    apis: SystemAPIs
  ) => Application
}


export type MenuItemAction = {
  kind: 'action',
  value: string,
  action: () => void
}

export type MenuItemSpacer = {
  kind: 'spacer'
}

export type MenuItem = MenuItemSpacer | MenuItemAction;

export interface MenuDisplayOptions {
  boldText?: boolean
};

export interface MenuEntry {
  readonly displayOptions: MenuDisplayOptions,
  readonly name: string
  readonly items: MenuItem[]
}

type ApplicationWindowListener = (event: ApplicationWindowEvent) => void;

export abstract class Application {
  constructor(
    public readonly compositor: LocalWindowCompositor,
    public readonly manager: LocalApplicationManager,
    public readonly apis: SystemAPIs
  ) {}

  private windowListeners: Record<number, ApplicationWindowListener[]> = {};

  abstract config(): ApplicationConfig;
  abstract menuEntries(): MenuEntry[];

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


export type ApplicationManagerFocusEvent = {
  kind: 'focus',
  application: Application
}

export type ApplicationManagerUpdateEvent = {
  kind: 'update'
}

export type ApplicationManagerEvent = ApplicationManagerFocusEvent | ApplicationManagerUpdateEvent;

export type ApplicationManagerListener = (event: ApplicationManagerEvent) => void;

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

  private publishChanges(event: ApplicationManagerEvent): void {
    for (const observer of this.observers) {
      observer(event);
    }
  }

  public focus(application: Application) {
    console.log(`Application focussed: ${application.config().displayName}`);

    this.publishChanges({ kind: 'focus', application });
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

      this.publishChanges({ kind: 'update'});

      return Ok(this.processId++);
    }
  }

  private openDirectory(path: string): Result<number, Error> {
    return this.open(`/Applications/Finder.app ${path}`);
  }

  private openTextFile(path: string): Result<number, Error> {
    return this.open(`/Applications/Notes.app ${path}`);
  }

  private openImage(path: string): Result<number, Error> {
    return this.open(`/Applications/Image.app ${path}`);
  }

  private openFileSystemNode(node: FileSystemNode, path: string, args: string): Result<number, Error> {
    switch (node.kind) {
      case 'application': return this.openApplication(node, path, args);
      case 'directory': return this.openDirectory(path);
      case 'textfile': return this.openTextFile(path);
      case 'image': return this.openImage(path);
      case 'hyperlink': {

        // Hyperlink content is only editable by me, so we don't have to be very rigorous with the safety checks
        const target      = node.target;
        const targetPath  = constructPath(target);

        return this.openFileSystemNode(target, targetPath, args);
      };
      default: return Err(Error("Not yet implemented"))
    }
  }

  open(argument: string): Result<number, Error> {
    const parts = parseCommand(argument);

    const path = parts.splice(0, 1)[0] ?? '';
    const args = parts.join(' ') ?? '';

    const node = this.fileSystem.getNode(path);

    if (!node.ok) { return Err(Error("File not found")); }

    const value = node.value;

    return this.openFileSystemNode(value, path, args);
  }

  kill(processId: number): void {
    const instance = this.processes[processId];

    if (instance === null) { return; }

    instance.application.on(createApplicationQuitEvent());
    instance.context.compositor.closeAll();

    this.processes[processId] = null;

    this.publishChanges({ kind: 'update' });
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
