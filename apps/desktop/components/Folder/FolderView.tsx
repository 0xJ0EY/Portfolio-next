import { DirectoryContent, DirectoryEntry, NodeEventType, NodeRenameEvent, DirectorySettings, FileSystemDirectory, FileSystemNode, calculateNodePosition} from '@/apis/FileSystem/FileSystem';
import { forwardRef, useState, useRef, useEffect, RefObject, MutableRefObject, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/components/Folder/FolderView.module.css';
import { FolderIconEntry, FolderIconHitBox, IconHeight, IconWidth } from '../Icons/FolderIcon';
import { Point, Rectangle, pointIndexInsideAnyRectangles, pointInsideAnyRectangles, rectangleAnyIntersection } from '@/applications/math';
import { Chain } from '../../data/Chain';
import { DragAndDropSession, FileSystemItemDragData, FileSystemItemDragDrop, FileSystemItemDragEnter, FileSystemItemDragEvent, FileSystemItemDragLeave, FileSystemItemDragMove } from '@/apis/DragAndDrop/DragAndDrop';
import { clamp } from '../util';
import { Err, Ok, Result } from "result";
import { SystemAPIs } from '../OperatingSystem';
import { constructPath, generateUniqueNameForDirectory } from '@/apis/FileSystem/util';

const FolderIcon = dynamic(() => import('../Icons/FolderIcon'));

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

  return <div className={styles['selection-box']} style={{width: box.width, height: box.height, top: box.y, left: box.x}}></div>
}

const DraggingThreshold = 5;

type Interaction = 'pointer' | 'touch';
type ClickedIcon = { iconEntry: FolderIconEntry, clickedOnTheIcon: boolean }

type FolderViewProps = {
  directory: string,
  apis: SystemAPIs,
  onFileOpen: (file: FileSystemNode, rename: boolean) => void,
  localIconPosition?: boolean,
  allowOverflow?: boolean
}

export type FolderViewHandles = {
  getCurrentDirectory: () => void
}

export function FolderView(props: FolderViewProps) {
  const { directory, apis, onFileOpen, localIconPosition, allowOverflow: propOverflow } = props;
  const fs = apis.fileSystem;

  const useLocalIconPosition = localIconPosition ?? false;
  const allowOverflow = propOverflow ?? true;

  const [files, setFiles] = useState<FolderIconEntry[]>([]);
  const localFiles = useRef<Chain<FolderIconEntry>>(new Chain());

  function updateFiles(files: Chain<FolderIconEntry>) {
    localFiles.current = files;
    setFiles(files.toArray());
  } 

  const ref: RefObject<HTMLDivElement> = useRef(null);
  const iconContainer: RefObject<HTMLDivElement> = useRef(null);

  const dragAndDrop = apis.dragAndDrop;

  const currentDirectory = useRef(directory);
  const selectionBoxStart = useRef({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const previousClickedFile = useRef<{ file: ClickedIcon | null, timestamp: number }>({ file: null, timestamp: 0 });

  const fileDraggingOrigin = useRef({ x: 0, y: 0 });
  const fileDraggingFolderOrigin = useRef<Point>();

  const fileDraggingSelection  = useRef<FolderIconEntry[]>([]);
  const fileDraggingCurrentNode: MutableRefObject<Element | undefined> = useRef();
  const fileDraggingSession: MutableRefObject<DragAndDropSession | null> = useRef(null);

  const [box, setBox] = useState<SelectionBox>({ open: false, x: 0, y: 0, width: 0, height: 0 });

  function getLocalCoordinates(point: Point): Point {
    const dimensions = ref.current!.getBoundingClientRect();

    const localX = point.x - dimensions.left;
    const localY = point.y - dimensions.top;

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

  function selectFile(position: Point) {
    const files = localFiles.current;
    
    if (!iconContainer.current) { return; }
    const container = iconContainer.current;
    const point = getCoordinatesInIconContainer(getLocalCoordinates(position), container);

    let hasSelected = false;

    for (let node of files.iterFromHead()) {
      const file = node.value;
      const hitBox = FolderIconHitBox(file);

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

  function selectFiles(position: Point) {
    const files = localFiles.current;
    const origin = selectionBoxStart.current;

    if (!iconContainer.current) { return; }
    const container = iconContainer.current;

    const current = getLocalCoordinates(position);
    
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
      const hitBox = FolderIconHitBox(file);
      file.selected = rectangleAnyIntersection(selectionRect, hitBox);
    }

    updateFiles(files);
  }

  function clickedFile(position: Point): ClickedIcon | undefined {
    const files = localFiles.current;

    if (!iconContainer.current) { return; }
    const container = iconContainer.current;
    const point = getCoordinatesInIconContainer(getLocalCoordinates(position), container);

    for (const node of files.iterFromTail()) {
      const file = node.value;
      const hitBox = FolderIconHitBox(file);

      const index = pointIndexInsideAnyRectangles(point, hitBox);

      if (index >= 0) {
        return { iconEntry: node.value, clickedOnTheIcon: index === 0 };
      }
    }

    return undefined;
  }

  function onFileDraggingStart(position: Point) {
    const files = localFiles.current;
    window.addEventListener('pointermove', onFileDraggingMove);
    window.addEventListener('pointerup', onFileDraggingUp);

    const selectedFiles: FolderIconEntry[] = [];

    for (const node of files.iterFromTail()) {
      const file = node.value;

      if (file.selected) { selectedFiles.push(file); }
    }

    fileDraggingSelection.current = selectedFiles;
    fileDraggingOrigin.current = { x: position.x, y: position.y };
  }

  function onFileDraggingMove(evt: PointerEvent) {
    if (!iconContainer.current) { return; }

    const scrollOffsetX = iconContainer.current.scrollLeft;
    const scrollOffsetY = iconContainer.current.scrollTop;

    const deltaX = Math.abs(fileDraggingOrigin.current.x - evt.clientX - scrollOffsetX);
    const deltaY = Math.abs(fileDraggingOrigin.current.y - evt.clientY - scrollOffsetY);

    const origin = fileDraggingFolderOrigin.current;

    if (!origin) { return; }

    const data: FileSystemItemDragData = {
      nodes: fileDraggingSelection.current.map(folderIcon => {
      
        const offset = {
          x: origin.x - folderIcon.x,
          y: origin.y - folderIcon.y,
        };

        return { item: folderIcon.entry.node, position: { x: 0, y: 0}, offset };
      })
    };

    const passesDraggingThreshold = deltaX > DraggingThreshold || deltaY > DraggingThreshold;

    if (passesDraggingThreshold && !isDragging.current) {
      isDragging.current = true;

      // Propagate drag start event
      // NOTE(Joey): Not sure why the scrollOffset{x/y} need to be multiplied by 2
      fileDraggingSession.current = dragAndDrop.start(data, evt.clientX - scrollOffsetX * 2, evt.clientY - scrollOffsetY * 2);
    }
    
    if (isDragging.current && fileDraggingSession.current) {
      // Propagate drag move event
      fileDraggingSession.current.move(evt.clientX - scrollOffsetX * 2, evt.clientY - scrollOffsetY * 2);

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
        nodes: fileDraggingSelection.current.map(folderIcon => {
          const offset = {
            x: origin.x - folderIcon.x,
            y: origin.y - folderIcon.y,
          };

          const position = {
            x: evt.clientX - coords.left - offset.x,
            y: evt.clientY - coords.top - offset.y,
          };

          return { item: folderIcon.entry.node, position, offset };
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

  function renameFile(iconEntry: FolderIconEntry) {
    // Check if we can rename the file first
    const fileSystemNode = iconEntry.entry.node;
    if (!fileSystemNode.editable) { return; }

    iconEntry.editing = { active: true, value: iconEntry.entry.node.name, onSave: () => { stopRenamingFiles(); }};

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

  function onTouchDown(evt: TouchEvent) {
    evt.preventDefault();
    if (evt.touches.length > 1) { return; }

    const touch = evt.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };

    handleInteractionStart(position, 'touch');
  }

  function onPointerDown(evt: PointerEvent) {
    if (evt.pointerType === 'touch') { return; }

    const position = { x: evt.clientX, y: evt.clientY };

    handleInteractionStart(position, 'pointer');
  }

  function handleInteractionStart(position: Point, interaction: Interaction) {
    if (!ref.current) { return; }
    if (!iconContainer.current) { return; }
    
    const file = clickedFile(position);

    if (file) {
      const coords = iconContainer.current.getBoundingClientRect();

      const deltaX = position.x - coords.left - iconContainer.current.scrollLeft;
      const deltaY = position.y - coords.top - iconContainer.current.scrollTop;

      fileDraggingFolderOrigin.current = { x: deltaX, y: deltaY };

      if (!file.iconEntry.selected) {
        stopRenamingFiles();
        selectFile(position);
      }

      onFileDraggingStart(position);

      const sameFile = previousClickedFile.current.file?.iconEntry === file.iconEntry;
      const sameHitBox = previousClickedFile.current.file?.clickedOnTheIcon === file.clickedOnTheIcon;
      const clickedOnIcon = file.clickedOnTheIcon;

      const openFolder = sameFile && clickedOnIcon;
      const renameFolder = sameFile && sameHitBox && !clickedOnIcon;

      if (openFolder) {
        stopRenamingFiles();

        onFileOpen(file.iconEntry.entry.node, false);
        
        previousClickedFile.current = { file: null, timestamp: 0 };
      } else 
      if (renameFolder) {
        renameFile(file.iconEntry);

        previousClickedFile.current = { file: null, timestamp: 0 };
      } else {        
        previousClickedFile.current = { file, timestamp: Date.now() };
      }
      
    } else {
      stopRenamingFiles();

      fileDraggingFolderOrigin.current = undefined;

      openSelectionBox(position, interaction);
    }
  }

  function openSelectionBox(position: Point, interaction: Interaction) {
    selectionBoxStart.current = getLocalCoordinates(position);

    switch (interaction) {
      case 'pointer': {
        window.addEventListener('pointermove', moveSelectionBoxViaPointer);
        window.addEventListener('pointerup', closeSelectionBoxViaPointer);
        break;
      }
      case 'touch': {
        window.addEventListener('touchmove', moveSelectionBoxViaTouch);
        window.addEventListener('touchend', closeSelectionBoxViaTouch);
        break;
      }
    }
  }

  function moveSelectionBoxViaPointer(evt: PointerEvent) {
    if (evt.pointerType === 'touch') { return; }

    const position = { x: evt.clientX, y: evt.clientY };

    moveSelectionBox(position);
  }

  function moveSelectionBoxViaTouch(evt: TouchEvent) {
    const touch = evt.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };

    moveSelectionBox(position);
  }

  function moveSelectionBox(position: Point) {
    const origin = selectionBoxStart.current;
    const current = getLocalCoordinates(position);

    const topLeftPoint = { x: Math.min(origin.x, current.x), y: Math.min(origin.y, current.y) };
    const bottomRightPoint = { x: Math.max(origin.x, current.x), y: Math.max(origin.y, current.y) };

    const x = topLeftPoint.x;
    const y = topLeftPoint.y;

    const width = bottomRightPoint.x - topLeftPoint.x;
    const height = bottomRightPoint.y - topLeftPoint.y;

    setBox({ open: true, x, y, width, height });

    selectFiles(position);
  }

  function closeSelectionBoxViaPointer(evt: PointerEvent) {
    if (evt.pointerType === 'touch') { return; }

    const position = { x: evt.clientX, y: evt.clientY };

    closeSelectionBox(position, 'pointer');
  }

  function closeSelectionBoxViaTouch(evt: TouchEvent) {
    if (evt.touches.length > 0) { return; }

    const touch = evt.changedTouches[0];
    const point = { x: touch.clientX, y: touch.clientY };

    closeSelectionBox(point, 'touch');
  }

  function closeSelectionBox(position: Point, interaction: Interaction) {
    function closeBox() {
      const localBox = box;
      localBox.open = false;
      setBox(localBox);

      switch (interaction) {
        case 'pointer': {
          window.removeEventListener('pointermove', moveSelectionBoxViaPointer);
          window.removeEventListener('pointerup', closeSelectionBoxViaPointer);
          break;
        }
        case 'touch': {
          window.removeEventListener('touchmove', moveSelectionBoxViaTouch);
          window.removeEventListener('touchend', closeSelectionBoxViaTouch);
          break;
        }
      }
    }

    selectFiles(position);
    closeBox();
  }

  function reloadSyncedFiles(directory: FileSystemDirectory) {
    const chain = new Chain<FolderIconEntry>();

    // Essentially a map to wrap the files in a FolderIconEntries
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

  function reloadLocalFiles(directory: FileSystemDirectory, type: NodeEventType) {
    if (type.kind === 'refresh') { return; }
    if (!ref.current) { return; }
    
    const container = ref.current;

    const existingChain = localFiles.current;
    const lookup = new Map<number, FolderIconEntry>();
    const newChain = new Chain<FolderIconEntry>();

    let newDirectoryEntries: DirectoryEntry[] = [];

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
        newDirectoryEntries.push(node.value);
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

    const content: DirectoryContent = {
      view: 'icons',
      width: container.clientWidth,
      height: container.clientHeight,
      overflowBehavior: 'overlay'
    };

    for (const entry of newDirectoryEntries) {
      const desktopSettings: DirectorySettings = {
        alwaysOpenAsIconView: false,
        sortBy: null, // TODO: Implement this
        sortDirection: 'vertical',
        sortOrigin: 'top-right',
      };

      const pos = calculateNodePosition(desktopSettings, content, newChain.toArray());

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

  function reloadRenamedDirectory(event: NodeRenameEvent) {
    const dir = fs.getDirectory(event.path);

    if (dir.ok) {
      onFileOpen(dir.value, true);
    }
  }

  function reloadFiles(directory: string, type: NodeEventType): FileSystemDirectory | null {
    if (type.kind === 'rename') {      
      reloadRenamedDirectory(type);

      return null;
    }

    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return null; }

    currentDirectory.current = constructPath(dir.value);

    if (useLocalIconPosition) {
      reloadLocalFiles(dir.value, type);
    } else {
      reloadSyncedFiles(dir.value);
    }

    return dir.value;
  }

  function loadFiles(directory: string) {
    const action = (type: NodeEventType) => {
      return reloadFiles(directory, type);
    }

    const result = action({kind: 'update'});
    
    if (result) {
      return fs.subscribe(result, action);
    }
  }

  function fileMoveToggleSelected(files: Chain<FolderIconEntry>, evt: FileSystemItemDragEvent) {
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

      const hitBox = FolderIconHitBox(desktopEntry);

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

  function fileDropGetTargetDirectory(files: Chain<FolderIconEntry>, evt: FileSystemItemDragEvent): Result<FileSystemDirectory, Error> {
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

      const hitBox = FolderIconHitBox(node.value);

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

    const placingInLocalDirectory = constructPath(dir.value) === currentDirectory.current;
    let forceUpdate = !placingInLocalDirectory;

    const folderRect = folder.getBoundingClientRect();
    
    const horizontal = {
      min: -IconWidth / 2,
      max: folderRect.width - (IconWidth / 2)
    };

    const vertical = {
      min: -IconHeight / 2,
      max: folderRect.height - (IconHeight / 2)
    }

    outer: for (const node of evt.detail.nodes) {
      if (node.item.parent && node.item.parent.id !== dir.value.id) {
        const parent = node.item.parent;
        parentsToUpdate.set(parent.id, parent);
        forceUpdate = true;
      }

      let others: Point[] = placingInLocalDirectory ? [] : dir.value.children.toArray();
      const result = fs.moveNode(node.item, dir.value);

      if (!result.ok) { continue; }
      const directoryEntry = result.value;

      let positionX: number, positionY: number;

      if (placingInLocalDirectory) {
        positionX = clamp(node.position.x, horizontal.min, horizontal.max);
        positionY = clamp(node.position.y, vertical.min, vertical.max);
      } else {
        const pos = calculateNodePosition(dir.value.settings, dir.value.content, others);
        positionX = pos.x;
        positionY = pos.y;
      }

      if (!useLocalIconPosition) {
        directoryEntry.x = positionX;
        directoryEntry.y = positionY;
      }
      
      const folderIconEntry: FolderIconEntry = {
        entry: directoryEntry,
        x: positionX,
        y: positionY,
        selected: false,
        dragging: false,
        editing: { active: false, value: node.item.name }
      }

      for (let fileNode of files.iterFromTail()) {
        if (fileNode.value.entry.node.id === directoryEntry.node.id) {
          fileNode.value = folderIconEntry;

          continue outer;
        }
      }

      files.append(folderIconEntry);
    }

    if (forceUpdate) {
      parentsToUpdate.forEach(x => fs.propagateNodeEvent(x, {kind: 'update'}));
      fs.propagateNodeEvent(dir.value, {kind: 'update'});
    } else {
      // Local Icon Position (Desktop mode) shouldn't update the rest of the views
      // As it should be isolated from the other views
      if (!useLocalIconPosition) {
        fs.propagateNodeEvent(dir.value, {kind: 'refresh'});
      }

      updateFiles(files);
    }
  }

  function updateDirectoryDimensions() {
    if (useLocalIconPosition) { return; }
    if (!iconContainer.current) { return; }
    if (!currentDirectory.current) { return; }

    const dir = fs.getDirectory(currentDirectory.current);
    if (!dir.ok) { return; }

    const container = iconContainer.current;
    
    const folderScrollWidth = container.scrollWidth;
    const folderScrollHeight = container.scrollHeight;

    dir.value.content.width = folderScrollWidth;
    dir.value.content.height = folderScrollHeight;
  }

  useEffect(() => {
    if (!ref.current) { return; }
    const folder = ref.current;

    folder.addEventListener('touchstart', onTouchDown, { passive: false });
    folder.addEventListener('pointerdown', onPointerDown, { passive: false });
    folder.addEventListener(FileSystemItemDragMove, onFileDropMove as EventListener);
    folder.addEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
    
    const observer = new ResizeObserver(updateDirectoryDimensions);
    observer.observe(ref.current);

    // Set the correct width / height of the just opened window
    updateDirectoryDimensions();
    
    return () => {
      folder.removeEventListener('touchstart', onTouchDown);
      folder.removeEventListener('pointerdown', onPointerDown);
      folder.removeEventListener(FileSystemItemDragMove, onFileDropMove as EventListener);
      folder.removeEventListener(FileSystemItemDragDrop, onFileDrop as EventListener);
      
      observer.disconnect();
    };
  }, []);

  useEffect(() => { 
    const unsubscribe = loadFiles(directory);

    updateDirectoryDimensions();

    return () => {
      if (unsubscribe) { unsubscribe() };
    }
  }, [directory]);

  const icons = files.map((entry, index) => {
    return <FolderIcon key={index} folderIconEntry={entry} index={index} />
  });

  const selectionBox = SelectionBox(box);
  
  return <>
    <div 
      ref={ref}
      className={styles.folder}
      data-drop-point="true"
    >
      <div className={styles['selection-box-container']}>
        {selectionBox}
      </div>
      <div ref={iconContainer} className={[styles['icons-container'], !allowOverflow ? styles['hide-overflow'] : ''].join(' ')}>
        {icons}
      </div>
    </div>
  </>
};

export default FolderView;