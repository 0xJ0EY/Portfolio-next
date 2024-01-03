import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import styles from './NotesView.module.css';
import { useEffect, useRef, useState } from "react";
import { Application } from "../ApplicationManager";
import { Err, Ok, Result } from "result";
import { FileSystemTextFile } from "@/apis/FileSystem/FileSystem";
import { constructPath, generateUniqueNameForDirectory } from "@/apis/FileSystem/util";
import { useTranslation } from "react-i18next";

function getFileSystemTextNodeByPath(application: Application, path: string): Result<FileSystemTextFile, Error> {
  const node = application.apis.fileSystem.getNode(path);

  if (!node.ok) { return node }
  if (node.value.kind !== 'textfile') { return Err(Error("node type is not a textfile")); }

  return Ok(node.value);
}

export default function NotesApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const [ content, setContent ] = useState('');

  const fs = application.apis.fileSystem;
  const { t } = useTranslation('common');

  const textFileRef = useRef<FileSystemTextFile>();

  const path = args;

  function createOnSave() {
    const documentsDirectory = fs.getDirectory('/Users/joey/Documents/');
    if (!documentsDirectory.ok) { return;}

    const template = t('filesystem.new_file');
    const title = generateUniqueNameForDirectory(documentsDirectory.value, template);
    const textFile = fs.addTextFile(documentsDirectory.value, title, content, true);

    textFileRef.current = textFile;
    updateWindowTitle(textFile);
  }

  function onSave() {
    if (!textFileRef.current) { createOnSave(); return; }

    textFileRef.current.content = content;
  }

  function loadFile(path: string): Result<FileSystemTextFile, Error> {
    const file = getFileSystemTextNodeByPath(application, path);

    if (!file.ok) { return file; }
    const value = file.value;

    setContent(value.content);
    textFileRef.current = value;

    return file;
  }

  function updateWindowTitle(file: FileSystemTextFile) {
    const window = application.compositor.getById(windowContext.id);
    if (!window) { return; }

    const path = constructPath(file);

    window.title = `${path} - Notes`

    application.compositor.update(window);
  }

  useEffect(() => {
    const file = loadFile(path);

    if (!file.ok) { return; }

    const unsubscribe = fs.subscribe(file.value, (evt) => {
      updateWindowTitle(file.value);
    });

    updateWindowTitle(file.value);

    return () => { unsubscribe(); }
  }, []);

  return (
    <>
      <div>
        <button className="system-button" onClick={onSave}>Save</button>
      </div>
      <textarea
        className={styles['textarea']}
        value={content}
        onChange={(evt) => { setContent(evt.target.value); }}
      />
    </>
  );
}
