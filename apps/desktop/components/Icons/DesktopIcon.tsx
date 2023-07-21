import { FileDragWrapper } from '@/events/DragWrapper';
import { SystemAPIs } from '../Desktop';

export default function DesktopIcon(props: { apis: SystemAPIs }) {
  const { apis } = props; 

  const dir = apis.fileSystem.getDirectory('/home/joey/Desktop');
  if (!dir.ok) { return <></> };

  const node = dir.value;
  
  return <>
    <FileDragWrapper file={node} dragAndDrop={apis.dragAndDrop}>
      <div>
        <h1>foobar</h1>
      </div>
    </FileDragWrapper>
  </>
}
