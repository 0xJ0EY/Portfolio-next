import { FileDragWrapper } from '@/events/DragWrapper';
import { useEffect, useRef, RefObject } from 'react';

export default function DesktopIcon(props: any) {
  const ref: RefObject<HTMLDivElement> = useRef(null);

  function onDrag() {
    console.log('drag');
  };


  useEffect(() => {
    if (!ref.current) { return; }
    const node = ref.current;

    node.addEventListener('drag', onDrag);

    return () => {
      node.removeEventListener('drag', onDrag);
    }

  }, []);
  
  return <>
    <FileDragWrapper>
      <div ref={ref}>
        <h1>foobar</h1>
      </div>
    </FileDragWrapper>
  </>
}
