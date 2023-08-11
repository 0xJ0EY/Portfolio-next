import { DirectoryEntry } from '@/apis/FileSystem/FileSystem';
import { useState, useRef, useEffect, RefObject } from 'react';
import { SystemAPIs } from '../Desktop';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';
import { DesktopIconHitBox } from '../Icons/DesktopIcon';
import { Rectangle, pointInsideAnyRectangles, rectangleAnyIntersection } from '@/applications/math';
import { Chain } from '../../data/Chain';

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
  const localFiles = useRef<Chain<DirectoryEntry>>(new Chain());

  function updateFiles(files: Chain<DirectoryEntry>) {
    localFiles.current = files;
    setFiles(files.toArray());
  } 

  const ref: RefObject<HTMLDivElement> = useRef(null);

  const selectionBoxStart = useRef({x: 0, y: 0});
  const [box, setBox] = useState<SelectionBox>({ open: false, x: 0, y: 0, width: 0, height: 0 });

  function getLocalCoordinates(evt: PointerEvent) {
    const dimensions = ref.current!.getBoundingClientRect();

    const localX = evt.clientX - dimensions.left;
    const localY = evt.clientY - dimensions.top;

    return { x: localX, y: localY};
  }

  function selectFile(evt: PointerEvent) {
    const files = localFiles.current;
    const point = getLocalCoordinates(evt);

    let hasSelected = false;

    for (let file of files.iterFromHead()) {
      const hitBox = DesktopIconHitBox(file);

      const selected = pointInsideAnyRectangles(point, hitBox);
      const toggleSelected = selected && !hasSelected;

      file.selected = toggleSelected
      if (toggleSelected) { hasSelected = true; }
    }

    updateFiles(files);
  }

  function selectFiles(evt: PointerEvent) {
    const files = localFiles.current;
    const origin = selectionBoxStart.current;
    const current = getLocalCoordinates(evt);
    
    const topLeftPoint = { x: Math.min(origin.x, current.x), y: Math.min(origin.y, current.y) };
    const bottomRightPoint = { x: Math.max(origin.x, current.x), y: Math.max(origin.y, current.y) };

    const selectionRect: Rectangle = {
      x1: topLeftPoint.x,
      x2: bottomRightPoint.x,
      y1: topLeftPoint.y,
      y2: bottomRightPoint.y
    };

    for (let file of files.iterFromHead()) {
      const hitBox = DesktopIconHitBox(file);
      file.selected = rectangleAnyIntersection(selectionRect, hitBox);
    }

    updateFiles(files);
  }

  function hasClickedFile(evt: PointerEvent): DirectoryEntry | null {
    const point = getLocalCoordinates(evt);
    const files = localFiles.current;

    for (const file of files.iterFromTail()) {
      const hitBox = DesktopIconHitBox(file);

      if (pointInsideAnyRectangles(point, hitBox)) {
        return file;
      }
    }

    return null;
  }

  function onPointerDown(evt: PointerEvent) {
    const clickedFile = hasClickedFile(evt);

    if (clickedFile) {
      if (!clickedFile.selected) {
        selectFile(evt);
      }

      // TODO: Implement open logic & drag logic

    } else {
      openSelectionBox(evt);
    }
  }

  function openSelectionBox(evt: PointerEvent) {
    selectionBoxStart.current = getLocalCoordinates(evt);

    window.addEventListener('pointermove', moveSelectionBox);
    window.addEventListener('pointerup', closeSelectionBox);
  }

  function moveSelectionBox(evt: PointerEvent) {
    const origin = selectionBoxStart.current;
    const current = getLocalCoordinates(evt);

    const topLeftPoint = { x: Math.min(origin.x, current.x), y: Math.min(origin.y, current.y) };
    const bottomRightPoint = { x: Math.max(origin.x, current.x), y: Math.max(origin.y, current.y) };

    const x = topLeftPoint.x;
    const y = topLeftPoint.y;

    const width = bottomRightPoint.x - topLeftPoint.x;
    const height = bottomRightPoint.y - topLeftPoint.y;

    setBox({ open: true, x, y, width, height });

    selectFiles(evt);
  }

  function closeSelectionBox(evt: PointerEvent) {
    function closeBox() {
      const localBox = box;
      localBox.open = false;
      setBox(localBox);
  
      window.removeEventListener('pointermove', moveSelectionBox);
      window.removeEventListener('pointerup', closeSelectionBox);
    }

    selectFiles(evt);
    closeBox();
  }

  function loadFiles(directory: string) {
    // TODO: Add something like a subscription for directory changes
    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return; }

    updateFiles(dir.value.children);
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const folder = ref.current;

    folder.addEventListener('pointerdown', onPointerDown);
    
    return () => {
      folder.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => { loadFiles(directory); }, [directory]);

  const icons = files.map((entry, index) => <DesktopIcon key={index} entry={entry} apis={apis} />);

  const selectionBox = SelectionBox(box);
  
  return <>
    <div ref={ref} className={styles.folder}>{icons}</div>
    { selectionBox }
  </>
}