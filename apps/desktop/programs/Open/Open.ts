import { Shell } from "@/applications/Terminal/Shell";
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

  if (!path) {
    shell.getTerminal().writeResponseLines([
      'Usage: open filename',
      'Help: Open opens files from a shell.',
      'By default, opens each file using the default application for that file.',
      'If the file is in the form of a URL, the file will be opened as a URL.'
    ]);

    return;
  }

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
