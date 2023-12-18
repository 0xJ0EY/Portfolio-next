import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import styles from './NotesView.module.css';
import { useEffect, useRef, useState } from "react";
import { Application } from "../ApplicationManager";
import { Err, Ok, Result } from "result";
import { FileSystemTextFile } from "@/apis/FileSystem/FileSystem";

function getFileSystemTextNodeByPath(application: Application, path: string): Result<FileSystemTextFile, Error> {
  const node = application.apis.fileSystem.getNode(path);

  if (!node.ok) { return node }
  if (node.value.kind !== 'textfile') { return Err(Error("node type is not a textfile")); }

  return Ok(node.value);
}

export default function NotesApplicationView(props: WindowProps) {
  const { application, args } = props;
  const [ content, setContent ] = useState('');

  const textFileRef = useRef<FileSystemTextFile>();

  const path = args;

  function onSave() {
    if (!textFileRef.current) { return; }

    console.log(textFileRef.current);

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

  useEffect(() => {
    const file = loadFile(path);

    if (!file.ok) { return; }

    const unsubscribe = application.apis.fileSystem.subscribe(file.value, (evt) => { 
      console.log('notes event:', evt);
    });

    return () => { unsubscribe(); }
  }, []);

  return (
    <>
      <div>
        <button onClick={onSave}>Save</button>
      </div>
      <textarea
        className={styles['textarea']}
        value={content}
        onChange={(evt) => { setContent(evt.target.value); }}
      />
    </>
  );
}
