import { Chain, Node } from "../../data/Chain";
import { DestroyWindowEvent, UpdateWindowsEvent, CreateWindowEvent, WindowEvent, WindowEventHandler, UpdateWindowEvent } from "./WindowEvents";
import { Application, ApplicationManager } from "@/applications/ApplicationManager";
import { createAllWindowsClosedEvent, createWindowCloseEvent, createWindowOpenEvent } from "@/applications/ApplicationEvents";

export type WindowProps = { application: Application, args: string, windowContext: WindowContext };
export type WindowApplication = React.ComponentType<WindowProps>;
export type WindowApplicationGenerator = () => WindowApplication;

const DefaultWindowWidth = 400;
const DefaultWindowHeight = 80;

const WindowCollisionMoveDistance = 10;

export interface WindowContext {
  readonly id: number
}

export interface WindowConfig {
  x: number,
  y: number,
  height?: number,
  width?: number,
  title: string,
  args: string
  readonly application: Application,
  readonly generator: WindowApplicationGenerator
}

export class Window {
  public order: number = 0;
  public focused: boolean = true;
  public minimized: boolean = false;

  public minimalWidth: number = 200;
  public minimalHeight: number = 70;

  constructor(
    public readonly id: number,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public title: string,
    public args: string,
    public readonly application: Application,
    public readonly generator: WindowApplicationGenerator
  ) { }
}

export class OrderedWindow {
  constructor(
    private window: Window,
    private order: number
  ) {}

  getWindow(): Window {
    return this.window;
  }

  getOrder(): number {
    return this.order;
  }
}

export class WindowCompositor {
  private windowId = 0;
  private windows: Chain<Window> = new Chain();

  private windowNodeLookup: Record<number, Node<Window>> = {};
  private observers: (WindowEventHandler)[] = [];

  private applicationManager: ApplicationManager | null = null;

  private viewWidth: number = 0;
  private viewHeight: number = 0;

  public registerApplicationManager(applicationManager: ApplicationManager) {
    this.applicationManager = applicationManager;
  }

  private updateApplicationManager(node: Node<Window>) {
    const app = node.value.application;
    this.applicationManager?.focus(app);
  }

  public subscribe(handler: WindowEventHandler) {
    this.observers.push(handler);
    return () => { this.unsubscribe(handler); };
  }

  public unsubscribe(handler: WindowEventHandler) {
    for (const [index, observerCallback] of this.observers.entries()) {
      if (handler === observerCallback) {
        this.observers.splice(index);
        return;
      }
    }
  }

  private publish(evt: WindowEvent): void {
    for (const eventHandler of this.observers) {
      eventHandler(evt);
    }
  }

  public getById(windowId: number): Window | null {
    return this.windowNodeLookup[windowId]?.value;
  }

  public setSize(width: number, height: number) {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  public open(config: WindowConfig): Window {
    function getWindowsOfTheSameApplication(chain: Chain<Window>, config: WindowConfig) {
      let results: Window[] = [];

      const applicationConfig = config.application.config();

      for (const windowNode of chain.iterFromTail()) {
        const config = windowNode.value.application.config();

        if (applicationConfig.appName === config.appName) {
          results.push(windowNode.value);
        }
      }

      return results;
    }

    let [x, y] = [config.x, config.y];

    const width = config.width ?? DefaultWindowWidth;
    const height = config.height ?? DefaultWindowHeight;

    const windows = getWindowsOfTheSameApplication(this.windows, config);

    let collision = false;

    do {
      collision = false;

      const collidedWindow = windows.find(entry => entry.x === x && entry.y === y);

      if (collidedWindow) {
        const widthFitsInView   = x + width + WindowCollisionMoveDistance <= this.viewWidth;
        const heightFitsInView  = y + height + WindowCollisionMoveDistance <= this.viewHeight;

        x = widthFitsInView   ? x + WindowCollisionMoveDistance : 0;
        y = heightFitsInView  ? y + WindowCollisionMoveDistance : 0;

        collision = true;
      }

    } while (collision);


    const id = this.windowId++;
    const window = new Window(
      id,
      x, y,
      config.width ?? DefaultWindowWidth,
      config.height ?? DefaultWindowHeight,
      config.title,
      config.args,
      config.application,
      config.generator
    );

    const node = this.windows.append(window);
    this.updateApplicationManager(node);

    this.windowNodeLookup[id] = node;

    this.updateWindowOrder();

    window.application.on(createWindowOpenEvent(id), { id });

    this.publish(CreateWindowEvent(window.id))

    return window;
  }

  public focus(windowId: number, force: boolean = false) {
    const node = this.windowNodeLookup[windowId];

    if (!node) {
      console.error('Node not found');
      return;
    }

    // The window is already on top, so don't update the stack
    if (!force && node === this.windows.getHead()) { return; }
    this.updateApplicationManager(node);

    this.windows.moveToHead(node);
    this.updateWindowOrder();

    this.publish(UpdateWindowsEvent());
  }

  public update(window: Window) {
    const node = this.windowNodeLookup[window.id];

    if (!node) { return; }
    node.value = window;

    this.publish(UpdateWindowEvent(window.id));
  }

  public close(windowId: number): void {
    const node = this.windowNodeLookup[windowId];
    if (!node) { return; }

    const window = node.value;

    this.publish(DestroyWindowEvent(windowId));
    window.application.on(createWindowCloseEvent(windowId), { id: windowId });

    this.windows.unlink(node);
    delete this.windowNodeLookup[windowId];

    const prev = this.findPreviousNodeOfSameApplication(window.application);

    if (prev) {
      // Force update the windows, if no force is used it might be the case that the DOM isn't updated
      // Due to the node already being the top level node.
      this.focus(prev.value.id, true);

    } else {
      // All the previous windows got closed of this app
      window.application.on(createAllWindowsClosedEvent());
      this.updateWindowOrder();
    }
  }

  public listMinimizedWindows(): Window[] {
    let windows: Window[] = [];

    for (const windowNode of this.windows.iterFromTail()) {
      const window = windowNode.value;

      if (window.minimized) { windows.push(window); }
    }

    return windows;
  }

  private findPreviousNodeOfSameApplication(application: Application): Node<Window> | null {
    let node = this.windows.getHead();

    while (node !== null) {
      if (node.value.application === application) {
        return node;
      }

      node = node.prev;
    }

    return null;
  }

  private updateWindowOrder(): void {
    if (!this.applicationManager) { return; }

    let node = this.windows.getTail();
    let order = 0;

    if (node === null) {
      const applications = this.applicationManager.listApplications();
      const finder = applications.find(x => x.config().appName === 'Finder.app');

      if (finder) { this.applicationManager.focus(finder); }

      return;
    }

    while (node !== null) {
      node.value.order = order++;
      node.value.focused = false;

      if (node.next === null) {
        node.value.focused = true;
        this.updateApplicationManager(node);
      }

      node = node.next;
    }
  }

  public reset(): void {
    // TODO: Destroy previous windows

    this.windowId = 0;
    this.windows = new Chain();

    this.windowNodeLookup = {};
    this.observers = [];
  }
}
