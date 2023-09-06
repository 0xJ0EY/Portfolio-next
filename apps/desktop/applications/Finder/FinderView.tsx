import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useState, useEffect, useRef } from "react";
import FolderView from "@/components/Folder/FolderView";
import { ApplicationWindowEvent } from "../ApplicationEvents";
import { DirectoryEntry, FileSystemDirectory, FileSystemNode, constructPath } from "@/apis/FileSystem/FileSystem";
import styles from './FinderView.module.css';
import { Application } from "../ApplicationManager";
import React from "react";
import { Chain, Node } from "@/data/Chain";
import { Err, Ok, Result } from "@/components/util";

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
  const [ pathNodes, setPathNodes ] = useState<FileSystemDirectory[]>([]);

  const currentHistoryElement = useRef<Node<FileSystemDirectory> | null>(null);
  const history = useRef(new Chain<FileSystemDirectory>());

  function onWindowEvent(event: ApplicationWindowEvent) {
    console.log(event)
  }

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

  function changeDirectory(directory: FileSystemDirectory) {
    setPathNodes(buildPathNodesFromDirectoryEntry(directory));
    const path = constructPath(directory);

    setPath(path);
  }

  function onFileOpen(file: DirectoryEntry) {
    if (file.node.kind === 'directory') {
      changeDirectory(file.node);
      recordHistory(file.node);
    } else {
      const path = constructPath(file.node);
      application.on({ kind: 'finder-open-file-event', path}, windowContext)
    }
  }

  useEffect(() => {
    const unsubscribe = application.subscribeToWindowEvents(windowContext.id, onWindowEvent);

    const directory = getFileSystemDirectoryByPath(application, path);
    if (directory.ok) {
      changeDirectory(directory.value);
      recordHistory(directory.value);
    }

    return () => {
      unsubscribe();
      clearHistory();
    }

  }, []);
  
  function onClickBreadcrumb(directory: FileSystemDirectory) {
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
  
  const locations = pathNodes.map((val, index) => <React.Fragment key={index}><button onClick={() => onClickBreadcrumb(val)}>{val.name}</button></React.Fragment>);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.folderActions}>
          <button disabled={!hasBackwardHistory()} onClick={() => goBackInHistory()}>prev</button>
          <button disabled={!hasForwardHistory()} onClick={() => goForwardInHistory()}>next</button>
        </div>
        <div className={styles.path}>
          { locations }
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.locations}>
          <ul>
            <li><button onClick={() => { onClickLocation('/Applications/'); }}>Applications</button></li>
            <li><button onClick={() => { onClickLocation('/Users/joey/'); }}>Home</button></li>
            <li><button onClick={() => { onClickLocation('/Users/joey/Desktop/'); }}>Desktop</button></li>
            <li><button onClick={() => { onClickLocation('/Users/joey/Documents'); }}>Documents</button></li> 
          </ul>
        </div>
        <div className={styles.folder}>
          <FolderView directory={path} apis={application.apis} onFileOpen={onFileOpen}></FolderView>
        </div>
      </div>
    </div>
  )
}
