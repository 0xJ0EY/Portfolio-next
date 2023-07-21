import { WindowContext } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState, useRef, RefObject } from 'react';
import { Application } from './ApplicationManager';
import { FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragEvent, FileSystemItemDragLeave } from '@/events/Dragging';

export default function AboutApplicationView(props: { application: Application, windowContext: WindowContext }) {
  const { application, windowContext } = props;
  const [number, setNumber] = useState(0);

  const ref: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => { 
    if (!ref.current) { return; }
    const node = ref.current;

    function onFileEnter(evt: FileSystemItemDragEvent) {
      console.log('enter');
    }

    function onFileLeave(evt: FileSystemItemDragEvent) {
      console.log('leave');
    }

    function onFileDrop(evt: FileSystemItemDragEvent) {
      console.log('drop');
    }

    node.addEventListener(FileSystemItemDragEnter, onFileEnter as EventListener);
    node.addEventListener(FileSystemItemDragLeave, onFileLeave as EventListener);
    node.addEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);

    return () => { }
  }, []);

  return (
    <div data-drop-point="true" ref={ref}>
      <button onClick={() => {setNumber(number - 1)}}>-</button>
      {number}
      <button onClick={() => {setNumber(number + 1)}}>+</button>
      <button onClick={() => application.on({ kind: 'application-quit' }, windowContext)}>Send event</button>
    </div>
  )
}