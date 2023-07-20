import { useEffect, useRef, RefObject, ReactNode } from 'react';

type Props = {
  children: ReactNode
}

const DraggingThreshold = 5;

export function FileDragWrapper({children}: Props) {
  const ref: RefObject<HTMLDivElement> = useRef(null);

  const origin = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  function onPointerDown(evt: PointerEvent) {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    origin.current = { x: evt.clientX, y: evt.clientY };
  }

  function onPointerMove(evt: PointerEvent) {
    const deltaX = Math.abs(origin.current.x - evt.clientX);
    const deltaY = Math.abs(origin.current.y - evt.clientY);

    if (deltaX > DraggingThreshold || deltaY > DraggingThreshold) {
      isDragging.current = true;
      // Propagate drag start event
    }

    if (isDragging.current) {
      // Propagate drag move event
    }
  }

  function onPointerUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

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
  <div ref={ref} className='wrapper'>
    {children}
  </div>
  </>
}
