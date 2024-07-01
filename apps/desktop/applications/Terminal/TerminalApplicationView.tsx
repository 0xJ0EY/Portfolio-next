import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { TerminalManager } from './TerminalManager';

export interface TerminalConnector {
  clear(): void;
  writeResponse(response: string): void;
  writeResponseLines(lines: string[]): void;
}

export default function TerminalApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!terminalRef.current) { return; }

    const terminal = new Terminal();
    const manager = new TerminalManager(terminal, terminalRef.current, application.manager, application.apis);

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