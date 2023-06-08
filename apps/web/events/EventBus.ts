export type EventHandler<T> = (payload: T) => void;
export type UnsubscribeHandler = () => void;

export class EventBus<T> {
  private handlers: EventHandler<T>[] = [];

  subscribe(handler: EventHandler<T>): UnsubscribeHandler {
    this.handlers.push(handler);

    return () => {
      this.unsubscribe(handler);
    };
  }

  unsubscribe(handler: EventHandler<T>): void {
    // Not too efficient, but fast to write :ˆ)
    this.handlers = this.handlers.filter((x) => x !== handler);
  }

  emit(value: T): void {
    for (const handler of this.handlers) {
      handler(value);
    }
  }

  once(handler: EventHandler<T>): void {
    const handleOnce = (payload: T) => {
      handler(payload);
      this.unsubscribe(handleOnce);
    }

    this.subscribe(handleOnce);
  }
}

