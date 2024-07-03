import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { FileSystem } from "@/apis/FileSystem/FileSystem";
import { ProgramConfig, getAbsolutePathFromArgs } from "../Programs";
import { isUniqueFile, pathLastEntry, pathPop } from "@/apis/FileSystem/util";

function createSequentialDirectory(shell: Shell, fs: FileSystem, path: string): void {
  const root = pathPop(path);
  const directory = pathLastEntry(path) ?? '';

  const rootDirectoryResult = fs.getDirectory(root);

  if (!rootDirectoryResult.ok) {
    shell.getTerminal().writeResponse(`mkdir: ${root}: No such file or directory`);
    return;
  }

  const rootDir = rootDirectoryResult.value;

  if (!isUniqueFile(rootDir, directory)) {
    shell.getTerminal().writeResponse(`mkdir: ${directory}: File exists`);
    return;
  }

  fs.addDirectory(rootDir, directory, true, true);
}

function createIntermediateDirectory(shell: Shell, fs: FileSystem, path: string): void {}

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
