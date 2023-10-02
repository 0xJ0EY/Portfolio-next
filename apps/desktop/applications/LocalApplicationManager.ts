import { Result } from "result";
import { ApplicationManager, BaseApplicationManager } from "./ApplicationManager";

export class LocalApplicationManager implements BaseApplicationManager {
  constructor(private processId: number, private manager: ApplicationManager) {}

  open(argument: string): Result<number, Error> {
    return this.manager.open(argument);
  }

  // There is no concept of ring level security in this operating system :^)
  kill(processId: number): void {
    return this.manager.kill(processId);
  }

  quit(): void {
    return this.kill(this.processId);
  }
}
