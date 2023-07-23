import { FileSystem, FileSystemNode } from '@/apis/FileSystem/FileSystem';
import { useState, useEffect } from 'react';
import { SystemAPIs } from '../Desktop';
import dynamic from 'next/dynamic';

const DesktopIcon = dynamic(() => import('../Icons/DesktopIcon'));

// TODO: (Group) Selection of files

type Props = {
  directory: string,
  apis: SystemAPIs
}

export default function FolderView({ directory, apis }: Props) {
  const fs = apis.fileSystem;

  const [files, setFiles] = useState<FileSystemNode[]>([]);

  function loadFiles(directory: string) {
    // TODO: Add something like a subscription for directory changes
    const dir = fs.getDirectory(directory);
    if (!dir.ok) { return; }

    console.log(dir.value.children);

    setFiles(dir.value.children);
  }

  useEffect(() => {
    loadFiles(directory);
  }, []);

  const icons = files.map((x, index) => <DesktopIcon key={index} file={x} apis={apis} />);
  
  return <>{icons}</>
}