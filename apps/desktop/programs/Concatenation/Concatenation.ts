import { SystemAPIs } from "@/components/OperatingSystem"
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs"
import { Shell } from "@/applications/Terminal/Shell";

function Concatenation(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;
  const path = args[1] ?? null;

  if (!path) { return; }

  const absolutePath = getAbsolutePathFromArgs(path, shell);
  const nodeResult = fs.getNode(absolutePath);

  if (!nodeResult.ok) {
    shell.getTerminal().writeResponse(`cat: no such file or directory: ${path}`);
    return;
  }

  const node = nodeResult.value;
  const kind = node.kind;

  switch (kind) {
    case "directory":
      shell.getTerminal().writeResponse(`cat: ${path}: Is a directory`);
      break;
    case "image":
      shell.getTerminal().writeResponse(`cat: ${path}: Is an image`);
      break;
    case "textfile":
      shell.getTerminal().writeResponseLines(node.content.split('\n'));
      break;
    case "application":
      shell.getTerminal().writeResponse(`cat: ${path}: Is an application`);
      break;
    case "hyperlink":
      shell.getTerminal().writeResponse(`cat: ${path}: Is a hyperlink`);
      break;
    case "program":
      shell.getTerminal().writeResponse(`cat: ${path}: Is a program`);
      break;
  }
}

export class ConcatenationConfig implements ProgramConfig {
  public readonly appName = "cat"
  public readonly program = Concatenation
}

export const catConfig = new ConcatenationConfig();
