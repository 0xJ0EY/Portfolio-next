import { FileDragWrapper } from '@/apis/DragAndDrop/DragWrapper';
import { SystemAPIs } from '../Desktop';
import Image from 'next/image';
import styles from '@/components/Icons/DesktopIcon.module.css';

function RenderTitle(props: { title: string }) {
  const { title } = props;

  const size = 14;
  const maxLines = 2;

  const chunks = Math.ceil(title.length / size);
  const lines = new Array(Math.min(chunks, maxLines));

  for (let i = 0, d = 0; i < Math.min(chunks, maxLines); i++, d += size) {
    lines[i] = title.substring(d, d + size);
  }
  
  // If we have more then {maxLines} lines, we add ellipses to the last line
  if (chunks > maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].substring(0, size - 3) + '...';
  }

  const elements = lines.map((x, index) => <span className={styles.titleLine} key={index}>{x}</span>);
  return <div className={styles.title}>{ elements }</div>
}

export default function DesktopIcon(props: { apis: SystemAPIs }) {
  const { apis } = props; 

  const dir = apis.fileSystem.getDirectory('/Users/joey/Desktop/foo');
  if (!dir.ok) { return <></> };

  const file = dir.value;
  return <>
    <div className={file.kind + " " + styles.container}>
      <div className={styles.imageContainer}>
        <div className={styles.imageContainerInner}>
          <FileDragWrapper file={file} dragAndDrop={apis.dragAndDrop}>
            <Image
              draggable="false"
              className={styles.image}
              src="/icons/folder-icon.png"
              alt='folder icon'
              width={60}
              height={60}
              />
          </FileDragWrapper>
        </div>
      </div>

      <div className={styles.textContainer}>
        <FileDragWrapper file={file} dragAndDrop={apis.dragAndDrop}>
          <RenderTitle title={file.name}/>
        </FileDragWrapper>
      </div>
    </div>
  </>
}
