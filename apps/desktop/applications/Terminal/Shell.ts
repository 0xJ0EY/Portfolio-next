import { SystemAPIs } from "@/components/OperatingSystem";
import { BaseApplicationManager } from "../ApplicationManager";
import { TerminalConnector } from "./TerminalApplicationView";
import ansiColors from "ansi-colors";
import { parseCommand } from "@/apis/FileSystem/CommandEncoding";
import { getAbsolutePathFromArgs, getFileNameParts } from "@/programs/Programs";
import { Err, Ok, Result } from "result";
import { FileSystem } from "@/apis/FileSystem/FileSystem";
import { isUniqueFile, pathLastEntry, pathPop } from "@/apis/FileSystem/util";
import { stripAnsi } from "./TerminalManager";

export const HomeDirectory = '/Users/joey/'

type CommandOutput = { type: 'stdout' } | { type: 'pipe' } | { type: 'output_redirection', filename: string };

type Command = {
  slice: string,
  output: CommandOutput
}

function parseRedirection(fullCommand: string): Command[] {
  let index = 0;
  let last = 0;

  function getFileName(slice: string): string {
    const words = slice.trim().split(' ');

    return words[0] ?? '';
  }

  function getNextSlice(): Command | null {
    // Output functions, set last to the current index and transform the result
    function stdout(slice: string): Command {
      last = index;
      return { slice, output: { type: 'stdout'} };
    }

    function pipe(slice: string): Command {
      last = index;
      return { slice, output: { type: 'pipe'} };
    }

    function outputRedirection(slice: string, filename: string): Command {
      last = index;
      return { slice, output: { type: 'output_redirection', filename } };
    }

    if (last === fullCommand.length) { return null; }

    let isPipe = false;
    let isOutputRedirection = false;

    while (index < fullCommand.length) {
      const char = fullCommand[index];

      isPipe = char === '|';
      isOutputRedirection = char === '>';

      index++;

      if (isPipe || isOutputRedirection) { break; }
    }

    const isAtEnd = index === fullCommand.length;

    let slice = fullCommand.slice(last, isAtEnd ? index : index - 1).trim();

    if (isPipe) {
      last = index;

      return pipe(slice);
    }

    if (isOutputRedirection) {
      last = index;
      const nextCommand = getNextSlice();

      if (nextCommand === null) {
        // If we do not have a valid file, just handle it as a stdout
        return stdout(slice);
      }

      const filename = getFileName(nextCommand.slice);
      return outputRedirection(slice, filename);
    }

    return stdout(slice);
  }

  let slices: Command[] = [];
  let slice: Command | null = null;

  while (slice = getNextSlice()) {
    slices.push(slice);
  }

  return slices;
}

export class Shell {
  private promptString = `${ansiColors.white("{hostname}")} ${ansiColors.magentaBright("::")} ${ansiColors.greenBright("{path}")} ${ansiColors.blueBright("%")} `;

  private hostname: string = "j-os";
  private path: string = HomeDirectory;
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

  public getHostname(): string {
    return this.hostname;
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
    const fs = this.apis.fileSystem;

    function handleCommand(applicationName: string, shell: Shell, args: string[], apis: SystemAPIs): void {

      // Get a program from the /bin directory
      const binaryDirResult = apis.fileSystem.getDirectory('/bin');
      if (!binaryDirResult.ok) { return; }

      const binaryDir = binaryDirResult.value;

      for (const program of binaryDir.children.iterFromHead()) {
        const fileSystemNode = program.value.node;

        if (fileSystemNode.kind !== 'program') { continue; }
        if (fileSystemNode.name !== applicationName) { continue; }

        fileSystemNode.program(shell, args, apis);

        return;
      }

      shell.getTerminal().writeResponse(`jsh: command not found: ${applicationName}`);
    }

    function createNewOutputFile(fs: FileSystem, path: string, content: string): Result<null, string> {
      const rootPath = pathPop(path);
      const fileName = pathLastEntry(path);

      if (!fileName) { return Err('output redirection: Invalid file name'); }

      const rootDirectoryResult = fs.getDirectory(rootPath);
      if (!rootDirectoryResult.ok) { return Err(`output redirection: ${rootPath}: No such file or directory`);  }

      const root = rootDirectoryResult.value;

      if (!root.editableContent) {
        return Err(`output redirection: ${path}: Read-only file system`);
      }

      if (!isUniqueFile(root, fileName)) {
        return Err(`output redirection: ${fileName}: File exists`);
      }

      const { base, extension } = getFileNameParts(fileName);

      fs.addTextFile(root, base, content, true, extension);

      return Ok(null);
    }

    function appendToExistingOutputFile(fs: FileSystem, path: string, content: string): Result<null, string> {
      const nodeResult = fs.getNode(path);
      if (!nodeResult.ok) { return Err('output redirection: Invalid file to append content to'); }

      const node = nodeResult.value;

      if(node.kind !== 'textfile') { return Err('output redirection: Invalid file or directory it needs to be a text file')}

      node.content += content;

      return Ok(null);
    }

    function writeOutputToFile(shell: Shell, fileName: string, output: string[], fs: FileSystem): Result<null, string> {
      const path = getAbsolutePathFromArgs(fileName, shell);
      const nodeResult = fs.getNode(path);

      const content = output.map(stripAnsi).join('\r\n');

      if (!nodeResult.ok) {
        return createNewOutputFile(fs, path, content);
      } else {
        return appendToExistingOutputFile(fs, path, content);
      }
    }

    const redirection = parseRedirection(command);

    for (const [index, part] of redirection.entries()) {
      const previous = index > 0 ? redirection[index - 1] : null;
      const previousWasPipe = previous ? previous.output.type === 'pipe' : false;

      const previousStdout  = previous ? `"${this.terminal.getResponseLines().join('\r\n')}"` : '';

      const stdin = previousWasPipe ? part.slice + " " + previousStdout : part.slice;
      const args = parseCommand(stdin);

      const type = part.output.type;
      const applicationName = args[0]?.toLocaleLowerCase() ?? null;

      if (applicationName === null) { return; }

      switch (type) {
        case "pipe":
        case "output_redirection": {
          this.terminal.disableOutput();
          break;
        }
        case "stdout": {
          this.terminal.enableOutput();
          break;
        }
      }

      this.terminal.resetResponseLines();

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
          handleCommand(applicationName, this, args, this.apis);
        }
      }

      if (part.output.type === 'output_redirection') {
        const outputFile = getAbsolutePathFromArgs(part.output.filename, this);
        const result = writeOutputToFile(this, outputFile, this.terminal.getResponseLines(), fs);

        if (!result.ok) {
          this.terminal.enableOutput();
          this.getTerminal().writeResponse(result.value);
        }
      }
    }
  }
}
