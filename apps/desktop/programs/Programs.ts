import { ApplicationIcon } from "@/apis/FileSystem/FileSystem";
import { Shell } from "@/applications/Terminal/TerminalApplicationView";
import { SystemAPIs } from "@/components/OperatingSystem";

export type Program = (shell: Shell, args: string[], apis: SystemAPIs) => void;

export interface ProgramConfig {
  readonly appName: string,
  readonly program: Program
}
