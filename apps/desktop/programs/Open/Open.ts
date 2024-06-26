import { Shell } from "@/applications/Terminal/TerminalApplicationView";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig } from "../Programs";
import { getAbsolutePath } from "@/apis/FileSystem/FileSystem";

function Open(shell: Shell, args: string[], apis: SystemAPIs): void {
  function openNode(shell: Shell, path: string): boolean {
    const node = fs.getNode(path);
    if (!node.ok) { return false}

    shell.openNewProcess(path);

    return true;
  }

  const fs = apis.fileSystem;
  let path = args[1] ?? null;

  if (!path.startsWith('/')) {
    path = shell.getPath() + '/' + path;
  }

  const absolutePath = getAbsolutePath(path);
  const isDirectory = absolutePath.endsWith('/');

  // If the file path is not a directory, also try attempting opening the directory with the same name
  const openedFile = openNode(shell, absolutePath) || (!isDirectory && openNode(shell, absolutePath + '/'));

  if (!openedFile) {
    shell.getTerminal().writeResponse(`The file ${absolutePath} does not exist.`);
  }
}

export class OpenConfig implements ProgramConfig {
  public readonly appName = "open"
  public readonly program = Open
}

export const openConfig = new OpenConfig();
