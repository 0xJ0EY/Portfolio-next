import { DragAndDropData } from "@/apis/DragAndDrop/DragAndDrop";
import { SystemAPIs } from "./OperatingSystem";
import { useEffect, useState } from "react";
import { DirectoryEntry } from "@/apis/FileSystem/FileSystem";
import dynamic from 'next/dynamic';

const DesktopIcon = dynamic(() => import('./Icons/DesktopIcon'))

export function DragAndDropView(props: { apis: SystemAPIs }) {
  const dragAndDrop = props.apis.dragAndDrop;
  const [files, setFiles] = useState<DirectoryEntry[]>([]);

  function onDragEvent(data: DragAndDropData) {
    switch (data.action) {
      case 'start':
      case 'move':
        const selectedFiles: DirectoryEntry[] = data.files.nodes.map(x => {
          return {
            node: x.item,
            x: data.x - x.offset.x,
            y: data.y - x.offset.y,
            selected: false,
            dragging: true
          }
        });

        setFiles(selectedFiles);
        break;
      case 'drop':
        setFiles([]);
        break;
    }
  }

  useEffect(() => {
    const unsubscribe = dragAndDrop.subscribe(onDragEvent);

    return () => { unsubscribe(); }
  }, []);

  const icons = files.map((entry, index) => <DesktopIcon key={index} entry={entry} index={index} />);

  return <>{icons}</>;
}
