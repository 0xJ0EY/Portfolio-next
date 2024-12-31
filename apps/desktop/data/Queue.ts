export class Queue<T> {
  private storage: T[] = [];

  public enqueue(value: T): void {
    this.storage.push(value);
  }

  public dequeue(): T | null {
    if (this.size() === 0) { return null; }

    return this.storage.shift()!;
  }

  public peek(): T {
    return this.storage[this.storage.length - 1];
  }

  public size(): number {
    return this.storage.length;
  }
}
