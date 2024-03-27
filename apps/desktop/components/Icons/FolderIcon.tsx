import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import styles from '@/components/Icons/FolderIcon.module.css';
import { DirectoryEntry, getIconFromNode } from '@/apis/FileSystem/FileSystem';
import { Rectangle } from '@/applications/math';

export const IconWidth    = 120;
export const IconHeight   = 80;

export const ImageHeight  = 60;
export const ImageWidth   = 60;

export const TextWidth    = 120;
export const TextHeight   = 20;

export const CharactersPerLine = 14;
export const MaximumLines = 2;

export function FolderIconHitBox(iconEntry: FolderIconEntry): Rectangle[] {
  const title = iconEntry.entry.node.name + iconEntry.entry.node.filenameExtension;
  const lines = contentAwareSplitTitle(CharactersPerLine, MaximumLines, title);

  const imageHorizontalCenter = IconWidth / 2;

  const image: Rectangle = {
    x1: iconEntry.x + (imageHorizontalCenter - (ImageWidth / 2)),
    x2: iconEntry.x + (imageHorizontalCenter + (ImageWidth / 2)),
    y1: iconEntry.y,
    y2: iconEntry.y + ImageHeight
  };

  const text: Rectangle = {
    x1: iconEntry.x,
    x2: iconEntry.x + IconWidth,
    y1: iconEntry.y + ImageHeight,
    y2: iconEntry.y + ImageHeight + (TextHeight * lines.length),
  };

  return [image, text];
}

function EditTitle(props: { entry: FolderIconEntry }) {
  const { entry } = props;

  const ref = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.editing.value);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [isEditing])

  useEffect(() => {
    setIsEditing(true);
  }, []);

  function onChange(value: string) {
    setEditText(value);
    entry.editing.value = value;
  }

  function onSave() {
    if (entry.editing.onSave) {
      entry.editing.onSave();
    }
  }

  return (
    <input
      className={['system-text-input', styles.editInput].join(' ')}
      ref={ref}
      type='input'
      value={editText}
      onChange={evt => onChange(evt.target.value)}
      onKeyDown={evt => evt.key === 'Enter' && onSave() }
    />
  )
}


function chunkString(lineLength: number, value: string): string[] {
  const chunks = Math.ceil(value.length / lineLength);
  const lines = new Array(chunks);

  for (let i = 0, d = 0; i < chunks; i++, d += lineLength) {
    lines[i] = value.substring(d, d + lineLength);
  }

  return lines;
}

function contentAwareSplitTitle(lineLength: number, maxLines: number, title: string): string[] {
  let chunks = title.split(' ');
  let lines: string[] = [];
  let line = "";

  function limitLineOutput(lines: string[]): string[] {
    if (lines.length > maxLines) {
      const lastLine = lines[maxLines - 1];
      lines[maxLines - 1] = lastLine.substring(0, lastLine.length - 3) + '...';
      lines.length = 2;
    }

    return lines;
  }

  function appendChunk(chunk: string) {
    const prependSpace  = line.length !== 0;
    const fitsInLine    = line.length + chunk.length + (prependSpace ? 1 : 0) <= lineLength;

    if (fitsInLine) {
      line += (prependSpace ? ' ' : '') + chunk;

    } else {
      lines.push(line);
      line = chunk;
    }
  }

  for (const chunk of chunks) {
    if (chunk.length === 0) { continue; }
    const tooBigForLine = chunk.length >= lineLength;

    if (tooBigForLine) {
      const parts = chunkString(lineLength, chunk);
      parts.forEach(x => appendChunk(x));

    } else {
      appendChunk(chunk);
    }
  }

  lines.push(line);

  return limitLineOutput(lines);
}

function RenderTitle(props: { title: string }) {
  const { title } = props;
  const lines = contentAwareSplitTitle(CharactersPerLine, MaximumLines, title);

  const elements = lines.map((x, index) => {
    if (x.length === 0) {
      return <span className={styles.titleLine} key={index}>&nbsp;</span>
    }

    return <span className={styles.titleLine} key={index}>{x}</span>
  });
  return <div className={styles.title}>{ elements }</div>
}

function calculateZIndex(entry: FolderIconEntry, index: number): number {
  let result = entry.dragging ? 100_000 : 0;
  
  result += index;

  return result;
}

export type FolderIconEntry = {
  entry: DirectoryEntry,
  x: number,
  y: number
  selected: boolean,
  dragging: boolean,
  editing: { active: boolean, value: string, onSave?: () => void }
}

export default function FolderIcon(props: { folderIconEntry: FolderIconEntry, index: number }) {
  const { folderIconEntry: folderIconEntry, index } = props;
  const entry = folderIconEntry.entry;
  const file = entry.node;

  const selected = folderIconEntry.selected ? styles.selected : '';
  const title = folderIconEntry.editing.active ? <EditTitle entry={folderIconEntry}/> : <RenderTitle title={file.name + file.filenameExtension}/>;
  const icon = getIconFromNode(entry.node);

  return <>
    <div className={file.kind + " " + styles.container + ' ' + selected} style={{
      top: `${folderIconEntry.y}px`,
      left: `${folderIconEntry.x}px`,
      zIndex: calculateZIndex(folderIconEntry, index)
    }}>
      <div className={styles.imageContainer}>
        <div className={styles.imageContainerInner}>
          <Image
            quality={100}
            draggable="false"
            className={styles.image}
            src={icon.src}
            alt={icon.alt}
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
