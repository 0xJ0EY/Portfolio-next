import { SystemAPIs } from "@/components/OperatingSystem";
import { BaseApplicationManager } from "../ApplicationManager";
import { TerminalConnector } from "./TerminalApplicationView";

function splitCommand(input: string): string[] {
  return input.split(' ').filter(x => x.length > 0);
}

export class Shell {
  private promptString = "{hostname} :: {path} % ";

  private hostname: string = "j-os";
  private path: string = '/Users/joey/'

  constructor(
    private terminal: TerminalConnector,
    private applicationManager: BaseApplicationManager,
    private apis: SystemAPIs
  ) {}

  public getTerminal(): TerminalConnector {
    return this.terminal;
  }

  public getPath(): string {
    return this.path;
  }

  public getPromptString(): string {
    return this.promptString
      .replace("{hostname}", this.hostname)
      .replace('{path}', this.path);
  }

  public changeDirectory(path: string): void {
    this.path = path;
  }

  public openNewProcess(path: string): void {
    this.applicationManager.open(path);
  }

  public process(command: string): void {
    const args = splitCommand(command);
    const applicationName = args[0]?.toLocaleLowerCase() ?? null;

    if (applicationName === null) { return; }

    switch (applicationName) {

      case 'clear': {
        this.terminal.clear();
        break;
      }
      case 'ps': {
        const title = args.slice(1).join(' ');

        if (title.length === 0) {
          this.terminal.writeResponse('jsh: ps requires a value to be set');
          this.promptString = '$ ';
        } else {
          this.promptString = title + ' ';
        }

        break;
      }
      default: {
        // Get a program from the /bin directory
        const binaryDirResult = this.apis.fileSystem.getDirectory('/bin');
        if (!binaryDirResult.ok) { return; }

        const binaryDir = binaryDirResult.value;

        for (const program of binaryDir.children.iterFromHead()) {
          const fileSystemNode = program.value.node;

          if (fileSystemNode.kind !== 'program') { continue; }
          if (fileSystemNode.name !== applicationName) { continue; }

          fileSystemNode.program(this, args, this.apis);

          return;
        }

        this.terminal.writeResponse(`jsh: command not found: ${applicationName}`);
        break;
      }
    }
  }
}
