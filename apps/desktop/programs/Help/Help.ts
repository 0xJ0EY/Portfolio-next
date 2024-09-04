import { SystemAPIs } from "@/components/OperatingSystem"
import { ProgramConfig } from "../Programs"
import { Shell } from "@/applications/Terminal/Shell";
import { greenBright } from "ansi-colors";
import { ansiStringPadEnd, ansiStringPadStart } from "@/applications/Terminal/TerminalManager";

function command(name: string, description: string): string {
  const COMMAND_LENGTH = 12;
  const COMMAND_PRE_LENGTH = 2 + name.length;

  const command = ansiStringPadEnd(ansiStringPadStart(greenBright(name), COMMAND_PRE_LENGTH), COMMAND_LENGTH);

  return command + description;
}

function Help(shell: Shell, args: string[], apis: SystemAPIs): void {
  shell.getTerminal().writeResponseLines([
    'Available commands:',
    command('cat', 'Print file content.'),
    command('open', 'Open files or applications.'),
    command('motd', 'Display message of the day.'),
    command('help', 'Displays this menu.'),
    command('cd', 'Changes the current directory.'),
    command('ls', 'Lists directory content.'),
    command('mkdir', 'Create a new directory.'),
    command('touch', 'Create a new text file.'),
    command('rm', 'Removes files or directories.'),
    command('pwd', 'Prints Path of current working directory.'),
    command('clear', 'Clear the terminal screen.'),
    command('ps', 'Set prompt string.'),
    command('neofetch', 'Display system information.'),
    command('uwu', 'uwufies your text.'),
    'This shell supports pipes (|) and output redirection (>)'
  ]);
}

export class HelpConfig implements ProgramConfig {
  public readonly appName = "help"
  public readonly program = Help
}

export const helpConfig = new HelpConfig();
