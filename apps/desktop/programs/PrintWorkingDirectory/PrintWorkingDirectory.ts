import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig } from "../Programs";

function PrintWorkingDirectory(shell: Shell, args: string[], apis: SystemAPIs): void {
  const path = shell.getPath();

  shell.getTerminal().writeResponse(path);
}

export class PrintWorkingDirectoryConfig implements ProgramConfig {
  public readonly appName = "pwd"
  public readonly program = PrintWorkingDirectory
}

export const pwdConfig = new PrintWorkingDirectoryConfig();
