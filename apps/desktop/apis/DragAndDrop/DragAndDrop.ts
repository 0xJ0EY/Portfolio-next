import { FileSystemNode } from "@/apis/FileSystem/FileSystem";

export const FileSystemItemDragEnter = "fs_item_drag_enter";
export const FileSystemItemDragLeave = "fs_item_drag_leave";
export const FileSystemItemDragDrop  = "fs_item_drag_drop";

export interface FileSystemItemDragData {
  node: FileSystemNode
};

export type FileSystemItemDragEvent = CustomEvent<FileSystemItemDragData>;

export type DragAndDropListener = (data: DragAndDropData) => void;
export type Action<T> = () => T

export interface DragAndDropData {
  action: 'start' | 'move' | 'drop',
  file: FileSystemNode,
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
  constructor(private context: DragAndDropContext, private file: FileSystemNode) {}

  public start(x: number, y: number) {
    this.context.propagate({
      action: 'start',
      file: this.file,
      x,
      y
    });
  }

  public move(x: number, y: number) {
    this.context.propagate({
      action: 'move',
      file: this.file,
      x,
      y
    });
  }

  public drop(x: number, y: number) {
    this.context.propagate({
      action: 'drop',
      file: this.file,
      x,
      y
    });
  }
}

export class DragAndDropService {
  private context = new DragAndDropContext();

  public start(file: FileSystemNode, x: number, y: number) {
    const session = new DragAndDropSession(this.context, file);

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
