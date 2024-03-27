export class Node<T> {
  public next: Node<T> | null = null;
  public prev: Node<T> | null = null;

  constructor(public value: T) {}
}

export class ChainIterator<T> implements Iterable<Node<T>> {
  private originalNode: Node<T> | null;
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

    this.originalNode = this.node;
  }

  private getNextIterator(node: Node<T>, direction: 'fromTail' | 'fromHead'): Node<T> | null {
    switch (this.direction) {
      case "fromTail": return node.next;
      case "fromHead": return node.prev;
    }
  }

  [Symbol.iterator](): Iterator<Node<T>, any, undefined> {
    let value: Node<T>;
    this.node = this.originalNode;

    return {
      next: () => {
        // NOTE(Joey): Not sure, why value is required here, as it is not used in the for ... of loop
        if (!this.node) { return {done: true, value: value!}}

        value = this.node;

        this.node = this.getNextIterator(this.node, this.direction);

        return { done: false, value };
      }
    }
  }

  public find(predicate: (value: T) => boolean): T | null {
    let node: Node<T> | null = this.node;

    while (node) {
      if (predicate(node.value)) { return node.value; }

      node = this.getNextIterator(node, this.direction);
    }

    return null;
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

  public insert(parent: Node<T>, element: T) {
    const next = parent.next;
    const node = new Node(element);

    // If we have a next, set the new node as the previous item
    // And the next node as the node's next item
    if (next) {
      next.prev = node;
      node.next = next;
    }

    // Set normal parent relations
    node.prev = parent;
    parent.next = node;

    this.items++;

    return node;
  }

  // Cut off all the child/next nodes after this node
  public cutOff(parent: Node<T>) {
    // Fix the item count in the chain
    let node = parent.next;

    while (node !== null) {
      this.items--;
      node = node.next;
    }

    // GC should handle the deletion of the nodes, or we created a memory leak somewhere :^)
    parent.next = null;

    // Set the head to the last element in the list
    this.head = parent;
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
