import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import ansiEscapes, { cursorTo } from 'ansi-escapes';

export interface PseudoTerminal {
  activeTerminal(): Terminal;
  write(input: string): void;
  writeln(input: string): void;
}


function restoreCursor(lambda: () => void, terminal: Terminal): void {
  const cursorX = terminal.buffer.active.cursorX;
  const cursorY = terminal.buffer.active.cursorY;

  console.log(cursorX, cursorY);

  lambda();

  terminal.write(ansiEscapes.cursorTo(cursorX, cursorY));
}

function splitStringInParts(input: string, rowLength: number): string[] {
  if (input === '') { return ['']; }

  let index = 0;
  let parts: string[] = [];

  while (index < input.length) {
    let part = input.slice(index, Math.min(index + rowLength, input.length));
    parts.push(part);

    index += rowLength;
  }

  return parts;
}

class TerminalManager {
  private ps1 = "$ ";
  
  private prompt: string = "";
  private promptLines: number = 1;
  private promptLine: number = 0;

  private resizeObserver: ResizeObserver | null = null;

  constructor(private terminal: Terminal, private domElement: HTMLElement) {}

  public writeln(line: string) {
    this.terminal.write(`${line}\r\n`);
  }

  private coordsInPrompt(index: number): { x: number, y: number } {
    index += this.ps1.length;

    const x = index % this.terminal.cols;
    const y = Math.floor(index / this.terminal.cols);

    return { x, y: y + this.promptLine }
  }

  private write() {
    const completePrompt = `\r${this.ps1}${this.prompt}`;
    const promptLines = splitStringInParts(completePrompt, this.terminal.cols);

    const lineDiff = promptLines.length - this.promptLines;

    for (let i = 0; i > lineDiff; i++) {
      this.terminal.write('\r\n'); // Write empty lines, so we can write over them with a write with data
    }

    this.promptLines = Math.max(this.promptLines, promptLines.length);
    this.terminal.write(ansiEscapes.cursorUp(this.promptLines - 1) + completePrompt);
  }

  private insertKey(character: string): void {
    const promptOffsetX = this.ps1.length;
    const cursorX = this.terminal.buffer.active.cursorX;
    const lineX = cursorX - promptOffsetX;

    const cursorDeltaY = this.terminal.buffer.active.cursorY - this.promptLine;
    const linePosition = cursorDeltaY * this.terminal.cols + lineX;

    if (linePosition === this.prompt.length) {
      this.prompt += character;

      this.write();
    } else {
      
      const start = this.prompt.slice(0, linePosition);
      const end = this.prompt.slice(linePosition);

      this.prompt = start + character + end;

      this.write();

      const { x, y } = this.coordsInPrompt(linePosition + 1);
      this.terminal.write(cursorTo(x, y));
    }
  }

  private onKey(args: { key: string, domEvent: KeyboardEvent }): void {
    const { key, domEvent } = args;

    const code = domEvent.code;

    switch (code) {
      case "Enter": {
        console.log('todo');
        break;
      }
      case "Backspace": {
        console.log('todo');
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        this.terminal.write(key);
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        break;
      }
      default: {
        this.insertKey(key);
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

    this.write();
  }

  public dispose(): void {
    this.terminal.dispose();
    this.resizeObserver?.disconnect();
  }
}


export default function TerminalApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!terminalRef.current) { return; }

    const terminal = new Terminal();
    const manager = new TerminalManager(terminal, terminalRef.current);

    manager.bind();

    /*

    let currentLine: string = "";

    terminal.open(terminalRef.current);

    function writeCurrentLine() {
      terminal.write(`\r$ ${currentLine}`);
    }

    function onResize() {
      if (!terminalRef.current) { return; }

      const terminalContainer = terminalRef.current;

      // Build on a private api, just like the FitAddon of xterm itself :ˆ)
      const core = (terminal as any)._core;
      const dimensions = core._renderService.dimensions;
      const cell: { height: number, width: number } = dimensions.css.cell;

      const cols = Math.floor(terminalContainer.clientWidth / cell.width);
      const rows = Math.floor(terminalContainer.clientHeight / cell.height);

      terminal.resize(cols, rows);
    }

    const observer = new ResizeObserver(onResize);
    observer.observe(terminalRef.current);

    terminal.writeln('uwu');

    terminal.onKey((args: { key: string, domEvent: KeyboardEvent }) => {
      const { key, domEvent } = args;

      const code = domEvent.code.toLowerCase();

      console.log(code);

      switch (code) {
        case "enter": {
          console.log('todo');
          break;
        }
        case "backspace": {
          console.log('todo');
          break;
        }
        case "arrowup":
        case "arrowdown": {
          break;
        }
        default: {
          currentLine += key;

          writeCurrentLine();

          break;
        }
      }
    });

    function prompt() {
      terminal.write("\r$ ");
    }

    prompt();

    */


    return () => { 
      manager.dispose();
    }
  }, []);

  // I think loading a style sheet like this is illegal according to the HTML spec
  // But the browsers accept it anyway :ˆ)
  return (
    <>
      <link rel="stylesheet" href="/xterm/xterm.css"/>
      <div ref={terminalRef} style={{ height: '100%', width: '100%', background: '#000' }}></div>
    </>
  )
} 