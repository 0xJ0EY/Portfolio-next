import { Shell } from "@/applications/Terminal/Shell";
import { FileSystem, FileSystemDirectory } from "@/apis/FileSystem/FileSystem";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig, getAbsolutePathFromArgs, getFileNameParts } from "../Programs";
import { isUniqueFile, pathLastEntry, pathPop } from "@/apis/FileSystem/util";

function createFile(shell: Shell, fs: FileSystem, root: FileSystemDirectory, fileName: string, path: string): boolean {
  if (!root.editableContent) {
    shell.getTerminal().writeResponse(`touch: ${path}: Read-only file system`);
    return false;
  }

  if (!isUniqueFile(root, fileName)) {
    shell.getTerminal().writeResponse(`touch: ${fileName}: File exists`);
    return false;
  }

  const { base, extension } = getFileNameParts(fileName);

  fs.addTextFile(root, base, "", true, extension);

  return true;
}

function createSequentialDirectory(shell: Shell, fs: FileSystem, path: string): void {
  const root = pathPop(path);
  const fileName = pathLastEntry(path);

  if (!fileName) { return; }

  const rootDirectoryResult = fs.getDirectory(root);

  if (!rootDirectoryResult.ok) {
    shell.getTerminal().writeResponse(`touch: ${root}: No such file or directory`);
    return;
  }

  const rootDir = rootDirectoryResult.value;

  createFile(shell, fs, rootDir, fileName, path);
}

function Touch(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;
  const path = args[1] ?? null;

  if (!path) {
    shell.getTerminal().writeResponse('usage: touch file_name');
    return;
  }

  const absolutePath = getAbsolutePathFromArgs(path, shell, true);

  createSequentialDirectory(shell, fs, absolutePath);
}

export class TouchConfig implements ProgramConfig {
  public readonly appName = "touch"
  public readonly program = Touch
}

export const touchConfig = new TouchConfig();
