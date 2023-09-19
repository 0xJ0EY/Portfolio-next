import { DirectoryEntry, DirectoryEventType, FileSystemDirectory, calculateNodePosition, constructPath } from '@/apis/FileSystem/FileSystem';
import { useState, useRef, useEffect, RefObject, MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';
import { DesktopIconEntry, DesktopIconHitBox, IconHeight, IconWidth } from '../Icons/DesktopIcon';
import { Point, Rectangle, pointInsideAnyRectangles, rectangleAnyIntersection } from '@/applications/math';
import { Chain } from '../../data/Chain';
import { DragAndDropSession, FileSystemItemDragData, FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragEvent, FileSystemItemDragLeave, FileSystemItemDragMove } from '@/apis/DragAndDrop/DragAndDrop';
import { Err, Ok, Result, clamp } from '../util';
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
  onFileOpen: (file: DirectoryEntry) => void,
  localIconPosition?: boolean
}

export default function FolderView({ directory, apis, onFileOpen, localIconPosition }: Props) {
  const fs = apis.fileSystem;

  const useLocalIconPosition = localIconPosition ?? false;

  const [files, setFiles] = useState<DesktopIconEntry[]>([]);
  const localFiles = useRef<Chain<DesktopIconEntry>>(new Chain());

  function updateFiles(files: Chain<DesktopIconEntry>) {
    localFiles.current = files;
    setFiles(files.toArray());
  } 

  const ref: RefObject<HTMLDivElement> = useRef(null);
  const iconContainer: RefObject<HTMLDivElement> = useRef(null);

  const dragAndDrop = apis.dragAndDrop;

  const currentDirectory = useRef(directory);
  const selectionBoxStart = useRef({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const previousClickedFile = useRef<{ file: DesktopIconEntry | null, timestamp: number }>({ file: null, timestamp: 0 });

  const fileDraggingOrigin = useRef({ x: 0, y: 0 });
  const fileDraggingFolderOrigin = useRef<Point>();

  const fileDraggingSelection  = useRef<DesktopIconEntry[]>([]);
  const fileDraggingCurrentNode: MutableRefObject<Element | undefined> = useRef();
  const fileDraggingSession: MutableRefObject<DragAndDropSession | null> = useRef(null);

  const [box, setBox] = useState<SelectionBox>({ open: false, x: 0, y: 0, width: 0, height: 0 });

  function getLocalCoordinates(evt: PointerEvent): Point {
    const dimensions = ref.current!.getBoundingClientRect();

    const localX = evt.clientX - dimensions.left;
    const localY = evt.clientY - dimensions.top;

    return { x: localX, y: localY};
  }

  function getXCoordInIconContainer(x: number, container: HTMLDivElement): number {
    return container.scrollLeft + x;
  }

  function getYCoordInIconContainer(y: number, container: HTMLDivElement): number {
    return container.scrollTop + y;
  }

  function getCoordinatesInIconContainer(point: Point, container: HTMLDivElement): Point {
    return {
      x: getXCoordInIconContainer(point.x, container),
      y: getYCoordInIconContainer(point.y, container)
    };
  }

  function selectFile(evt: PointerEvent) {
    const files = localFiles.current;
    
    if (!iconContainer.current) { return; }
    const container = iconContainer.current;
    const point = getCoordinatesInIconContainer(getLocalCoordinates(evt), container);

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

    if (!iconContainer.current) { return; }
    const container = iconContainer.current;

    const current = getLocalCoordinates(evt);
    
    const topLeftPoint = { x: Math.min(origin.x, current.x), y: Math.min(origin.y, current.y) };
    const bottomRightPoint = { x: Math.max(origin.x, current.x), y: Math.max(origin.y, current.y) };

    const selectionRect: Rectangle = {
      x1: getXCoordInIconContainer(topLeftPoint.x, container),
      x2: getXCoordInIconContainer(bottomRightPoint.x, container),
      y1: getYCoordInIconContainer(topLeftPoint.y, container),
      y2: getYCoordInIconContainer(bottomRightPoint.y, container)
    };

    for (let node of files.iterFromHead()) {
      const file = node.value; 
      const hitBox = DesktopIconHitBox(file);
      file.selected = rectangleAnyIntersection(selectionRect, hitBox);
    }

    updateFiles(files);
  }

  function clickedFile(evt: PointerEvent): DesktopIconEntry | undefined {
    const files = localFiles.current;

    if (!iconContainer.current) { return; }
    const container = iconContainer.current;
    const point = getCoordinatesInIconContainer(getLocalCoordinates(evt), container);

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

    const selectedFiles: DesktopIconEntry[] = [];

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
      nodes: fileDraggingSelection.current.map(desktopIconEntry => {
      
        const offset = {
          x: origin.x - desktopIconEntry.x,
          y: origin.y - desktopIconEntry.y,
        };

        return { item: desktopIconEntry.entry.node, position: { x: 0, y: 0}, offset };
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

      // Update the position based on the new drop point
      const coords = dropPoint.getBoundingClientRect();

      for (const node of data.nodes) {
        node.position = {
          x: evt.clientX - coords.left - node.offset.x,
          y: evt.clientY - coords.top - node.offset.y,
        };
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
        nodes: fileDraggingSelection.current.map(desktopIconEntry => {
          const offset = {
            x: origin.x - desktopIconEntry.x,
            y: origin.y - desktopIconEntry.y,
          };

          const position = {
            x: evt.clientX - coords.left - offset.x,
            y: evt.clientY - coords.top - offset.y,
          };

          return { item: desktopIconEntry.entry.node, position, offset };
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

  function renameFile(entry: DesktopIconEntry) {
    entry.editing = { active: true, value: entry.entry.node.name, onSave: () => { stopRenamingFiles(); }};

    updateFiles(localFiles.current);
  }

  function stopRenamingFiles() {
    const files = localFiles.current;

    let update = false;

    for (const file of files.iterFromTail()) {
      if (file.value.editing.active) {
        fs.renameNode(file.value.entry.node, file.value.editing.value);
        
        file.value.editing.active = false;
      }
    }

    if (update) {
      updateFiles(files);
    }
  }

  function onPointerDown(evt: PointerEvent) {
    if (!ref.current) { return; }
    
    const file = clickedFile(evt);

    if (file) {
      const coords = ref.current.getBoundingClientRect();

      const deltaX = evt.clientX - coords.left;
      const deltaY = evt.clientY - coords.top;

      fileDraggingFolderOrigin.current = { x: deltaX, y: deltaY };

      if (!file.selected) {
        stopRenamingFiles();
        selectFile(evt);
      }

      onFileDraggingStart(evt);

      const now = Date.now();
      const delta = now - previousClickedFile.current.timestamp;
      const sameFile = previousClickedFile.current.file === file;

      const openFolder = delta < 400 && sameFile;
      const renameFolder = delta >= 400 && sameFile;

      if (openFolder) {
        onFileOpen(file.entry);
        
        previousClickedFile.current = { file: null, timestamp: 0 };
      } else 
      if (renameFolder) {
        renameFile(file);

        previousClickedFile.current = { file: null, timestamp: 0 };
      } else {        
        previousClickedFile.current = { file, timestamp: Date.now() };
      }
      
    } else {
      stopRenamingFiles();

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

  function reloadSyncedFiles(directory: FileSystemDirectory) {
    const chain = new Chain<DesktopIconEntry>();

    // Essentially a map to wrap the files in a DesktopIconEntry
    for (const node of directory.children.iterFromTail()) {
      chain.append({
        entry: node.value,
        selected: false,
        dragging: false,
        x: node.value.x,
        y: node.value.y,
        editing: { active: false, value: node.value.node.name }
      });
    }

    updateFiles(chain);    
  }

  function reloadLocalFiles(directory: FileSystemDirectory, type: DirectoryEventType) {
    if (type === 'refresh') { return; }

    const existingChain = localFiles.current;
    const lookup = new Map<number, DesktopIconEntry>();
    const newChain = new Chain<DesktopIconEntry>();

    let newDesktopIconEntries: DirectoryEntry[] = [];

    // Create a quick lookup table, so we don't have to look sequentially through the chain
    // I <3 linked list look up times
    for (const entry of existingChain.iterFromTail()) {
      const value = entry.value;
      const id = value.entry.node.id;

      lookup.set(id, value);
    }

    for (const node of directory.children.iterFromTail()) {
      const existingValue = lookup.get(node.value.node.id);

      if (!existingValue) {
        newDesktopIconEntries.push(node.value);
        continue;
      }

      newChain.append({
        entry: node.value,
        selected: false,
        dragging: false,
        x: existingValue.x,
        y: existingValue.y,
        editing: { active: false, value: node.value.node.name }
      });
    }

    for (const entry of newDesktopIconEntries) {
      const pos = calculateNodePosition(directory.settings, directory.content, newChain.toArray());

      newChain.append({
        entry,
        selected: false,
        dragging: false,
        x: pos.x,
        y: pos.y,
        editing: { active: false, value: entry.node.name }
      });
    }

    updateFiles(newChain);
  }

  function reloadFiles(directory: string, type: DirectoryEventType) {
    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return dir; }

    currentDirectory.current = constructPath(dir.value);

    if (useLocalIconPosition) {
      reloadLocalFiles(dir.value, type);
    } else {
      reloadSyncedFiles(dir.value);
    }

    return dir;
  }

  function loadFiles(directory: string) {
    const action = (type: DirectoryEventType) => reloadFiles(directory, type);
    const result = action('update');
    
    if (result.ok) {
      return fs.subscribe(result.value, action);
    }
  }

  function fileMoveToggleSelected(files: Chain<DesktopIconEntry>, evt: FileSystemItemDragEvent) {
    const selectedFiles: Set<number> = new Set();

    const first = evt.detail.nodes[0] ?? null;
    if (!first) { return; }

    for (const node of evt.detail.nodes) {
      selectedFiles.add(node.item.id);
    }

    for (let node of files.iterFromTail()) {
      const desktopEntry = node.value;
      const file = desktopEntry.entry.node;

      if (selectedFiles.has(file.id)) { continue; }
      if (file.kind !== 'directory') {
        desktopEntry.selected = false;
        continue;
      }

      const hitBox = DesktopIconHitBox(desktopEntry);

      const pos = {
        x: first.position.x + first.offset.x,
        y: first.position.y + first.offset.y
      }

      desktopEntry.selected = pointInsideAnyRectangles(pos, hitBox);
    }
  }

  function onFileDropMove(evt: FileSystemItemDragEvent) {
    const files = localFiles.current;

    fileMoveToggleSelected(files, evt);

    updateFiles(files);
  }

  function fileDropGetTargetDirectory(files: Chain<DesktopIconEntry>, evt: FileSystemItemDragEvent): Result<FileSystemDirectory, Error> {
    const selectedFiles: Set<number> = new Set();

    const first = evt.detail.nodes[0] ?? null;

    const dir = fs.getDirectory(currentDirectory.current);
    if (!dir.ok) { return Err(Error("Unable to lookup currentDirectory")); }

    if (!first) { return Ok(dir.value); }

    for (const node of evt.detail.nodes) {
      selectedFiles.add(node.item.id);
    }

    for (let node of files.iterFromTail()) {
      const file = node.value.entry.node;
      if (file.kind !== 'directory') { continue; }
      if (selectedFiles.has(file.id)) { continue; }

      const hitBox = DesktopIconHitBox(node.value);

      const pos = {
        x: first.position.x + first.offset.x,
        y: first.position.y + first.offset.y
      }

      const hit = pointInsideAnyRectangles(pos, hitBox);

      if (hit) {
        return Ok(file);
      }
    }
    
    return Ok(dir.value);
  }

  function onFileDrop(evt: FileSystemItemDragEvent) {
    const files = localFiles.current;
    let parentsToUpdate: Map<number, FileSystemDirectory> = new Map();
    
    if (!ref.current) { return; }
    const folder = ref.current;

    const dir = fileDropGetTargetDirectory(files, evt);
    if (!dir.ok) { return };

    let forceUpdate = constructPath(dir.value) !== currentDirectory.current;

    const folderRect = folder.getBoundingClientRect();
    
    const horizontal = {
      min: -IconWidth / 2,
      max: folderRect.width + (IconWidth / 2)
    };

    const vertical = {
      min: -IconHeight / 2,
      max: folderRect.height + (IconHeight / 2)
    }

    outer: for (const node of evt.detail.nodes) {
      if (node.item.parent && node.item.parent.id !== dir.value.id) {
        const parent = node.item.parent;
        parentsToUpdate.set(parent.id, parent);
        forceUpdate = true;
      }

      const result = fs.moveNode(node.item, dir.value);

      if (!result.ok) { continue; }
      const directoryEntry = result.value;

      const positionX = clamp(node.position.x, horizontal.min, horizontal.max);
      const positionY = clamp(node.position.y, vertical.min, vertical.max);

      if (!useLocalIconPosition) {
        directoryEntry.x = positionX;
        directoryEntry.y = positionY;
      }
      
      const desktopIconEntry: DesktopIconEntry = {
        entry: directoryEntry,
        x: positionX,
        y: positionY,
        selected: false,
        dragging: false,
        editing: { active: false, value: node.item.name }
      }

      for (let fileNode of files.iterFromTail()) {
        if (fileNode.value.entry.node.id === directoryEntry.node.id) {
          fileNode.value = desktopIconEntry;

          continue outer;
        }
      }

      files.append(desktopIconEntry);
    }

    if (forceUpdate) {
      parentsToUpdate.forEach(x => fs.propagateDirectoryEvent(x, 'update'));
      fs.propagateDirectoryEvent(dir.value, 'update');
    } else {
      // Local Icon Position (Desktop mode) shouldn't update the rest of the views
      // As it should be isolated from the other views
      if (!useLocalIconPosition) {
        fs.propagateDirectoryEvent(dir.value, 'refresh');
      }

      updateFiles(files);
    }
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const folder = ref.current;

    folder.addEventListener('pointerdown', onPointerDown);
    folder.addEventListener(FileSystemItemDragMove, onFileDropMove as EventListener);
    folder.addEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
    
    return () => {
      folder.removeEventListener('pointerdown', onPointerDown);
      folder.removeEventListener(FileSystemItemDragMove, onFileDropMove as EventListener);
      folder.removeEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
    };
  }, []);

  useEffect(() => { 
    const unsubscribe = loadFiles(directory);

    return () => {
      if (unsubscribe) { unsubscribe() };
    }
  }, [directory]);

  const icons = files.map((entry, index) => {
    return <DesktopIcon key={index} desktopIconEntry={entry} index={index} />
  });

  const selectionBox = SelectionBox(box);
  
  return <>
    <div 
      ref={ref}
      className={styles.folder}
      data-drop-point="true"
    >
      <div className={styles.selectionBoxContainer}>
        {selectionBox}
      </div>
      <div ref={iconContainer} className={styles.iconsContainer}>
        {icons}
      </div>
    </div>
  </>
}
