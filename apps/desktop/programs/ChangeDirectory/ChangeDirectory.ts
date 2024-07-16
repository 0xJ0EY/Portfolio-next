import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs";

function ChangeDirectory(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;
  let path = args[1] ?? null;

  if (!path) { path = '/Users/joey/'; }

  const absolutePath = getAbsolutePathFromArgs(path, shell, true);
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
