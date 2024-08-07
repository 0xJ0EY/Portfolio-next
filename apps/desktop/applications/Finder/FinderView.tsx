import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useState, useEffect, useRef } from "react";
import FolderView from "@/components/Folder/FolderView";
import { FileSystemDirectory, FileSystemNode } from "@/apis/FileSystem/FileSystem";
import styles from './FinderView.module.css';
import { Application } from "../ApplicationManager";
import React from "react";
import { Chain, Node } from "@/data/Chain";
import { Err, Ok, Result } from "result";
import { constructPath, generateUniqueNameForDirectory } from "@/apis/FileSystem/util";
import { useTranslation } from "react-i18next";
import { ScreenResolution } from "@/apis/Screen/ScreenService";

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
  const [needsMobileView, setNeedsMobileView] = useState(false);

  const apis = props.application.apis;

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

  function createTextFile() {
    if (!canEdit) { return; }

    const dir = fs.getDirectory(path);
    if (!dir.ok) { return; }

    const template = t('filesystem.new_file');
    const name = generateUniqueNameForDirectory(dir.value, template);

    const noop = () => {};

    application.compositor.prompt(windowContext.id, t('finder.create_text_file_instructions'), name)
      .then((name) => {
        if (fs.getNode(`${path}${name}.txt`).ok) {
          application.compositor.alert(windowContext.id, t('finder.create_text_file_duplicated_name')).catch(noop);
          return;
        }
        
        fs.addTextFile(dir.value, name, "", true);
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

    setCanEdit(directory.editable || directory.editableContent);

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

  function onScreenChangeListener(resolution: ScreenResolution): void {
    setNeedsMobileView(resolution.isMobileDevice());
  }

  useEffect(() => {
    const directory = getFileSystemDirectoryByPath(application, path);
    const unsubscribe = apis.screen.subscribe(onScreenChangeListener);

    const resolution = apis.screen.getResolution();
    if (resolution) { onScreenChangeListener(resolution); }

    if (directory.ok) {
      changeDirectory(directory.value);
      recordHistory(directory.value);
    }

    return () => {
      unsubscribe();
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

  const mobileClass = needsMobileView ? styles['mobile'] : '';
  
  const locations = pathNodes.map((val, index) => <React.Fragment key={index}><button className={['system-button', styles.breadcrumb].join(' ')} onClick={() => onClickBreadcrumb(val, index)}>{val.name}</button></React.Fragment>);
 
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.locations}>
          <div className={styles.header}>
            <button className={["system-button spritesheet-btn", styles['header-left']].join(' ')} disabled={!hasBackwardHistory()} onClick={() => goBackInHistory()}><div className={['spritesheet-btn-icon', styles['icon-prev']].join(' ')}></div></button>
            <button className={["system-button spritesheet-btn", styles['header-left']].join(' ')} disabled={!hasForwardHistory()} onClick={() => goForwardInHistory()}><div className={['spritesheet-btn-icon', styles['icon-next']].join(' ')}></div></button>
            <button className={["system-button spritesheet-btn", styles['header-right']].join(' ')} disabled={!canEdit} onClick={() => createDirectory()}><div className={['spritesheet-btn-icon', styles['icon-create-directory']].join(' ')}></div></button>
            <button className={["system-button spritesheet-btn", styles['header-right']].join(' ')} disabled={!canEdit} onClick={() => createTextFile()}><div className={['spritesheet-btn-icon', styles['icon-create-file']].join(' ')}></div></button>
          </div>

          {t("finder.favorites")}
          <ul>
            <li><button className={`system-button ${styles['navigation-btn']} ${mobileClass}`} onClick={() => { onClickLocation('/Applications/'); }}>Applications</button></li>
            <li><button className={`system-button ${styles['navigation-btn']} ${mobileClass}`} onClick={() => { onClickLocation('/Users/joey/'); }}>Home</button></li>
            <li><button className={`system-button ${styles['navigation-btn']} ${mobileClass}`} onClick={() => { onClickLocation('/Users/joey/Desktop/'); }}>Desktop</button></li>
            <li><button className={`system-button ${styles['navigation-btn']} ${mobileClass}`} onClick={() => { onClickLocation('/Users/joey/Documents'); }}>Documents</button></li>
          </ul>
        </div>
        <div className={styles.folder}>
          <div className={styles.path}>
            { locations }
          </div>
          <FolderView directory={path} apis={application.apis} onFileOpen={onFileOpen} allowOverflow={true}></FolderView>
        </div>
      </div>
    </div>
  )
}
