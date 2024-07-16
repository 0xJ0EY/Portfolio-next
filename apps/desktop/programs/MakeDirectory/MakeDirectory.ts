import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { FileSystem, FileSystemDirectory } from "@/apis/FileSystem/FileSystem";
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs";
import { isUniqueFile, pathLastEntry, pathParts, pathPop } from "@/apis/FileSystem/util";
import { unwrap } from "result";

function createDirectory(shell: Shell, fs: FileSystem, root: FileSystemDirectory, directory: string, path: string): boolean {
  if (!root.editableContent) {
    shell.getTerminal().writeResponse(`mkdir: ${path}: Read-only file system`);
    return false;
  }

  if (!isUniqueFile(root, directory)) {
    shell.getTerminal().writeResponse(`mkdir: ${directory}: File exists`);
    return false;
  }

  fs.addDirectory(root, directory, true, true);

  return true;
}

function createSequentialDirectory(shell: Shell, fs: FileSystem, path: string): void {
  const root = pathPop(path);
  const directory = pathLastEntry(path);

  if (!directory) { return; }

  const rootDirectoryResult = fs.getDirectory(root);

  if (!rootDirectoryResult.ok) {
    shell.getTerminal().writeResponse(`mkdir: ${root}: No such file or directory`);
    return;
  }

  const rootDir = rootDirectoryResult.value;

  createDirectory(shell, fs, rootDir, directory, path);
}

function createIntermediateDirectory(shell: Shell, fs: FileSystem, path: string): void {
  const rootPath = pathPop(path);
  const rootParts = pathParts(rootPath);
  const directory = pathLastEntry(path);

  if (!directory) { return; }

  let currentPath = '/';
  let currentNode = unwrap(fs.getDirectory(currentPath))!;

  let part: string | undefined;

  while (part = rootParts.shift()) {
    currentPath += `${part}/`;
    const nodeResult = fs.getNode(currentPath);

    if (!nodeResult.ok) {
      // Node doesn't exists yet, so we might be able to create a new one (if allowed by the parent node)
      const createdDirectory = createDirectory(shell, fs, currentNode, part, path);
      if (!createdDirectory) { return; }

      currentNode = unwrap(fs.getDirectory(currentPath))!;
    } else {
      const node = nodeResult.value;

      if (node.kind !== 'directory') {
        shell.getTerminal().writeResponse(`mkdir: ${part}: Not a directory`);
        return;
      }

      currentNode = nodeResult.value as FileSystemDirectory;
    }
  }

  createDirectory(shell, fs, currentNode, directory, path);
}

function MakeDirectory(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;

  const createIntermediateDirs = args[1] === '-p';
  const path = args[!createIntermediateDirs ? 1 : 2] ?? null;

  if (!path) {
    shell.getTerminal().writeResponse('usage: mkdir [-p] directory_name');
    return;
  }

  const absolutePath = getAbsolutePathFromArgs(path, shell, true);

  const directoryCreator = createIntermediateDirs ? createIntermediateDirectory : createSequentialDirectory;
  directoryCreator(shell, fs, absolutePath);
}

export class MakeDirectoryConfig implements ProgramConfig {
  public readonly appName = "mkdir"
  public readonly program = MakeDirectory
}

export const mkdirConfig = new MakeDirectoryConfig();
