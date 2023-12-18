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

  function loadFile(path: string) {
    const file = getFileSystemTextNodeByPath(application, path);
    
    if (!file.ok) { return; }
    const value = file.value;
    
    setContent(value.content);

    textFileRef.current = value;
  }

  useEffect(() => {
    loadFile(path);
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
