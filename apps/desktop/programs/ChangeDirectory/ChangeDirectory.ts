import { Shell } from "@/applications/Terminal/TerminalApplicationView";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig } from "../Programs";
import { getAbsolutePath } from "@/apis/FileSystem/FileSystem";

function ChangeDirectory(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;
  let path = args[1] ?? null;

  if (!path) { path = '/Users/joey/'; }
  if (!path.startsWith('/')) {
    path = shell.getPath() + '/' + path;
  }

  const absolutePath = getAbsolutePath(path);
  const directory = fs.getDirectory(absolutePath);

  if (!directory.ok) {
    shell.getTerminal().writeResponse(`cd: no such file or directory: ${path}`);
    return;
  }

  shell.changeDirectory(absolutePath);
}

export class ChangeDirectoryConfig implements ProgramConfig {
  public readonly appName = "cd"
  public readonly program = ChangeDirectory
}

export const cdConfig = new ChangeDirectoryConfig();
