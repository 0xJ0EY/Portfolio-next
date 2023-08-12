import { DirectoryEntry } from '@/apis/FileSystem/FileSystem';
import { useState, useRef, useEffect, RefObject, MutableRefObject } from 'react';
import { SystemAPIs } from '../Desktop';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';
import { DesktopIconHitBox } from '../Icons/DesktopIcon';
import { Rectangle, pointInsideAnyRectangles, rectangleAnyIntersection } from '@/applications/math';
import { Chain } from '../../data/Chain';
import { DragAndDropSession, FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragLeave } from '@/apis/DragAndDrop/DragAndDrop';

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

const DraggingThreshold = 5;

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

  const dragAndDrop = apis.dragAndDrop;

  const selectionBoxStart = useRef({ x: 0, y: 0 });
  const fileDraggingOrigin = useRef({ x: 0, y: 0 });
  const activeFile = useRef<DirectoryEntry>();

  const isDragging = useRef(false);
  const fileDraggingCurrentNode: MutableRefObject<Element | undefined> = useRef();
  const fileDraggingSession: MutableRefObject<DragAndDropSession | null> = useRef(null);

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

  function clickedFile(evt: PointerEvent): DirectoryEntry | undefined {
    const point = getLocalCoordinates(evt);
    const files = localFiles.current;

    for (const file of files.iterFromTail()) {
      const hitBox = DesktopIconHitBox(file);

      if (pointInsideAnyRectangles(point, hitBox)) {
        return file;
      }
    }

    return undefined;
  }

  function onFileDraggingStart(evt: PointerEvent) {
    window.addEventListener('pointermove', onFileDraggingMove);
    window.addEventListener('pointerup', onFileDraggingUp);
    
    fileDraggingOrigin.current = { x: evt.clientX, y: evt.clientY };
  }

  function onFileDraggingMove(evt: PointerEvent) {
    const file = activeFile.current?.node;
    if (!file) { return; }

    const deltaX = Math.abs(fileDraggingOrigin.current.x - evt.clientX);
    const deltaY = Math.abs(fileDraggingOrigin.current.y - evt.clientY);

    if (deltaX > DraggingThreshold || deltaY > DraggingThreshold) {
      isDragging.current = true;

      // Propagate drag start event
      fileDraggingSession.current = dragAndDrop.start(file, evt.clientX, evt.clientY);
    }

    if (isDragging.current && fileDraggingSession.current) {
      // Propagate drag move event
      fileDraggingSession.current.move(evt.clientX, evt.clientY);

      // Get the current target element
      const elements = document.elementsFromPoint(evt.clientX, evt.clientY);
      const dropPoint = elements.find(x => x.hasAttribute("data-drop-point"));

      if (dropPoint !== fileDraggingCurrentNode.current) {
        const enterEvent = new CustomEvent(FileSystemItemDragEnter, { detail: { node: file }, bubbles: false }); 
        const leaveEvent = new CustomEvent(FileSystemItemDragLeave, { detail: { node: file }, bubbles: false }); 

        fileDraggingCurrentNode.current?.dispatchEvent(leaveEvent);
        dropPoint?.dispatchEvent(enterEvent);

        fileDraggingCurrentNode.current = dropPoint;
      }
    }
  }

  function onFileDraggingUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onFileDraggingMove);
    window.removeEventListener('pointerup', onFileDraggingUp);

    const file = activeFile.current?.node;
    if (!file) { return; }

    if (fileDraggingCurrentNode.current) {
      const dropEvent = new CustomEvent(FileSystemItemDragDrop, { detail: { node: file }, bubbles: false });

      fileDraggingCurrentNode.current.dispatchEvent(dropEvent)
    }

    fileDraggingSession.current?.drop(evt.clientX, evt.clientY);
    fileDraggingSession.current = null;
    fileDraggingCurrentNode.current = undefined;

    isDragging.current = false;
  }

  function onPointerDown(evt: PointerEvent) {
    const file = clickedFile(evt);

    activeFile.current = file;

    if (file) {
      if (!file.selected) { selectFile(evt); }

      onFileDraggingStart(evt);
      // TODO: Implement open logic

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