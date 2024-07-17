import { Shell } from "@/applications/Terminal/Shell";
import { SystemAPIs } from "@/components/OperatingSystem";
import { ProgramConfig } from "../Programs";

function Neofetch(shell: Shell, args: string[], apis: SystemAPIs): void {
}

export class NeofetchConfig implements ProgramConfig {
  public readonly appName = "neofetch"
  public readonly program = Neofetch
}

export const neofetchConfig = new NeofetchConfig();
