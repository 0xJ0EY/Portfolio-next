import { SystemAPIs } from "@/components/OperatingSystem";
import { BaseApplicationManager } from "../ApplicationManager";
import { TerminalConnector } from "./TerminalApplicationView";
import ansiColors from "ansi-colors";
import { parseCommand } from "@/apis/FileSystem/CommandEncoding";

export class Shell {
  private promptString = `${ansiColors.white("{hostname}")} ${ansiColors.magentaBright("::")} ${ansiColors.greenBright("{path}")} ${ansiColors.blueBright("%")} `;

  private hostname: string = "j-os";
  private path: string = '/Users/joey/'
  private relativePath: string = '~';

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

  public getRelativePath(): string {
    return this.relativePath;
  }

  public getPromptString(): string {
    return this.promptString
      .replace("{hostname}", this.hostname)
      .replace('{path}', this.getRelativePath());
  }

  private buildRelativePath(path: string): string {
    const TopItems = 3;

    const pathItems = path.split('/').filter(x => x.length > 0);
    if (pathItems.length === 0) { return "/" };

    const topItems = pathItems.slice(-TopItems);

    const isHomeDirectory = pathItems.length >= 2 && pathItems[0] === "Users" && pathItems[1] === "joey";
    const pathItemsDelta = pathItems.length - topItems.length;

    if (isHomeDirectory && pathItemsDelta <= 1) {
      const itemsToRemove = 2 - pathItemsDelta;

      for (let i = 0; i < itemsToRemove; i++) { topItems.shift(); }

      topItems.unshift("~");
    }

    if (isHomeDirectory) {
      if (topItems.length === 1) { return '~'; }

      return `${topItems.join('/')}/`;
    } else {
      return `/${topItems.join('/')}/`;
    }
  }

  public changeDirectory(path: string): void {
    this.path = path;
    this.relativePath = this.buildRelativePath(path);
  }

  public changeHostname(hostname: string): void {
    this.hostname = hostname;
  }

  public openNewProcess(path: string): void {
    this.applicationManager.open(path);
  }

  public process(command: string): void {
    const args = parseCommand(command);
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
          this.terminal.writeResponseLines([
            'jsh: ps requires a value to be set',
            'possible variables: {hostname}, {path}'
          ]);
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
