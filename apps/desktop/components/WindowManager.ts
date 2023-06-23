import { WindowContainer } from "./WindowContainer";

export interface WindowConfig {
  x: number,
  y: number,
  height?: number,
  width?: number,
  title: string,
  content: JSX.Element
}

class Node<T> {
  public next: Node<T> | null = null;
  public prev: Node<T> | null = null;

  constructor(public value: T) {}
}

class Chain<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;

  public append(element: T): Node<T> {
    return this.appendNode(new Node(element));
  }

  public appendNode(node: Node<T>): Node<T> {
    const prev = this.getHead();

    node.prev = prev;
    if (prev !== null) { prev.next = node; }

    this.head = node;
    if (this.tail === null) { this.tail = node; }

    return node;
  }

  public prepend(element: T): Node<T> {
    return this.prependNode(new Node(element));
  }

  public prependNode(node: Node<T>): Node<T> {
    const next = this.getTail();

    node.next = next;
    if (next !== null) { next.prev = node; }

    this.tail = node;
    if (this.head === null) { this.head = node; }

    return node;
  }

  public unlink(node: Node<T>): void {
    // Repair the chain
    if (node.prev && node.next) {
      // Link the prev node to the next node
      node.prev.next = node.next;
      node.next.prev = node.prev;

    } else if (node.prev) {
      // Unlink this node from the prev node
      node.prev.next = null;
    } else if (node.next) {
      // Unlink this node form the next node
      node.next.prev = null;
    }

    // Repair the head and tail
    if (this.head == node) { this.head = node.prev; }
    if (this.tail == node) { this.tail = node.next; }

    // Remove local references
    node.next = null;
    node.prev = null;
  }

  public moveToHead(node: Node<T>): void {
    this.unlink(node);
    this.appendNode(node);
  }

  public moveToTail(node: Node<T>): void {
    this.unlink(node);
    this.prependNode(node);
  }

  public getHead(): Node<T> | null {
    return this.head;
  }

  public getTail(): Node<T> | null {
    return this.tail;
  }
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

export class Window {

  constructor(
    public readonly id: number,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public title: string,
    public readonly content: JSX.Element
  ) { }
}

export class WindowManager {
  private windowId = 0;
  private windows: Chain<Window> = new Chain();

  private windowNodeLookup: Record<number, Node<Window>> = {};

  private observers: (() => void)[] = [];

  public subscribe(changeCallback: () => void) {
    this.observers.push(changeCallback);

    return () => {


    };
  }

  private updateObservers(): void {
    for (const observer of this.observers) {
      observer();
    }
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
      config.content
    );

    const node = this.windows.append(window);
    this.windowNodeLookup[id] = node;

    this.updateObservers();

    return window;
  }

  public focus(window: Window) {
    const node = this.windowNodeLookup[window.id];

    if (node === null) { return; }
    // The window is already on top, so don't update the stack
    if (node === this.windows.getHead()) { return; }

    this.windows.moveToHead(node);
    this.updateObservers();
  }

  public update(window: Window) {
    this.updateObservers();
  }

  public close(windowId: number): void {
    // TODO: Remove window from lookup table
    this.updateObservers();
  }

  public getOrderedWindows(): OrderedWindow[] {
    const results: OrderedWindow[] = [];

    let index = 0;
    let node = this.windows.getTail();

    while (node !== null) {
      results.push(new OrderedWindow(node.value, index++));
      node = node.next;
    }

    return results;
  }
}