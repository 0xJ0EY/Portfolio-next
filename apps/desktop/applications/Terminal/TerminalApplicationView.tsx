import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';

export interface PseudoTerminal {
  activeTerminal(): Terminal;
  write(input: string): void;
  writeln(input: string): void;
}

class TerminalManager {
  private prompt = "$ ";

  private lines: string[] = [
    "foobar",
    "barfoo"
  ];
  private line: string = "";

  private resizeObserver: ResizeObserver | null = null;

  constructor(private terminal: Terminal, private domElement: HTMLElement) {}

  private write() {
    this.terminal.write(`\r${this.prompt}${this.line}`);
  }
  
  private draw() {
    this.terminal.buffer.active.baseY;



  }


  private insertKey(character: string): void {
    const promptOffsetX = this.prompt.length;
    const cursorX = this.terminal.buffer.active.cursorX;

    const lineX = cursorX - promptOffsetX;

    if (lineX === this.line.length) {
      this.line += character;
    } else {      
      const start = this.line.slice(0, lineX);
      const end = this.line.slice(lineX);

      console.log(start, end);

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