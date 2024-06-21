import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';

export default function TerminalApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!terminalRef.current) { return; }

    const terminal = new Terminal();

    terminal.open(terminalRef.current);

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

    return () => { 
      observer.disconnect();
      terminal.dispose();
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