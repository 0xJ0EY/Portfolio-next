import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';

export default function TerminalApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    if (!terminalRef.current) { return; }

    const terminal = new Terminal();
    terminal.open(terminalRef.current);

    return () => { 
      
    }
  }, []);

  // I think loading a style sheet like this is illegal according to the HTML spec
  // But the browsers accept it anyway :ˆ)
  return (
    <>
      <link rel="stylesheet" href="/xterm/xterm.css"/>
      <div ref={terminalRef}></div>
    </>
  )
} 