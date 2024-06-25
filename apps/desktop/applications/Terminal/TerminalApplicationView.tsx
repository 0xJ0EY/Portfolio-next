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

  private promptPosition: number = 0;

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

    const lineDiff = Math.max(promptLines.length - this.promptLines, 0);
    
    for (let i = 0; i > lineDiff; i++) {
      this.terminal.write('\r\n'); // Write empty lines, so we can write over them with a write with data
    }

    this.promptLines = Math.max(this.promptLines, promptLines.length);

    const y = this.promptLine;

    this.terminal.write(cursorTo(0, y) + completePrompt + ' ');
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

  private insertEnter(): void {
    this.promptLine += this.promptLines;
    console.log('execute', this.prompt);

    this.prompt = "";

    this.promptLines = 1;
    this.promptPosition = 0;

    this.terminal.writeln('');
    this.write();
    
    this.updateCursor();
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

    this.write();

    this.promptPosition--;
    this.updateCursor();
  }

  private insertKey(character: string): void {
    if (this.promptPosition === this.prompt.length) {
      this.prompt += character;

      this.promptPosition++;

      this.write();
      this.updateCursor();

    } else {
      const begin = this.prompt.slice(0, this.promptPosition);
      const end = this.prompt.slice(this.promptPosition);

      this.prompt = begin + character + end;

      this.promptPosition++;

      this.write();
      this.updateCursor();
    }
  }

  private onKey(args: { key: string, domEvent: KeyboardEvent }): void {
    const { key, domEvent } = args;

    const code = domEvent.code;

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
    this.updateCursor();
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