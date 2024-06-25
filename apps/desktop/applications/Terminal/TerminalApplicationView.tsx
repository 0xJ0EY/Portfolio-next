import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { cursorHide, cursorShow, cursorTo } from 'ansi-escapes';

export interface TerminalConnector {
  writeResponse(response: string): void;
  writeResponseLines(lines: string[]): void;
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

class TerminalManager implements TerminalConnector {
  private ps1 = "$ ";
  
  private prompt: string = "";

  private promptLines: number = 1;
  private actualPromptLines: number = 1;

  private promptLine: number = 0;
  private promptPosition: number = 0;

  private resizeObserver: ResizeObserver | null = null;

  constructor(private terminal: Terminal, private domElement: HTMLElement) {}

  public writeln(line: string): void {
    this.terminal.write(`${line}\r\n`);
  }

  private coordsInPrompt(index: number): { x: number, y: number } {
    index += this.ps1.length;

    const x = index % this.terminal.cols;
    const y = Math.floor(index / this.terminal.cols);

    return { x, y: y + this.promptLine }
  }

  private updatePrompt(): void {
    this.hideCursor();
    this.writePrompt();
    this.updateCursor();
    this.showCursor();
  }

  public writeResponse(response: string): void {
    this.hideCursor();

    this.write(response);
    this.newLine();

    this.showCursor(); 
  }

  public writeResponseLines(lines: string[]): void {
    this.hideCursor();

    for (const line of lines) {
      this.write(line);
      this.newLine();
    }

    this.showCursor(); 
  }

  private writePrompt(): void {
    const completePrompt = `\r${this.ps1}${this.prompt}`;
    this.write(completePrompt);
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
    this.terminal.write(cursorTo(0, y) + content + ' ');
  }

  private newLine(): void {
    this.promptLine += this.actualPromptLines;
    this.prompt = "";
    this.promptLines = 1;
    this.promptPosition = 0;
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

  private insertEnter(): void {
    const command = this.prompt;

    this.newLine();

    {
      console.log(command);
      this.writeResponseLines(['foo', 'bar']);
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

  private insertKey(character: string): void {
    if (this.promptPosition === this.prompt.length) {
      this.prompt += character;

      this.promptPosition++;

      this.updatePrompt();
    } else {
      const begin = this.prompt.slice(0, this.promptPosition);
      const end = this.prompt.slice(this.promptPosition);

      this.prompt = begin + character + end;

      this.promptPosition++;

      this.updatePrompt();
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

    this.writePrompt();
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