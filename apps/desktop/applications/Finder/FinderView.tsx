import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useState, useEffect, useRef } from "react";
import FolderView, { FolderViewHandles } from "@/components/Folder/FolderView";
import { ApplicationWindowEvent } from "../ApplicationEvents";
import { FileSystemDirectory, FileSystemNode, FileSystemTextFile } from "@/apis/FileSystem/FileSystem";
import styles from './FinderView.module.css';
import { Application } from "../ApplicationManager";
import React from "react";
import { Chain, Node } from "@/data/Chain";
import { Err, Ok, Result } from "result";
import { constructPath, generateUniqueNameForDirectory } from "@/apis/FileSystem/util";
import { useTranslation } from "react-i18next";

function getFileSystemDirectoryByPath(application: Application, path: string): Result<FileSystemDirectory, Error> {
  if (!path.endsWith('/')) { path += '/'; }

  const node = application.apis.fileSystem.getNode(path);

  if (!node.ok) { return node }
  if (node.value.kind !== 'directory') { return Err(Error("node type is not a directory")); }

  return Ok(node.value);
}

function buildPathNodesFromDirectoryEntry(node: FileSystemNode): FileSystemDirectory[] {
  let current: FileSystemDirectory | null = node.kind === 'directory' ? node : node.parent;
  let items: FileSystemDirectory[] = [];

  while (current) {
    items.push(current);

    current = current.parent;
  }
  
  // Reverse the entries
  for (let i = 0; i < Math.floor(items.length / 2); i++) {
    const target = (items.length - 1) - i;
    let swapValue = items[target];

    items[target] = items[i];
    items[i] = swapValue;
  }

  return items;
}

export default function FinderView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const [ path, setPath ] = useState(args);
  const [ canEdit, setCanEdit ] = useState(false);
  const [ pathNodes, setPathNodes ] = useState<FileSystemDirectory[]>([]);

  const { t } = useTranslation('common');
  const fs = application.apis.fileSystem;

  const currentHistoryElement = useRef<Node<FileSystemDirectory> | null>(null);
  const history = useRef(new Chain<FileSystemDirectory>());

  function recordHistory(directory: FileSystemDirectory) {
    if (currentHistoryElement.current) {
      history.current.cutOff(currentHistoryElement.current);
    }
    
    currentHistoryElement.current = history.current.append(directory);
  }

  function clearHistory() {
    currentHistoryElement.current = null;
    history.current = new Chain();
  }

  function hasBackwardHistory(): boolean {
    if (!currentHistoryElement.current) { return false; }

    return currentHistoryElement.current.prev !== null;
  }

  function hasForwardHistory(): boolean {
    if (!currentHistoryElement.current) { return false; }
    
    return currentHistoryElement.current.next !== null;
  }

  function goBackInHistory() {
    if (!hasBackwardHistory()) { return; }

    const prev = currentHistoryElement.current!.prev;

    currentHistoryElement.current = prev;
    
    changeDirectory(prev!.value);
  }

  function goForwardInHistory() {
    if (!hasForwardHistory()) { return; }

    const next = currentHistoryElement.current!.next;

    currentHistoryElement.current = next;
    
    changeDirectory(next!.value);
  }

  function createDirectory() {
    if (!canEdit) { return; }

    const dir = fs.getDirectory(path);
    if (!dir.ok) { return; }

    const template = t('filesystem.new_directory');
    const name = generateUniqueNameForDirectory(dir.value, template);

    const noop = () => {};

    application.compositor.prompt(windowContext.id, t('finder.create_directory_instructions'), name)
      .then((name) => {
        if (fs.getDirectory(`${path}${name}`).ok) {
          application.compositor.alert(windowContext.id, t('finder.create_directory_duplicated_name')).catch(noop);
          return;
        }
        
        fs.addDirectory(dir.value, name, true, true);
        fs.propagateNodeEvent(dir.value, {kind: 'update'});
      }).catch(noop);
  }

  function updateWindowTitle(path: string) {
    const window = application.compositor.getById(windowContext.id);
    if (!window) { return; }

    window.title = `${path} - File Manager`;

    application.compositor.update(window);
  }

  function changeDirectory(directory: FileSystemDirectory) {
    setPathNodes(buildPathNodesFromDirectoryEntry(directory));
    const path = constructPath(directory);

    setCanEdit(directory.editable || directory.stickyBit);

    updateWindowTitle(path);
    setPath(path);
  }

  function onFileOpen(file: FileSystemNode, rename: boolean) {
    if (file.kind === 'directory') {
      changeDirectory(file);

      if (!rename) { recordHistory(file); }
    } else {
      const path = constructPath(file);
      application.on({ kind: 'finder-open-file-event', path}, windowContext)
    }
  }

  useEffect(() => {
    const directory = getFileSystemDirectoryByPath(application, path);
    if (directory.ok) {
      changeDirectory(directory.value);
      recordHistory(directory.value);
    }

    return () => {
      clearHistory();
    }

  }, []);
  
  function onClickBreadcrumb(directory: FileSystemDirectory, index: number) {
    if (index === pathNodes.length - 1) { return; }

    changeDirectory(directory);
    recordHistory(directory);
  }

  function onClickLocation(path: string) {
    const directory = getFileSystemDirectoryByPath(application, path);
    if (directory.ok) {
      changeDirectory(directory.value);
      recordHistory(directory.value);
    }
  }
  
  const locations = pathNodes.map((val, index) => <React.Fragment key={index}><button className={['system-button', styles.breadcrumb].join(' ')} onPointerDown={() => onClickBreadcrumb(val, index)}>{val.name}</button></React.Fragment>);
 
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.navigationActions}>
          <button className="system-button" disabled={!hasBackwardHistory()} onPointerDown={() => goBackInHistory()}>prev</button>
          <button className="system-button" disabled={!hasForwardHistory()} onPointerDown={() => goForwardInHistory()}>next</button>
                  
          <button className="system-button" disabled={!canEdit} onPointerDown={() => createDirectory()}>create directory</button>
        </div>
        <div className={styles.path}>
          { locations }
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.locations}>
          <ul>
            <li><button className="system-button" onPointerDown={() => { onClickLocation('/Applications/'); }}>Applications</button></li>
            <li><button className="system-button" onPointerDown={() => { onClickLocation('/Users/joey/'); }}>Home</button></li>
            <li><button className="system-button" onPointerDown={() => { onClickLocation('/Users/joey/Desktop/'); }}>Desktop</button></li>
            <li><button className="system-button" onPointerDown={() => { onClickLocation('/Users/joey/Documents'); }}>Documents</button></li>
          </ul>
        </div>
        <div className={styles.folder}>
          <FolderView directory={path} apis={application.apis} onFileOpen={onFileOpen} allowOverflow={true}></FolderView>
        </div>
      </div>
    </div>
  )
}
