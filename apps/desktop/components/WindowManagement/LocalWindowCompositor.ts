import { Action } from "../util";
import { WindowCompositor, WindowConfig, Window, FilterPredicate } from "./WindowCompositor";
import { WindowEvent, WindowEventHandler, toSingleWindowEvent } from "./WindowEvents";

export class LocalWindowCompositor {

  private instances: Record<number, Window> = {};

  constructor(private compositor: WindowCompositor) { }

  public focus(windowId: number) {
    this.compositor.focus(windowId);
  }

  public open(config: WindowConfig): Window {
    const window = this.compositor.open(config);

    this.instances[window.id] = window;

    return window;
  }

  public subscribe(windowId: number, handler: WindowEventHandler): Action<void> {
    function filterOnWindowId(evt: WindowEvent): boolean {
      const event = toSingleWindowEvent(evt);

      if (!event) { return false; }

      return event.windowId == windowId;
    }

    return this.compositor.subscribeWithFilter(filterOnWindowId, handler)
  }

  public subscribeWithFilter(windowId: number, predicate: FilterPredicate, handler: WindowEventHandler): Action<void> {
    function filterOnWindowIdAndPredicate(evt: WindowEvent): boolean {
      const event = toSingleWindowEvent(evt);

      if (!event) { return false; }
      if (event.windowId !== windowId) { return false; }

      return predicate(evt);
    }

    return this.compositor.subscribeWithFilter(filterOnWindowIdAndPredicate, handler);
  }

  public getById(windowId: number): Window | null {
    return this.instances[windowId] ?? null;
  }

  public update(window: Window): void {
    if (!(window.id in this.instances)) { return; }

    this.compositor.update(window);
  }

  public close(windowId: number): void {
    if (!(windowId in this.instances)) { return; }

    this.compositor.close(windowId);

    delete this.instances[windowId];
  }

  public async alert(windowId: number, alert: string): Promise<void> {
    return await this.compositor.alert(windowId, alert);
  }

  public async prompt(windowId: number, prompt: string, defaultValue?: string): Promise<string> {
    return await this.compositor.prompt(windowId, prompt, defaultValue);
  }

  public closeAll(): void {
    for (const windowId in this.instances) {
      // id's are cast to strings due to them being used as keys, so we need to cast them back to numbers here
      this.close(+windowId);
    }
  }
}
