import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useState, useEffect } from "react";
import FolderView from "@/components/Folder/FolderView";
import { ApplicationWindowEvent } from "../ApplicationEvents";
import { DirectoryEntry, constructPath } from "@/apis/FileSystem/FileSystem";

export default function FinderView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const [ path, setPath ] = useState(args);

  function onWindowEvent(event: ApplicationWindowEvent) {
    console.log(event)
  }

  function onFileOpen(file: DirectoryEntry) {
    const path = constructPath(file.node);

    if (file.node.kind === 'directory') {
      setPath(path);
    } else {
      application.on({ kind: 'finder-open-file-event', path}, windowContext)
    }
  }

  useEffect(() => {
    const unsubscribe = application.subscribeToWindowEvents(windowContext.id, onWindowEvent);

    return () => { unsubscribe(); }
  }, []);

  return (
    <FolderView directory={path} apis={application.apis} onFileOpen={onFileOpen}></FolderView>
  )
}
