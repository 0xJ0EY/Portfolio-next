import { WindowCompositor, WindowConfig, Window } from "./WindowCompositor";

export class LocalWindowCompositor {

  private instances: Record<number, Window> = {};

  constructor(private compositor: WindowCompositor) {}

  public focus(windowId: number) {
    this.compositor.focus(windowId);
  }

  public open(config: WindowConfig): Window {
    const window = this.compositor.open(config);

    this.instances[window.id] = window;

    return window;
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

  public closeAll(): void {
    for (const windowId in this.instances) {
      // id's are cast to strings due to them being used as keys, so we need to cast them back to numbers here
      this.close(+windowId);
    }
  }
}
