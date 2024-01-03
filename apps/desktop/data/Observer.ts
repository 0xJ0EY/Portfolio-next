import { Action } from "@/components/util";

export type Observer<T> = (value: T) => void;

export class ObserverSubject<T> {
  private observers: (Observer<T>)[] = [];

  protected notify(value: T): void {
    for (const listener of this.observers) {
      listener(value);
    }
  }

  public subscribe(listener: Observer<T>): Action<void> {
    this.observers.push(listener);

    return () => { this.unsubscribe(listener); };
  }

  public unsubscribe(listener: Observer<T>): void {
    for (const [index, observer] of this.observers.entries()) {
      if (observer === listener) {
        this.observers.splice(index);
        return;
      }
    }
  }
}
