import { SystemAPIs } from '../Desktop';
import Image from 'next/image';
import styles from '@/components/Icons/DesktopIcon.module.css';
import { DirectoryEntry } from '@/apis/FileSystem/FileSystem';
import { Rectangle } from '@/applications/math';

export const IconWidth    = 120;
export const IconHeight   = 80;

export const ImageHeight  = 60;
export const ImageWidth   = 60;

export const TextWidth    = 120;
export const TextHeight   = 20;

export function DesktopIconHitBox(entry: DirectoryEntry): Rectangle[] {
  // TODO: Resize text hitbox based on the content

  const imageHorizontalCenter = IconWidth / 2;

  const image: Rectangle = {
    x1: entry.x + (imageHorizontalCenter - (ImageWidth / 2)),
    x2: entry.x + (imageHorizontalCenter + (ImageWidth / 2)),
    y1: entry.y,
    y2: entry.y + ImageHeight
  };

  const text: Rectangle = {
    x1: entry.x,
    x2: entry.x + IconWidth,
    y1: entry.y + (IconHeight - TextHeight),
    y2: entry.y + IconHeight
  };

  return [image, text];
}

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

export default function DesktopIcon(props: { entry: DirectoryEntry,  index: number }) {
  const { entry, index } = props;
  const file = entry.node;

  return <>
    <div className={file.kind + " " + styles.container} style={{top: `${entry.y}px`, left: `${entry.x}px`, zIndex: index}}>
      <div className={styles.imageContainer}>
        <div className={styles.imageContainerInner}>
          <Image
            draggable="false"
            className={styles.image}
            src="/icons/folder-icon.png"
            alt='folder icon'
            width={ImageWidth}
            height={ImageHeight}
            />
        </div>
      </div>

      <div className={styles.textContainer}>
        <RenderTitle title={file.name}/>
      </div>
    </div>
  </>
}
