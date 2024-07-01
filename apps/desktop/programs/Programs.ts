import { Shell } from "@/applications/Terminal/Shell";
import { getAbsolutePath } from "@/apis/FileSystem/FileSystem";
import { SystemAPIs } from "@/components/OperatingSystem";

export type Program = (shell: Shell, args: string[], apis: SystemAPIs) => void;

export function getAbsolutePathFromArgs(path: string, shell: Shell, appendDirectorySlash?: boolean): string {
  if (!path.startsWith('/')) {
    path = shell.getPath() + path;
  }

  return getAbsolutePath(path, appendDirectorySlash);
}

export interface ProgramConfig {
  readonly appName: string,
  readonly program: Program
}
