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

    console.log(this.instances);

    // for (const windows of this.instances) {
      // this.close()
    // }
  }
}
