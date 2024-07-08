import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { getAbsolutePathFromArgs, ProgramConfig } from "../Programs";
import { FileSystem } from "@/apis/FileSystem/FileSystem";
import { pathLastEntry, pathPop } from "@/apis/FileSystem/util";

function isDirectory(path: string): boolean {
  return path.endsWith('/');
}

function toDirectoryPath(path: string): string {
  return path + (!isDirectory(path) ? '/' : '');
}

function stripExtension(fileName: string): string {
  const parts = fileName.split('.');

  if (parts.length > 1) {
    parts.pop();
  }

  return parts.join('.');
}

function getSourcePath(source: string, fs: FileSystem, shell: Shell): string {
  const sourceDirectoryResult = fs.getDirectory(getAbsolutePathFromArgs(source, shell));

  if (sourceDirectoryResult.ok) { return toDirectoryPath(source); }

  return source;
}

function getTargetPath(source: string, target: string, fs: FileSystem, shell: Shell): string {

  function toEntry(path: string): string {
    const entry = pathLastEntry(source) ?? "";

    return entry + (isDirectory(path) ? '/' : '');
  }

  const targetDirectoryResult = fs.getDirectory(getAbsolutePathFromArgs(target, shell));

  if (targetDirectoryResult.ok || isDirectory(target)) {
    return toDirectoryPath(target) + toEntry(source);
  }

  return target;
}

function moveFiles(source: string, target: string, fs: FileSystem, shell: Shell): void {
  const sourceAbsolutePath = getAbsolutePathFromArgs(source, shell);
  const targetAbsolutePath = getAbsolutePathFromArgs(target, shell);

  const targetRoot = pathPop(targetAbsolutePath);

  const rootResult = fs.getDirectory(targetRoot);
  const sourceResult = fs.getNode(sourceAbsolutePath);

  if (!rootResult.ok || !sourceResult.ok) {
    shell.getTerminal().writeResponse(`mv: rename ${source} to ${target}: No such file or directory`);
    return;
  }

  const sourceNode = sourceResult.value;
  const rootDirectory = rootResult.value;

  if (!sourceNode.editable) {
    shell.getTerminal().writeResponse(`mv: ${source}: Read-only file`);
    return;
  }

  if (!rootDirectory.editableContent) {
    shell.getTerminal().writeResponse(`mv: ${target}: Read-only file system`);
    return;
  }

  const name = stripExtension(pathLastEntry(targetAbsolutePath)!);
  fs.renameAndMove(sourceNode, name, rootDirectory);
}

function Move(shell: Shell, args: string[], apis: SystemAPIs): void {
  const fs = apis.fileSystem;

  const source = args[1] ?? null;
  const target = args[2] ?? null;

  if (!source || !target) {
    shell.getTerminal().writeResponse('usage: mv source target');
    return;
  }

  const sourcePath = getSourcePath(source, fs, shell);
  const targetPath = getTargetPath(sourcePath, target, fs, shell);

  const sourceAbsolutePath = getAbsolutePathFromArgs(sourcePath, shell);
  const targetAbsolutePath = getAbsolutePathFromArgs(targetPath, shell);

  const sourceNodeResult = fs.getNode(sourceAbsolutePath);
  if (!sourceNodeResult.ok) {
    shell.getTerminal().writeResponse(`mv: rename ${sourcePath} to ${targetPath}: No such file or directory`);
    return;
  }

  const targetNodeResult = fs.getNode(targetAbsolutePath);
  if (targetNodeResult.ok) {
    shell.getTerminal().writeResponse(`mv: ${targetPath}: already exists`);
    return;
  }

  moveFiles(sourcePath, targetPath, fs, shell);
}

export class MoveConfig implements ProgramConfig {
  public readonly appName = "mv"
  public readonly program = Move
}

export const moveConfig = new MoveConfig();
