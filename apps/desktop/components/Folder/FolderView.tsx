import { DirectoryEntry } from '@/apis/FileSystem/FileSystem';
import { useState, useRef, useEffect, RefObject, MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';
import { DesktopIconHitBox, IconHeight, IconWidth } from '../Icons/DesktopIcon';
import { Point, Rectangle, pointInsideAnyRectangles, rectangleAnyIntersection } from '@/applications/math';
import { Chain } from '../../data/Chain';
import { DragAndDropSession, FileSystemItemDragData, FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragEvent, FileSystemItemDragLeave, FileSystemItemDragMove } from '@/apis/DragAndDrop/DragAndDrop';
import { clamp } from '../util';
import { SystemAPIs } from '../OperatingSystem';

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
    return <></>
  }

  return <div className={styles.selectionBox} style={{width: box.width, height: box.height, top: box.y, left: box.x}}></div>
}

const DraggingThreshold = 5;

type Props = {
  directory: string,
  apis: SystemAPIs,
  onFileOpen: (file: DirectoryEntry) => void
}

export default function FolderView({ directory, apis, onFileOpen }: Props) {
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

  const isDragging = useRef(false);
  const previousClickedFile = useRef<{ file: DirectoryEntry | null, timestamp: number }>({ file: null, timestamp: 0 });

  const fileDraggingOrigin = useRef({ x: 0, y: 0 });
  const fileDraggingFolderOrigin = useRef<Point>();

  const fileDraggingSelection  = useRef<DirectoryEntry[]>([]);
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

    for (let node of files.iterFromHead()) {
      const file = node.value;
      const hitBox = DesktopIconHitBox(file);

      const selected = pointInsideAnyRectangles(point, hitBox);
      const toggleSelected = selected && !hasSelected;

      file.selected = toggleSelected;
      
      if (toggleSelected) {
        files.moveToHead(node);
        hasSelected = true;
      }
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

    for (let node of files.iterFromHead()) {
      const file = node.value; 
      const hitBox = DesktopIconHitBox(file);
      file.selected = rectangleAnyIntersection(selectionRect, hitBox);
    }

    updateFiles(files);
  }

  function clickedFile(evt: PointerEvent): DirectoryEntry | undefined {
    const point = getLocalCoordinates(evt);
    const files = localFiles.current;

    for (const node of files.iterFromTail()) {
      const file = node.value;
      const hitBox = DesktopIconHitBox(file);

      if (pointInsideAnyRectangles(point, hitBox)) {
        return node.value;
      }
    }

    return undefined;
  }

  function onFileDraggingStart(evt: PointerEvent) {
    const files = localFiles.current;
    window.addEventListener('pointermove', onFileDraggingMove);
    window.addEventListener('pointerup', onFileDraggingUp);

    const selectedFiles: DirectoryEntry[] = [];

    for (const node of files.iterFromTail()) {
      const file = node.value;

      if (file.selected) { selectedFiles.push(file); }
    }

    fileDraggingSelection.current = selectedFiles;
    fileDraggingOrigin.current = { x: evt.clientX, y: evt.clientY };
  }

  function onFileDraggingMove(evt: PointerEvent) {
    const deltaX = Math.abs(fileDraggingOrigin.current.x - evt.clientX);
    const deltaY = Math.abs(fileDraggingOrigin.current.y - evt.clientY);

    const origin = fileDraggingFolderOrigin.current;

    if (!origin) { return; }

    const data: FileSystemItemDragData = {
      nodes: fileDraggingSelection.current.map(entry => {
        const offset = {
          x: origin.x - entry.x,
          y: origin.y - entry.y,
        };

        return { item: entry.node, position: { x: 0, y: 0}, offset };
      })
    };

    const passesDraggingThreshold = deltaX > DraggingThreshold || deltaY > DraggingThreshold;

    if (passesDraggingThreshold && !isDragging.current) {
      isDragging.current = true;

      // Propagate drag start event
      fileDraggingSession.current = dragAndDrop.start(data, evt.clientX, evt.clientY);
    }

    if (isDragging.current && fileDraggingSession.current) {
      // Propagate drag move event
      fileDraggingSession.current.move(evt.clientX, evt.clientY);

      // Get the current target element
      const elements = document.elementsFromPoint(evt.clientX, evt.clientY);

      let dropPoint = null;

      for (const element of elements) {
        if (element.hasAttribute("data-drop-point")) {
          dropPoint = element;
          break;
        }

        if (element.hasAttribute("data-window-root")) {
          break;
        } 
      }

      if (!dropPoint) { 
        fileDraggingCurrentNode.current = undefined;
        return;
      }

      const moveEvent = new CustomEvent(FileSystemItemDragMove, { detail: data, bubbles: false }); 
      dropPoint?.dispatchEvent(moveEvent);


      if (dropPoint !== fileDraggingCurrentNode.current) {
        const enterEvent = new CustomEvent(FileSystemItemDragEnter, { detail: data, bubbles: false }); 
        const leaveEvent = new CustomEvent(FileSystemItemDragLeave, { detail: data, bubbles: false }); 

        fileDraggingCurrentNode.current?.dispatchEvent(leaveEvent);
        dropPoint?.dispatchEvent(enterEvent);

        fileDraggingCurrentNode.current = dropPoint;
      }
    }
  }

  function onFileDraggingUp(evt: PointerEvent) {
    window.removeEventListener('pointermove', onFileDraggingMove);
    window.removeEventListener('pointerup', onFileDraggingUp);

    const coords = fileDraggingCurrentNode.current?.getBoundingClientRect();
    const origin = fileDraggingFolderOrigin.current;

    if (!origin || !coords) {   
      fileDraggingSession.current?.drop(evt.clientX, evt.clientY);
      return;
    }

    // 1. get the offset for each file from the original position
    // 2. get the local position within the other folder view
    // 3. apply the offset to the local position
    if (fileDraggingCurrentNode.current) {
      const data: FileSystemItemDragData = {
        nodes: fileDraggingSelection.current.map(entry => {
          const offset = {
            x: origin.x - entry.x,
            y: origin.y - entry.y,
          };

          const position = {
            x: evt.clientX - coords.left - offset.x,
            y: evt.clientY - coords.top - offset.y,
          };

          return { item: entry.node, position, offset };
        })
      }

      const dropEventLeave = new CustomEvent(FileSystemItemDragDrop, { detail: data, bubbles: false });
      fileDraggingCurrentNode.current.dispatchEvent(dropEventLeave);
    }

    fileDraggingSession.current?.drop(evt.clientX, evt.clientY);
    fileDraggingSession.current = null;
    fileDraggingCurrentNode.current = undefined;

    isDragging.current = false;
  }

  function onPointerDown(evt: PointerEvent) {
    if (!ref.current) { return; }
    
    const file = clickedFile(evt);

    if (file) {
      const coords = ref.current.getBoundingClientRect();

      const deltaX = evt.clientX - coords.left;
      const deltaY = evt.clientY - coords.top;

      fileDraggingFolderOrigin.current = { x: deltaX, y: deltaY };

      if (!file.selected) { selectFile(evt); }

      onFileDraggingStart(evt);

      const now = Date.now();
      const delta = now - previousClickedFile.current.timestamp;
      const sameFile = previousClickedFile.current.file === file;

      if (delta < 400 && sameFile) {        
        onFileOpen(file);
        
        previousClickedFile.current = { file: null, timestamp: 0 };
      } else {
        previousClickedFile.current = { file, timestamp: Date.now() };
      }
      
    } else {
      fileDraggingFolderOrigin.current = undefined;

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

  function reloadFiles(directory: string) {
    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return dir; }

    updateFiles(dir.value.children);

    return dir;
  }

  function loadFiles(directory: string) {
    const action = () => reloadFiles(directory);
    const result = action();
    
    if (result.ok) {
      return fs.subscribe(result.value, action);
    }
  }

  function onFileMove(evt: FileSystemItemDragEvent) {
    // console.log('move');
  }

  function onFileDrop(evt: FileSystemItemDragEvent) {
    const files = localFiles.current;
    
    if (!ref.current) { return; }
    const folder = ref.current;

    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return };

    for (const file of evt.detail.nodes) {
      fs.moveNode(file.item, dir.value);
    }

    const folderRect = folder.getBoundingClientRect();
    
    const horizontal = {
      min: -IconWidth / 2,
      max: folderRect.width + (IconWidth / 2)
    };

    const vertical = {
      min: -IconHeight / 2,
      max: folderRect.height + (IconHeight / 2)
    }
  
    for (let fileNode of files.iterFromTail()) {
      const file = fileNode.value;
      for (const node of evt.detail.nodes) {        
        if (node.item.id === file.node.id) {
          file.x = clamp(node.position.x, horizontal.min, horizontal.max);
          file.y = clamp(node.position.y, vertical.min, vertical.max);
        }
      }
    }

    updateFiles(files);
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const folder = ref.current;

    folder.addEventListener('pointerdown', onPointerDown);

    folder.addEventListener(FileSystemItemDragMove, onFileMove as EventListener);
    folder.addEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
    
    return () => {
      folder.removeEventListener('pointerdown', onPointerDown);

      folder.removeEventListener(FileSystemItemDragMove, onFileMove as EventListener);
      folder.removeEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
    };
  }, []);

  useEffect(() => { 
    const unsubscribe = loadFiles(directory);

    return () => {
      if (unsubscribe) { unsubscribe() };
    }
  }, [directory]);

  const icons = files.map((entry, index) => <DesktopIcon key={index} entry={entry} index={index} />);

  const selectionBox = SelectionBox(box);
  
  return <>
    <div 
      ref={ref}
      className={styles.folder}
      data-drop-point="true"
    >
      {icons}
      {selectionBox}
    </div>
  </>
}