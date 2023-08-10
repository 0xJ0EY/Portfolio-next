import { DirectoryEntry, FileSystem, FileSystemNode } from '@/apis/FileSystem/FileSystem';
import { useState, useRef, useEffect, RefObject } from 'react';
import { SystemAPIs } from '../Desktop';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';

const DesktopIcon = dynamic(() => import('../Icons/DesktopIcon'));

interface SelectionBox {
  open: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
}

function SelectionBox(box: SelectionBox) {
  if (!box.open) {
    return <>closed</>
  }

  return <div className={styles.selectionBox} style={{width: box.width, height: box.height, top: box.y, left: box.x}}></div>
}

type Props = {
  directory: string,
  apis: SystemAPIs
}

export default function FolderView({ directory, apis }: Props) {
  const fs = apis.fileSystem;

  const [files, setFiles] = useState<DirectoryEntry[]>([]);
  const ref: RefObject<HTMLDivElement> = useRef(null);
  const start = useRef({x: 0, y: 0});
  const [box, setBox] = useState<SelectionBox>({ open: false, x: 0, y: 0, width: 0, height: 0 });

  function getLocalCoordinates(evt: PointerEvent) {
    const dimensions = ref.current!.getBoundingClientRect();

    const localX = evt.clientX - dimensions.left;
    const localY = evt.clientY - dimensions.top;

    return { x: localX, y: localY};
  }

  function openSelectionBox(evt: PointerEvent) {
    start.current = getLocalCoordinates(evt);

    window.addEventListener('pointermove', moveSelectionBox);
    window.addEventListener('pointerup', closeSelectionBox);
  }

  function moveSelectionBox(evt: PointerEvent) {
    const origin = start.current;
    const current = getLocalCoordinates(evt);

    const topLeftPoint = { x: Math.min(origin.x, current.x), y: Math.min(origin.y, current.y) };
    const bottomRightPoint = { x: Math.max(origin.x, current.x), y: Math.max(origin.y, current.y) };

    const x = topLeftPoint.x;
    const y = topLeftPoint.y;

    const width = bottomRightPoint.x - topLeftPoint.x;
    const height = bottomRightPoint.y - topLeftPoint.y;

    setBox({ open: true, x, y, width, height });
  }

  function closeSelectionBox(evt: PointerEvent) {
    const localBox = box;
    localBox.open = false;
    setBox(localBox);

    window.removeEventListener('pointermove', moveSelectionBox);
    window.removeEventListener('pointerup', closeSelectionBox);
  }

  function loadFiles(directory: string) {
    // TODO: Add something like a subscription for directory changes
    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return; }
    
    setFiles(dir.value.children);
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const folder = ref.current;

    console.log(folder);

    folder.addEventListener('pointerdown', openSelectionBox);

    loadFiles(directory)
    
    return () => {
      folder.removeEventListener('pointerdown', openSelectionBox);
    };
  }, []);

  const icons = files.map((x, index) => <DesktopIcon key={index} entry={x} apis={apis} />);

  const selectionBox = SelectionBox(box);
  
  return <>
    <div ref={ref} className={styles.folder}>{icons}</div>
    { selectionBox }
  </>
}