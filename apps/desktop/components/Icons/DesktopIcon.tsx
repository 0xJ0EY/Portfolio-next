import Image from 'next/image';
import { useState } from 'react';
import styles from '@/components/Icons/DesktopIcon.module.css';
import { DirectoryEntry } from '@/apis/FileSystem/FileSystem';
import { Rectangle } from '@/applications/math';

export const IconWidth    = 120;
export const IconHeight   = 80;

export const ImageHeight  = 60;
export const ImageWidth   = 60;

export const TextWidth    = 120;
export const TextHeight   = 20;

export function DesktopIconHitBox(entry: DesktopIconEntry): Rectangle[] {
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

function EditTitle(props: { entry: DesktopIconEntry }) {
  const { entry } = props;

  const [editText, setEditText] = useState(entry.editing.value);

  function onChange(value: string) {
    setEditText(value);
    entry.editing.value = value;
  }

  return <input type='input' value={editText} onChange={evt => onChange(evt.target.value)}/>
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

function calculateZIndex(entry: DesktopIconEntry, index: number): number {
  let result = entry.dragging ? 100_000 : 0;
  
  result += index;

  return result;
}

export type DesktopIconEntry = {
  entry: DirectoryEntry,
  x: number,
  y: number
  selected: boolean,
  dragging: boolean,
  editing: { active: boolean, value: string }
}

export default function DesktopIcon(props: { desktopIconEntry: DesktopIconEntry, index: number }) {
  const { desktopIconEntry, index } = props;
  const entry = desktopIconEntry.entry;
  const file = entry.node;

  const selected = desktopIconEntry.selected ? styles.selected : '';

  const title = desktopIconEntry.editing.active ? <EditTitle entry={desktopIconEntry}/> : <RenderTitle title={file.name}/>;

  return <>
    <div className={file.kind + " " + styles.container + ' ' + selected} style={{
      top: `${desktopIconEntry.y}px`,
      left: `${desktopIconEntry.x}px`,
      zIndex: calculateZIndex(desktopIconEntry, index)
    }}>
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
        {title}
      </div>
    </div>
  </>
}
