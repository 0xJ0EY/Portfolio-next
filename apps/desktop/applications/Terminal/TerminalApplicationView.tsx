import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { TerminalManager } from './TerminalManager';

export interface TerminalConnector {
  clear(): void;
  writeResponse(response: string): void;
  writeResponseLines(lines: string[]): void;

  resetResponseLines(): void;
  getResponseLines(): string[];
  
  enableOutput(): void;
  disableOutput(): void;
}

export default function TerminalApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const terminal = useRef<Terminal | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  function onWindowFocus() {
    if (loaded && terminal.current) {
      terminal.current.focus();
    }
  }
  
  useEffect(() => {
    if (!terminalRef.current) { return; }

    terminal.current = new Terminal();
    const manager = new TerminalManager(
      terminal.current,
      terminalRef.current,
      application.manager,
      application.apis
    );

    manager.bind();

    const unsubscribe = application.compositor.subscribeWithFilter(
      windowContext.id,
      (evt) => evt.event === 'focus_window',
      onWindowFocus
    );

    setLoaded(true);

    return () => {
      manager.dispose();
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (loaded && terminal.current) {
      terminal.current.focus();
    }
  }, [loaded]);

  // I think loading a style sheet like this is illegal according to the HTML spec
  // But the browsers accept it anyway :ˆ)
  return (
    <>
      <link rel="stylesheet" href="/xterm/xterm.css"/>
      <div ref={terminalRef} style={{ height: '100%', width: '100%', background: '#000' }}></div>
    </>
  )
} 