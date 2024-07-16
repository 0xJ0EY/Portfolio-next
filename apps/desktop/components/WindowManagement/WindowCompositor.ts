import { Chain, Node } from "../../data/Chain";
import { DestroyWindowEvent, UpdateWindowsEvent, CreateWindowEvent, WindowEvent, WindowEventHandler, UpdateWindowEvent, MinimizeWindowEvent, MaximizeWindowEvent, FocusWindowEvent } from "./WindowEvents";
import { Application, ApplicationManager } from "@/applications/ApplicationManager";
import { createAllWindowsClosedEvent, createWindowCloseEvent, createWindowOpenEvent } from "@/applications/ApplicationEvents";
import { Action } from "../util";

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

export type WindowActionPrompt = {
  action: 'prompt',
  prompt: string,
  defaultValue?: string,
  resolve: (value: string) => void,
  reject: (reason: string) => void
};

export type WindowActionAlert = {
  action: 'alert',
  alert: string,
  resolve: () => void,
  reject: (reason: string) => void
};

export type WindowAction = WindowActionPrompt | WindowActionAlert;

export class Window {
  public order: number = 0;
  public focused: boolean = true;
  public minimized: boolean = false;

  public minimalWidth: number = 240;
  public minimalHeight: number = 180;

  public action: WindowAction | null = null;

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
  ) { }

  getWindow(): Window {
    return this.window;
  }

  getOrder(): number {
    return this.order;
  }
}

export type FilterPredicate = (evt: WindowEvent) => boolean;

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

  public subscribe(handler: WindowEventHandler): Action<void> {
    this.observers.push(handler);
    return () => { this.unsubscribe(handler); };
  }

  public subscribeWithFilter(predicate: FilterPredicate, handler: WindowEventHandler): Action<void> {
    function wrapper(evt: WindowEvent) {
      if (predicate(evt)) { handler(evt); }
    }

    this.observers.push(wrapper);

    return () => { this.unsubscribe(wrapper)}
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
        const widthFitsInView = x + width + WindowCollisionMoveDistance <= this.viewWidth;
        const heightFitsInView = y + height + WindowCollisionMoveDistance <= this.viewHeight;

        x = widthFitsInView ? x + WindowCollisionMoveDistance : 0;
        y = heightFitsInView ? y + WindowCollisionMoveDistance : 0;

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

    this.publish(FocusWindowEvent(windowId));
    this.publish(UpdateWindowsEvent());
  }

  public update(window: Window, updateOptions?: { moved?: boolean, resized?: boolean }) {
    const node = this.windowNodeLookup[window.id];

    if (!node) { return; }
    node.value = window;

    const moved = updateOptions?.moved ?? false;
    const resized = updateOptions?.resized ?? false;

    this.publish(UpdateWindowEvent(window.id, moved, resized));
  }

  public close(windowId: number): void {
    const node = this.windowNodeLookup[windowId];
    if (!node) { return; }

    const window = node.value;

    if (window.action) {
      window.action.reject('Window has been closed by user');
    }

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

  public async alert(windowId: number, alert: string) {
    const node = this.windowNodeLookup[windowId];
    if (!node) { throw new Error("Window node not found"); }

    const window = node.value;

    const cleanup = () => {
      window.action = null;
      this.update(window);
    }

    return new Promise<void>((
      resolve: () => void,
      reject: (reason: string) => void
    ) => {
      window.action = {
        action: 'alert',
        alert,
        resolve, reject
      }

      this.update(window);
    }).then(() => {
      cleanup();
      return;
    }).catch((reason) => {
      cleanup();
      throw reason;
    });
  }

  public async prompt(windowId: number, prompt: string, defaultValue?: string): Promise<string> {
    const node = this.windowNodeLookup[windowId];
    if (!node) { throw new Error("Window node not found"); }

    const window = node.value;

    const cleanup = () => {
      window.action = null;
      this.update(window);
    }

    return new Promise((
      resolve: (value: string) => void,
      reject: (reason: string) => void
    ) => {
      window.action = {
        action: 'prompt',
        prompt,
        defaultValue,
        resolve, reject
      }

      this.update(window);
    }).then((value) => {
      cleanup();
      return value;
    }).catch((reason) => {
      cleanup();
      throw reason;
    });
  }

  public minimize(windowId: number): void {
    const node = this.windowNodeLookup[windowId];
    if (!node) { return; }

    const window = node.value;
    window.minimized = true;

    this.update(window);

    const instances = this.listPreviousNodesOfSameApplication(window.application);
    let nonMinimizedWindow = instances.find(x => x.value.minimized === false);

    if (nonMinimizedWindow) {
      // Force update the windows, if no force is used it might be the case that the DOM isn't updated
      // Due to the node already being the top level node.
      this.focus(nonMinimizedWindow.value.id, true);
    } else {
      this.updateWindowOrder();
    }

    this.publish(MinimizeWindowEvent(window.id));
  }

  public maximize(windowId: number): void {
    const node = this.windowNodeLookup[windowId];
    if (!node) { return; }

    const window = node.value;
    window.minimized = false;

    this.update(window, { moved: true, resized: true });
    this.focus(window.id, true);

    this.publish(MaximizeWindowEvent(window.id));
  }

  public listMinimizedWindows(): Window[] {
    let windows: Window[] = [];

    for (const windowNode of this.windows.iterFromTail()) {
      const window = windowNode.value;

      if (window.minimized) { windows.push(window); }
    }

    return windows;
  }

  private listPreviousNodesOfSameApplication(application: Application): Node<Window>[] {
    let node = this.windows.getHead();
    let results: Node<Window>[] = [];

    while (node !== null) {
      if (node.value.application === application) {
        results.push(node);
      }

      node = node.prev;
    }

    return results;
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
    function focusLastVisibleNode(lastNode: Node<Window>, applicationManager: ApplicationManager): void {
      let node: Node<Window> | null = lastNode;

      while (node) {
        const isMinimized = node.value.minimized === true;
        const isVisible = !isMinimized;

        if (isVisible) {
          node.value.focused = true;

          applicationManager.focus(node.value.application);
          return;
        }

        node = node.prev;
      }
    }

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
        focusLastVisibleNode(node, this.applicationManager);
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
