import { Shell } from "@/applications/Terminal/TerminalApplicationView";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig } from "../Programs";

function ListFile(shell: Shell, args: string[], apis: SystemAPIs): void {
  shell.getTerminal().writeResponse('Hello from List Files');
}

export class ListFileConfig implements ProgramConfig {
  public readonly appName = "ls"
  public readonly program = ListFile
}

export const listFileConfig = new ListFileConfig();
