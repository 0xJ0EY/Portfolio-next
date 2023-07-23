import { useEffect, useRef, RefObject, ReactNode, MutableRefObject } from 'react';
import { DragAndDropService, DragAndDropSession, FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragLeave } from './DragAndDrop';
import { FileSystemNode } from '@/apis/FileSystem/FileSystem';

type Props = {
  children: ReactNode,
  file: FileSystemNode,
  dragAndDrop: DragAndDropService,
  onClick?: (FileSystemItemDragDrop: number) => void,
}

const DraggingThreshold = 5;

export function FileDragWrapper({ children, file, dragAndDrop, onClick}: Props) {
  const ref: RefObject<HTMLDivElement> = useRef(null);

  const origin = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const currentNode: MutableRefObject<Element | undefined> = useRef();
  const dragSession: MutableRefObject<DragAndDropSession | null> = useRef(null);

  function onPointerDown(evt: PointerEvent) {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    if (onClick) { onClick(file.id); }

    origin.current = { x: evt.clientX, y: evt.clientY };
  }

  function onPointerMove(evt: PointerEvent) {
    const deltaX = Math.abs(origin.current.x - evt.clientX);
    const deltaY = Math.abs(origin.current.y - evt.clientY);

    if (deltaX > DraggingThreshold || deltaY > DraggingThreshold) {
      isDragging.current = true;

      // Propagate drag start event
      dragSession.current = dragAndDrop.start(file, evt.clientX, evt.clientY);
    }

    if (isDragging.current && dragSession.current) {
      // Propagate drag move event
      dragSession.current.move(evt.clientX, evt.clientY);

      // Get the current target element
      const elements = document.elementsFromPoint(evt.clientX, evt.clientY);
      const dropPoint = elements.find(x => x.hasAttribute("data-drop-point"));

      if (dropPoint !== currentNode.current) {
        const enterEvent = new CustomEvent(FileSystemItemDragEnter, { detail: { node: file }, bubbles: false }); 
        const leaveEvent = new CustomEvent(FileSystemItemDragLeave, { detail: { node: file }, bubbles: false }); 

        currentNode.current?.dispatchEvent(leaveEvent);
        dropPoint?.dispatchEvent(enterEvent);

        currentNode.current = dropPoint;
      }
    }
  }

  function onPointerUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    if (currentNode.current) {
      const dropEvent = new CustomEvent(FileSystemItemDragDrop, { detail: { node: file }, bubbles: false });

      currentNode.current.dispatchEvent(dropEvent)
    }

    dragSession.current?.drop(evt.clientX, evt.clientY);
    dragSession.current = null;
    currentNode.current = undefined;

    isDragging.current = false;
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const node = ref.current;

    node.addEventListener('pointerdown', onPointerDown);

    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
    }    
  }, []);

  return <>
  <div ref={ref} className='drag-and-drop-wrapper'>
    {children}
  </div>
  </>
}
