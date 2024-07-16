import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs";
import { FileSystemDirectory, FileSystem, FileSystemNode } from "@/apis/FileSystem/FileSystem";
import { constructPath } from "@/apis/FileSystem/util";

function findNode(absolutePath: string, fs: FileSystem): FileSystemNode | null {
  const isDirectory = absolutePath.endsWith('/');

  { // Normal search
    const nodeResult = fs.getNode(absolutePath);
    if (nodeResult.ok) { return nodeResult.value; }
  }

  if (isDirectory) { return null; }

  {
    const nodeResult = fs.getNode(absolutePath + '/');
    if (nodeResult.ok) { return nodeResult.value; }
  }

  return null;
}

function RemoveDirectory(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;

  const hasFlags = (args[1] ?? "").startsWith('-');
  const flags = hasFlags ? args[1] : "";

  const recursive = flags.indexOf('r') > 0;
  const removeDirs = recursive || (flags.indexOf('d') > 0);

  const path = args[hasFlags ? 2 : 1] ?? null;

  if (!path) {
    shell.getTerminal().writeResponse('usage: rm [-dr] file');
    return;
  }

  const absolutePath = getAbsolutePathFromArgs(path, shell, false);

  const node = findNode(absolutePath, fs);
  if (!node) {
    shell.getTerminal().writeResponse(`rm: ${path}: No such file or directory`);
    return;
  }

  if (node.kind === 'directory') {
    if (!removeDirs) {
      shell.getTerminal().writeResponse(`rm: ${path}: is a directory`);
      return;
    }

    if (!recursive && (node as FileSystemDirectory).children.count() > 0) {
      shell.getTerminal().writeResponse(`rm: ${path}: Directory not empty`);
      return;
    }
  }

  if (absolutePath === "/") {
    shell.getTerminal().writeResponse(`Moginistrator: I can't let you do that, kupo!`);
    return;
  }

  if (!node.editable) {
    shell.getTerminal().writeResponse(`rm: ${path}: Insufficient permissions to remove`);
    return;
  }

  const nodeParent = node.parent!;

  fs.removeNodeFromDirectory(node);

  // If for some reason (users) our current working directory has been deleted, change to the parent of the just deleted node
  if (!fs.getDirectory(shell.getPath()).ok) {
    shell.changeDirectory(constructPath(nodeParent))
  }
}

export class RemoveConfig implements ProgramConfig {
  public readonly appName = "rm"
  public readonly program = RemoveDirectory
}

export const rmConfig = new RemoveConfig();
