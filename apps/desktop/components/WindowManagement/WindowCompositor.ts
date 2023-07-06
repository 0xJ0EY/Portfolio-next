import { Chain, Node } from "./Chain";
import { LazyExoticComponent } from "react"
import { DestroyWindowEvent, UpdateWindowsEvent, CreateWindowEvent, WindowEvent, WindowEventHandler, UpdateWindowEvent } from "./WindowEvents";

export type WindowApplication = LazyExoticComponent<() => JSX.Element>;
export type WindowApplicationGenerator = () => WindowApplication;

export interface WindowConfig {
  x: number,
  y: number,
  height?: number,
  width?: number,
  title: string,
  generator: WindowApplicationGenerator
}

export class Window {
  public order: number = 0;
  public focused: boolean = true;
  public resizingCursor: string = 'auto'

  constructor(
    public readonly id: number,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public title: string,
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
    return this.windowNodeLookup[windowId].value;
  }

  public open(config: WindowConfig): Window {
    const id = this.windowId++;
    const window = new Window(
      id,
      config.x,
      config.y,
      config.width ?? 400,
      config.height ?? 80,
      config.title,
      config.generator
    );

    const node = this.windows.append(window);
    this.windowNodeLookup[id] = node;

    this.updateWindowOrder();

    this.publish(CreateWindowEvent(window.id))

    return window;
  }

  public focus(windowId: number) {
    const node = this.windowNodeLookup[windowId];

    if (!node) {
      console.error('Node not found');
      return;
    }

    // The window is already on top, so don't update the stack
    if (node === this.windows.getHead()) { return; }

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
    if (node === null) { return; }

    this.publish(DestroyWindowEvent(windowId));

    const prev = node.prev;

    this.windows.unlink(node);
    delete this.windowNodeLookup[windowId];

    if (prev !== null) {
      // TODO: Make this work on application level, like macOS
      // Currently we just unwrap the chain, no matter what "application" is selected
      this.updateWindowOrder();
      this.publish(UpdateWindowsEvent());
     }
  }

  private updateWindowOrder(): void {
    let node = this.windows.getTail();
    let order = 0;

    while (node !== null) {
      node.value.order    = order++;
      node.value.focused = node.next === null;

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
