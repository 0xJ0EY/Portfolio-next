import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs";
import { FileSystemNode } from "@/apis/FileSystem/FileSystem";
import { blueBright } from "ansi-colors";

function formatEntry(node: FileSystemNode): string {
  const isDirectory = node.kind === 'directory';

  const name = node.name + node.filenameExtension;

  return isDirectory ? blueBright(name) : name;
}

function ListFile(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;
  const path = args[1] ?? shell.getPath();

  const absolutePath = getAbsolutePathFromArgs(path, shell, true);
  const directoryResult = fs.getDirectory(absolutePath);

  if (!directoryResult.ok) {
    shell.getTerminal().writeResponse(`ls: ${path}: No such file or directory`);
    return;
  }

  const directory = directoryResult.value;

  for (const entry of directory.children.iterFromHead()) {
    const directoryNode = entry.value.node;

    shell.getTerminal().writeResponse(formatEntry(directoryNode));
  }
}

export class ListFileConfig implements ProgramConfig {
  public readonly appName = "ls"
  public readonly program = ListFile
}

export const lsConfig = new ListFileConfig();
