import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';

export interface PseudoTerminal {
  activeTerminal(): Terminal;
  write(input: string): void;
  writeln(input: string): void;
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
  private prompt = "$ ";

  private lines: string[] = [
    "foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar",
    "barfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoo"
  ];
  private line: string = "";

  private resizeObserver: ResizeObserver | null = null;

  constructor(private terminal: Terminal, private domElement: HTMLElement) {}

  public writeln(line: string) {
    this.lines.push(line);
    this.terminal.write(`${line}\r\n`);
  }

  private write() {
    // this.terminal.write(`\r${this.prompt}${this.line}`);
    this.fullRender();
  }

  private fullRender() {
    // Store cursor position
    const originalCursorX = this.terminal.buffer.active.cursorX;
    const originalCursorY = this.terminal.buffer.active.cursorY;

    const baseY = this.terminal.buffer.active.baseY;
    const rows = this.terminal.rows;

    const lines: string[] = [];
  
    this.terminal.clear();

    for (const historyLine of this.lines) {
      const parts = splitStringInParts(historyLine, this.terminal.cols);
      
      for (const part of parts) {
        lines.push(part);
      }
    }

    for (const line of lines) {
      this.terminal.writeln(line);
    }

    this.terminal.refresh(0, lines.length);
  }

  private insertKey(character: string): void {
    const promptOffsetX = this.prompt.length;
    const cursorX = this.terminal.buffer.active.cursorX;
    const lineX = cursorX - promptOffsetX;

    const currentLineY = this.terminal.buffer.active.length - this.terminal.buffer.active.baseY;

    if (lineX === this.line.length) {
      this.line += character;
    } else {
      
      const start = this.line.slice(0, lineX);
      const end = this.line.slice(lineX);

      this.line = start + character + end;
    }

    this.write();
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
    this.fullRender();
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