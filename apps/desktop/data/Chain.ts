export class Node<T> {
  public next: Node<T> | null = null;
  public prev: Node<T> | null = null;

  constructor(public value: T) {}
}

export class ChainIterator<T> implements Iterable<Node<T>> {
  private node: Node<T> | null;

  constructor(chain: Chain<T>, private direction: 'fromTail' | 'fromHead') {
    switch (this.direction) {
      case "fromTail":
        this.node = chain.getTail();
        break;
      case "fromHead":
        this.node = chain.getHead();
        break;
    }
  }

  [Symbol.iterator](): Iterator<Node<T>, any, undefined> {
    let value: Node<T>;

    return {
      next: () => {
        // NOTE(Joey): Not sure, why value is required here, as it is not used in the for ... of loop
        if (!this.node) { return {done: true, value: value!}}

        value = this.node;

        switch (this.direction) {
          case "fromTail":
            this.node = this.node.next;
            break;
          case "fromHead":
            this.node = this.node.prev;
            break;
        }

        return { done: false, value };
      }
    }
  }
}

export class Chain<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private items = 0;

  public append(element: T): Node<T> {
    return this.appendNode(new Node(element));
  }

  public appendNode(node: Node<T>): Node<T> {
    const prev = this.getHead();

    node.prev = prev;
    if (prev !== null) { prev.next = node; }

    this.head = node;
    if (this.tail === null) { this.tail = node; }

    this.items++;

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

    this.items++;

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

    this.items--;
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

  public count(): number {
    return this.items;
  }

  public toArray(): T[] {
    let items: T[] = [];
    let node = this.getTail();

    while (node !== null) {
      items.push(node.value);

      node = node.next;
    }

    return items;
  }

  public iterFromTail(): ChainIterator<T> {
    return new ChainIterator(this, 'fromTail');
  }

  public iterFromHead(): ChainIterator<T> {
    return new ChainIterator(this, 'fromHead');
  }
}
