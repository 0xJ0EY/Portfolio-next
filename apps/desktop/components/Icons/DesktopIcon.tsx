import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import styles from '@/components/Icons/DesktopIcon.module.css';
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
      className={styles.editInput}
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
  editing: { active: boolean, value: string, onSave?: () => void }
}

export default function DesktopIcon(props: { desktopIconEntry: DesktopIconEntry, index: number }) {
  const { desktopIconEntry, index } = props;
  const entry = desktopIconEntry.entry;
  const file = entry.node;

  const selected = desktopIconEntry.selected ? styles.selected : '';
  const title = desktopIconEntry.editing.active ? <EditTitle entry={desktopIconEntry}/> : <RenderTitle title={file.name}/>;
  const icon = getIconFromNode(entry.node);

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
