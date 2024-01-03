import { DragAndDropData } from "@/apis/DragAndDrop/DragAndDrop";
import { SystemAPIs } from "./OperatingSystem";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { FolderIconEntry } from "./Icons/FolderIcon";

const FolderIcon = dynamic(() => import('./Icons/FolderIcon'))

export function DragAndDropView(props: { apis: SystemAPIs }) {
  const dragAndDrop = props.apis.dragAndDrop;
  const [files, setFiles] = useState<FolderIconEntry[]>([]);

  function onDragEvent(data: DragAndDropData) {
    switch (data.action) {
      case 'start':
      case 'move':
        const selectedFiles: FolderIconEntry[] = data.files.nodes.map(entry => {
          const [x, y] = [
            data.x - entry.offset.x,
            data.y - entry.offset.y,
          ];

          return {
            entry: {
              node: entry.item,
              x, y,
            },
            x, y,
            selected: false,
            dragging: true,
            editing: { active: false, value: entry.item.name }
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

  const icons = files.map((entry, index) => <FolderIcon key={index} folderIconEntry={entry} index={index} />);

  return <>{icons}</>;
}
