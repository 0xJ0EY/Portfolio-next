import { FileSystemNode } from "@/apis/FileSystem/FileSystem";
import { Point } from "@/applications/math";
import { Action } from "@/components/util";

export const FileSystemItemDragEnter = "fs_item_drag_enter";
export const FileSystemItemDragMove  = "fs_item_drag_move";
export const FileSystemItemDragLeave = "fs_item_drag_leave";
export const FileSystemItemDragDrop = "fs_item_drag_drop";

export interface ItemDragNode {
  item: FileSystemNode,
  position: Point,
  offset: Point
}

export interface FileSystemItemDragData {
  nodes: ItemDragNode[],
};

export type FileSystemItemDragEvent = CustomEvent<FileSystemItemDragData>;

export type DragAndDropListener = (data: DragAndDropData) => void;

export interface DragAndDropData {
  action: 'start' | 'move' | 'drop',
  files: FileSystemItemDragData,
  x: number,
  y: number,
}

class DragAndDropContext {
  private listeners: (DragAndDropListener)[] = [];

  public subscribe(listener: DragAndDropListener): Action<void> {
    this.listeners.push(listener)

    return () => { this.unsubscribe(listener); }
  }

  public unsubscribe(listener: DragAndDropListener) {
    for (const [index, entry] of this.listeners.entries()) {
      if (entry === listener) {
        this.listeners.splice(index);
        return;
      }
    }
  }

  public propagate(data: DragAndDropData) {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export class DragAndDropSession {
  constructor(private context: DragAndDropContext, private files: FileSystemItemDragData) {}

  public start(x: number, y: number) {
    this.context.propagate({
      action: 'start',
      files: this.files,
      x,
      y
    });
  }

  public move(x: number, y: number) {
    this.context.propagate({
      action: 'move',
      files: this.files,
      x,
      y
    });
  }

  public drop(x: number, y: number) {
    this.context.propagate({
      action: 'drop',
      files: this.files,
      x,
      y
    });
  }
}

export class DragAndDropService {
  private context = new DragAndDropContext();

  public start(files: FileSystemItemDragData, x: number, y: number) {
    const session = new DragAndDropSession(this.context, files);

    session.start(x, y);

    return session;
  }

  public subscribe(listener: DragAndDropListener): Action<void> {
    return this.context.subscribe(listener);
  }

  public unsubscribe(listener: DragAndDropListener) {
    this.context.unsubscribe(listener);
  }
}
