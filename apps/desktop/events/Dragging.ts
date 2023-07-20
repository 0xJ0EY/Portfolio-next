import { FileSystemNode } from "@/components/FileSystem/FileSystem";

export const FileSystemItemDragStart = "fs_item_drag_start";
export const FileSystemItemDragStop  = "fs_item_drag_stop";

export const FileSystemItemDragEnter = "fs_item_drag_enter";
export const FileSystemItemDragOver  = "fs_item_drag_over";
export const FileSystemItemDragLeave = "fs_item_drag_leave";

export interface FileSystemItemDragData {
  node: FileSystemNode
};

export type FileSystemItemDragStartEvent = CustomEvent<FileSystemItemDragData>;
export type FileSystemItemDragStopEvent = CustomEvent<FileSystemItemDragData>;
export type FileSystemItemDragOverEvent = CustomEvent<FileSystemItemDragData>;

export class DragAndDropService {

}
