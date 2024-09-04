import { HomeDirectory, Shell } from "@/applications/Terminal/Shell";
import { getAbsolutePath } from "@/apis/FileSystem/FileSystem";
import { SystemAPIs } from "@/components/OperatingSystem";

export type Program = (shell: Shell, args: string[], apis: SystemAPIs) => void;

export function getParameters(args: string[]): string[] {
  if (args.length <= 1) { return []; }
  return args.slice(1, args.length);
}

export function getAbsolutePathFromArgs(path: string, shell: Shell, appendDirectorySlash?: boolean): string {
  if (path.startsWith('~')) {
    path = HomeDirectory + path.slice(1, path.length);
  }

  if (!path.startsWith('/')) {
    path = shell.getPath() + path;
  }

  return getAbsolutePath(path, appendDirectorySlash);
}

export function getFileNameParts(input: string): { base: string, extension: string } {
  const directorySeparations = input.split('/');
  const lastEntry = directorySeparations[directorySeparations.length - 1];

  const parts = lastEntry.split(".");

  if (parts.length <= 1) { return { base: input, extension: "" }; }

  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts.join(".");

  return { base, extension };
}

export interface ProgramConfig {
  readonly appName: string,
  readonly program: Program
}
