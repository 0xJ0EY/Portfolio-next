import { WindowContext } from "@/components/WindowManagement/WindowCompositor";
import { Application } from "../ApplicationManager";
import { useState } from "react";
import FolderView from "@/components/Folder/FolderView";

export default function FinderView(props: { application: Application, windowContext: WindowContext }) {
  const { application, windowContext } = props;
  const [ path, setPath ] = useState("/");

  return (
    <FolderView directory={path} apis={application.apis}></FolderView>
  )
}
