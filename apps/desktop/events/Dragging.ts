import { FileSystemNode } from "@/components/FileSystem/FileSystem";

export const FileSystemItemDragStart = "fs_item_drag_start";
export const FileSystemItemDragStop  = "fs_item_drag_stop";
export const FileSystemItemDragOver  = "fs_item_drag_over";

export interface FileSystemItemDragData {
  node: FileSystemNode
};

export type FileSystemItemDragStartEvent = CustomEvent<FileSystemItemDragData>;
export type FileSystemItemDragStopEvent = CustomEvent<FileSystemItemDragData>;
export type FileSystemItemDragOverEvent = CustomEvent<FileSystemItemDragData>;

export class DraggingService {

}
