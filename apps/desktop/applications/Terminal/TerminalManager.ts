import { SystemAPIs } from "@/components/OperatingSystem";
import { Terminal } from "@xterm/xterm";
import { cursorTo, cursorHide, cursorShow, cursorUp, cursorDown, cursorMove } from "ansi-escapes";
import { BaseApplicationManager } from "../ApplicationManager";
import { Shell } from "./Shell";
import { TerminalConnector } from "./TerminalApplicationView";
import { clamp, isSafari } from "@/components/util";
import { SoundService } from "@/apis/Sound/Sound";
import { playKeyDownSound } from "@/components/PeripheralSounds/PeripheralSounds";

function isEscapeSequence(ansi: string, index: number): boolean {
  return ansi.charCodeAt(index) === 0x1B;
}

function isControlSequenceIntroducer(ansi: string, index: number): boolean {
  return ansi.charCodeAt(index) === 0x5B;
}

function isControlSequenceEndMarker(ansi: string, index: number): boolean {
  return ansi.charCodeAt(index) === 0x6D;
}

function ansiSplit(ansi: string, maxLength: number): { part: string, offset: number } {
  let lastUsableIndex = 0;

  let length = 0;
  let index = 0;

  let inControlSequence: boolean = false;

  while (length < maxLength && index < ansi.length) {
    if (isEscapeSequence(ansi, index)) {
      index++;
      continue;
    }

    if (isEscapeSequence(ansi, index - 1) && isControlSequenceIntroducer(ansi, index)) {
      inControlSequence = true;
    }

    if (!inControlSequence) {
      length++;
    }

    if (inControlSequence && isControlSequenceEndMarker(ansi, index)) {
      inControlSequence = false;
    }

    index++;

    if (!inControlSequence) {
      lastUsableIndex = index;
    }
  }

  const offset = index < ansi.length ? lastUsableIndex : index;

  return { part: ansi.slice(0, lastUsableIndex), offset: offset };
}

export function ansiStringLength(ansi: string): number {
  if (ansi.length < 1) { return ansi.length; }

  let length = 0;
  let index = 0;

  let inControlSequence: boolean = false;

  while (index < ansi.length) {
    if (isEscapeSequence(ansi, index)) {
      index++;
      continue;
    }

    if (isEscapeSequence(ansi, index - 1) && isControlSequenceIntroducer(ansi, index)) {
      inControlSequence = true;
    }

    if (!inControlSequence) {
      length++;
    }

    if (inControlSequence && isControlSequenceEndMarker(ansi, index)) {
      inControlSequence = false;
    }

    index++;
  }

  return length;
}

export function stripAnsi(ansi: string): string {
  if (ansi.length < 1) { return ""; }

  let output = "";
  let index = 0;

  let inControlSequence: boolean = false;

  while (index < ansi.length) {
    if (isEscapeSequence(ansi, index)) {
      index++;
      continue;
    }

    if (isEscapeSequence(ansi, index - 1) && isControlSequenceIntroducer(ansi, index)) {
      inControlSequence = true;
    }

    if (!inControlSequence) {
      output += ansi[index];
    }

    if (inControlSequence && isControlSequenceEndMarker(ansi, index)) {
      inControlSequence = false;
    }

    index++;
  }

  return output;
}

export function ansiStringPadStart(ansi: string, length: number, fillString?: string): string {
  const fill = fillString || ' ';

  const stringLength = ansiStringLength(ansi);
  if (stringLength > length) { return ansi; }

  const filling = fill.repeat(length - stringLength);

  return filling + ansi;
}

export function ansiStringPadEnd(ansi: string, length: number, fillString?: string): string {
  const fill = fillString || ' ';

  const stringLength = ansiStringLength(ansi);
  if (stringLength > length) { return ansi; }

  const filling = fill.repeat(length - stringLength);

  return ansi + filling;
}

function splitStringInParts(input: string, cols: number): string[] {
  if (input === '') { return ['']; }

  let index = 0;
  let parts: string[] = [];

  while (index < input.length) {
    const { part, offset } = ansiSplit(input.slice(index), cols);

    parts.push(part);
    index += offset;
  }

  return parts;
}

export class TerminalManager implements TerminalConnector {
  private prompt: string = "";
  private showOutput: boolean = true;

  private promptLines: number = 1;
  private actualPromptLines: number = 1;

  private promptLine: number = 0;
  private promptPosition: number = 0;

  private resizeObserver: ResizeObserver | null = null;
  private shell: Shell;

  private historyPrompt: string = "";
  private historyEntries: string[] = [];
  private historyIndex = 0;

  private responseLines: string[] = [];

  private soundService: SoundService;

  constructor(private terminal: Terminal, private domElement: HTMLElement, applicationManager: BaseApplicationManager, apis: SystemAPIs) {
    this.terminal.options.fontSize = 16;

    // xterm js has a bit of a weird initialization process, so we hardcode these values
    const cellWidth   = 9.6;
    const cellHeight  = 17;

    const cols = Math.floor(domElement.clientWidth / cellWidth);
    const rows = Math.floor(domElement.clientHeight / cellHeight);

    this.terminal.resize(cols, rows);

    this.shell = new Shell(this, applicationManager, apis);
    this.soundService = apis.sound;
  }

  private coordsInPrompt(index: number): { x: number, y: number } {
    index += ansiStringLength(this.shell.getPromptString());

    const x = index % this.terminal.cols;
    const y = Math.floor(index / this.terminal.cols);

    const baseY = this.promptLine - this.terminal.buffer.active.baseY;

    return { x, y: baseY + y}
  }

  private clearPrompt(): void {
    const baseY = this.promptLine - this.terminal.buffer.active.baseY;
    const clear = '\x1b[2K\r';

    for (let i = 0; i < this.promptLines; i++) {
      const y = baseY + i;

      this.write(cursorTo(0, y) + clear);
    }

    this.write(cursorTo(0, baseY));
  }

  private resetPrompt(): void {
    this.prompt = '';
    this.promptPosition = 0;

    this.promptLines = 1;
    this.actualPromptLines = 1;

    this.historyPrompt = '';
  }

  private updatePrompt(): void {
    this.hideCursor();
    this.clearPrompt();
    this.writePrompt();
    this.updateCursor();
    this.showCursor();
  }

  public clear(): void {
    this.resetPrompt();

    this.promptLine = 0;
    this.terminal.reset();

    this.updatePrompt();
  }

  public writeResponse(response: string): void {
    this.responseLines.push(response);

    if (!this.showOutput) { return; }

    this.hideCursor();

    const lines = response.split('\n');

    for (const line of lines) {
      this.write(line);
      this.newLine();
    }

    this.showCursor();
  }

  public writeResponseLines(lines: string[]): void {
    this.responseLines.push(...lines);

    if (!this.showOutput) { return; }

    for (const line of lines) {
      this.writeResponse(line);
    }
  }

  public resetResponseLines(): void {
    this.responseLines = [];
  }

  public getResponseLines(): string[] {
    return this.responseLines;
  }

  public enableOutput(): void {
    this.showOutput = true;
  }

  public disableOutput(): void {
    this.showOutput = false;
  }

  private getCompletePrompt(): string {
    return `\r${this.shell.getPromptString()}${this.prompt}`;
  }

  private writePrompt(): void {
    this.write(this.getCompletePrompt());
  }

  private write(content: string): void {
    const lines = splitStringInParts(content, this.terminal.cols);
    const lineDiff = Math.max(lines.length - this.promptLines, 0);

    for (let i = 0; i > lineDiff; i++) {
      this.terminal.write('\r\n'); // Write empty lines, so we can write over them with a write with data
    }

    this.promptLines = Math.max(this.promptLines, lines.length);
    this.actualPromptLines = lines.length;

    const y = this.promptLine - this.terminal.buffer.active.baseY;
    this.terminal.write(cursorTo(0, y) + content);
  }

  private newLine(): void {
    this.promptLine += this.actualPromptLines;

    this.terminal.writeln('');

    this.resetPrompt();
  }

  private hideCursor(): void {
    this.terminal.write(cursorHide);
  }

  private showCursor(): void {
    this.terminal.write(cursorShow);
  }

  private updateCursor(): void {
    const { x, y } = this.coordsInPrompt(this.promptPosition);
    this.terminal.write(cursorTo(x, y));
  }

  private moveCursor(direction: 'left' | 'right'): void {
    if (direction === 'left') {
      if (this.promptPosition === 0) { return; }

      this.promptPosition--;
    } else {
      if (this.promptPosition >= this.prompt.length) { return; }

      this.promptPosition++;
    }

    const { x, y } = this.coordsInPrompt(this.promptPosition);
    this.terminal.write(cursorTo(x, y));
  }

  private loadHistory(direction: 'prev' | 'next'): void {
    const offset = direction === 'next' ? 1 : -1;
    this.historyIndex = clamp(this.historyIndex + offset, 0, this.historyEntries.length);

    if (this.historyIndex === this.historyEntries.length) {
      this.prompt = this.historyPrompt;
    } else {
      this.prompt = this.historyEntries[this.historyIndex];
    }

    this.promptPosition = this.prompt.length;

    this.updatePrompt();
  }

  private insertEnter(): void {
    const command = this.prompt;

    this.newLine();

    this.shell.process(command);

    if (command.length > 0) {
      this.historyEntries.push(command);
      this.historyIndex = this.historyEntries.length;
    }

    this.updatePrompt();
  }

  private insertBackspace(): void {
    if (this.promptPosition === 0) { return; }

    if (this.promptPosition === this.prompt.length) {
      this.prompt = this.prompt.slice(0, this.prompt.length - 1);
    } else {
      const begin = this.prompt.slice(0, this.promptPosition - 1);
      const end = this.prompt.slice(this.promptPosition);

      this.prompt = begin + end;
    }

    this.promptPosition--;
    this.updatePrompt();
  }

  private insertCharacters(characters: string): void {
    if (this.promptPosition === this.prompt.length) {
      this.prompt += characters;

      this.promptPosition += characters.length;

      this.updatePrompt();
    } else {
      const begin = this.prompt.slice(0, this.promptPosition);
      const end = this.prompt.slice(this.promptPosition);

      this.prompt = begin + characters + end;

      this.promptPosition += characters.length;

      this.updatePrompt();
    }

    this.historyPrompt = this.prompt;
  }

  private playKeySound(keyCode: string): void {
    if (isSafari()) { return; }

    // No clue why, but xterm doesn't capture the space event, like it does with the other keys
    // So the space is still handled by the PeripheralSounds service
    if (keyCode === 'Space') { return; }

    playKeyDownSound(this.soundService, keyCode);
  }

  private onKey(args: { key: string, domEvent: KeyboardEvent }): void {
    const { key, domEvent } = args;

    const code = domEvent.code;

    if (domEvent.ctrlKey || domEvent.altKey) { return; }

    if (!domEvent.repeat) { this.playKeySound(code); }

    switch (code) {
      case "Enter": {
        this.insertEnter();
        break;
      }
      case "Backspace": {
        this.insertBackspace();
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        this.moveCursor(code === 'ArrowLeft' ? 'left' : 'right');
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        this.loadHistory(code === 'ArrowUp' ? 'prev' : 'next');
        break;
      }
      default: {
        if (key.length !== 1) { return; }
        this.insertCharacters(key);
      }
    }
  }

  private onResize(): void {
    const terminalContainer = this.domElement;

    // Build on a private api, just like the FitAddon of xterm itself :ˆ)
    const core = (this.terminal as any)._core;
    const dimensions = core._renderService.dimensions;
    const cell: { height: number, width: number } = dimensions.css.cell;

    const cols = Math.floor(terminalContainer.clientWidth / cell.width);
    const rows = Math.floor(terminalContainer.clientHeight / cell.height);

    this.terminal.resize(cols, rows);
  }

  public bind(): void {
    this.terminal.open(this.domElement);

    this.terminal.onKey(this.onKey.bind(this));

    this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
    this.resizeObserver.observe(this.domElement);

    this.shell.process('motd');
    this.shell.process('help');

    this.updatePrompt();
    this.updateCursor();
  }

  public dispose(): void {
    this.terminal.dispose();
    this.resizeObserver?.disconnect();
  }
}
