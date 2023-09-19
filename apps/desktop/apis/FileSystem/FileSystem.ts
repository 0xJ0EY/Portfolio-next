import { Application, ApplicationConfig } from "@/applications/ApplicationManager";
import { Action, Err, Ok, Result } from "../../components/util";
import { infoConfig } from "@/applications/InfoApplication";
import { aboutConfig } from "@/applications/AboutApplication";
import { LocalWindowCompositor } from "../../components/WindowManagement/LocalWindowCompositor";
import { finderConfig } from "@/applications/Finder/Finder";
import { LocalApplicationManager } from "@/applications/LocalApplicationManager";
import { SystemAPIs } from "../../components/OperatingSystem";
import { Point, rectangleIntersection } from "@/applications/math";
import { Chain, Node } from "@/data/Chain";

type DirectorySettings = {
  alwaysOpenAsIconView: boolean,
  sortBy: null, // TODO: Implement this
  sortDirection: 'horizontal' | 'vertical',
  sortOrigin: 'top-left' | 'top-right',
}

type DirectoryContent = {
  view: 'icons' | 'list',
  width: number,
  height: number
}

export type FileSystemNode = FileSystemDirectory | FileSystemFile | FileSystemApplication;

export type DirectoryEntry = {
  node: FileSystemNode,
  x: number,
  y: number
}

export type FileSystemDirectory = {
  id: number,
  parent: FileSystemDirectory | null
  kind: 'directory',
  name: string,
  settings: DirectorySettings,
  content: DirectoryContent,
  children: Chain<DirectoryEntry>
  editable: boolean,
  stickyBit: boolean,
};

export type FileSystemFile = {
  id: number,
  parent: FileSystemDirectory
  kind: 'file',
  name: string,
  editable: boolean
};

export type FileSystemApplication = {
  id: number,
  parent: FileSystemDirectory
  kind: 'application'
  name: string,
  editable: boolean,
  entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application,
}

function createApplication(
  id: number,
  parent: FileSystemDirectory,
  name: string,
  entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application
): FileSystemApplication {
  return {
    id,
    parent,
    kind: 'application',
    name,
    editable: false,
    entrypoint
  }
}

function createRootNode(): FileSystemDirectory {
  return {
    id: 0,
    parent: null,
    kind: 'directory',
    settings: {
      alwaysOpenAsIconView: false,
      sortBy: null, // TODO: Implement this
      sortDirection: 'horizontal',
      sortOrigin: 'top-left',
    },
    content: {
      view: 'icons',
      width: 800,
      height: 400
    },
    name: '/',
    editable: false,
    stickyBit: false,
    children: new Chain()
  }
}

function createDirectory(id: number, parent: FileSystemDirectory, name: string, editable: boolean, stickyBit: boolean): FileSystemDirectory {
  return {
    id,
    parent,
    kind: 'directory',
    settings: {
      alwaysOpenAsIconView: false,
      sortBy: null, // TODO: Implement this
      sortDirection: 'horizontal',
      sortOrigin: 'top-left',
    },
    content: {
      view: 'icons',
      width: 800,
      height: 400
    },
    name,
    editable,
    stickyBit,
    children: new Chain()
  }
}

export function constructPath(node: FileSystemNode): string {
  let currentNode: FileSystemNode = node;
  let directories = [];

  // Adds a backwards slash to end end of the path, if it is a directory
  if (node.kind === 'directory') { directories.push(''); }

  while (currentNode.parent !== null) {
    directories.push(currentNode.name);
    currentNode = currentNode.parent;
  }

  directories.push(''); // Adds a backwards slash for the root

  const path = directories.reverse().join('/');

  return path;
}

export function createBaseFileSystem(): FileSystem {
  const fileSystem = new FileSystem();
  const rootEntry = fileSystem.getDirectory('/');

  if (!rootEntry.ok) { return fileSystem; }
  const root = rootEntry.value;

  // Create base file tree
  fileSystem.addDirectory(root, 'Applications', false, false);

  fileSystem.addApplication(finderConfig);
  fileSystem.addApplication(aboutConfig);
  fileSystem.addApplication(infoConfig);

  // Create unix like /home folder (macOS also has one)
  fileSystem.addDirectory(root, 'home', false, false);

  // Create macOS like Users folder
  const users = fileSystem.addDirectory(root, 'Users', false, false);
  const joey = fileSystem.addDirectory(users, 'joey', false, false);
  const desktop = fileSystem.addDirectory(joey, 'Desktop', false, true);
  fileSystem.addDirectory(desktop, 'foo', true, true);
  fileSystem.addDirectory(desktop, 'bar', true, true);

  const documents = fileSystem.addDirectory(joey, 'Documents', false, true);

  return fileSystem;
}

function entriesWithinSelection(entries: Point[], x: number, y: number, dimensions: { width: number, height: number }): boolean {
  const { width, height } = dimensions;
  // NOTE(Joey): The width & height are used for both the new incoming entry as the already existing entries.
  // It might be a good idea to make this static to the file system/configuration, instead of just randomly defined

  for (const entry of entries) {
    const a = {
      x1: x,
      x2: x + width,
      y1: y,
      y2: y + height
    };

    const b = {
      x1: entry.x,
      x2: entry.x + width,
      y1: entry.y,
      y2: entry.y + height
    };

    const overlap = rectangleIntersection(a, b);

    if (overlap) { return true; }
  }

  return false;
}

function generatePositionRange(settings: DirectorySettings, content: DirectoryContent, boundingBox: { width: number, height: number}): { x: number, y: number }[] {
  const direction = settings.sortDirection;
  const origin  = settings.sortOrigin;

  const horizontalSteps = Math.floor(content.width / boundingBox.width);
  const verticalSteps = Math.floor(content.height / boundingBox.height);

  let steps = [];

  function positionX(iteration: number, direction: 'horizontal' | 'vertical'): number {

    switch (direction) {
      case "horizontal":
        if (origin === 'top-right') {
          return horizontalSteps - iteration % horizontalSteps;
        } else {
          return iteration % horizontalSteps;
        }

      case "vertical":
        return Math.floor(iteration / verticalSteps);
    }
  }

  function positionY(iteration: number, direction: 'horizontal' | 'vertical'): number {
    switch (direction) {
      case "horizontal":
        return Math.floor(iteration / horizontalSteps);

      case "vertical":
        return iteration % verticalSteps;
    }
  }

  const iterations = horizontalSteps * verticalSteps;

  for (let iteration = 0; iteration < iterations; iteration++) {
    const x = positionX(iteration, direction) * boundingBox.width;
    const y = positionY(iteration, direction) * boundingBox.height;

    steps.push({ x, y });
  }

  return steps;
}

export function calculateNodePosition(
  settings: DirectorySettings,
  content: DirectoryContent,
  others: Point[]
): { x: number, y: number } {
  const nodeBoundingBox = { width: 120, height: 80 };

  const positionRange = generatePositionRange(settings, content, nodeBoundingBox);
  const possiblePosition = positionRange.find(pos => !entriesWithinSelection(others, pos.x, pos.y, nodeBoundingBox));

  // TODO: handle not having a possible position
  if (!possiblePosition) { return { x: 0, y: 0 }; }

  return possiblePosition;
}

export function findNodeInDirectoryChain(directory: FileSystemDirectory, node: FileSystemNode): Result<Node<DirectoryEntry>, Error> {
  for (const entry of directory.children.iterFromTail()) {
    if (entry.value.node.id === node.id) {
      return Ok(entry);
    }
  }

  return Err(Error("Unable to find node within the directory chain"));
}

function isParentOfTargetDirectory(directory: FileSystemDirectory, node: FileSystemNode): boolean {
  let currentDir: FileSystemDirectory | null = directory;

  while (currentDir) {
    if (currentDir.id === node.id) {
      return true;
    }

    currentDir = currentDir.parent;
  }

  return false;
}

function isEditable(node: FileSystemNode | null): boolean {
  // If no node is given (parent not existing) the node should not be editable, as this case should never happen
  if (!node) { return false; }

  return node.editable;
}

function targetDirectoryAllowsModification(directory: FileSystemDirectory): boolean {
  return directory.editable || directory.stickyBit;
}

export type DirectoryEventType = 'refresh' | 'update';
export type DirectoryListener = (type: DirectoryEventType) => void;

export class FileSystem {
  private id: number;
  private root: FileSystemDirectory;
  private lookupTable: Record<string, FileSystemNode> = {};

  // The number used here, is equal to the id of the directory
  private directoryListeners: Record<number, (DirectoryListener)[]> = {};

  constructor() {
    this.root = createRootNode();
    this.lookupTable['/'] = this.root;
    this.id = 1; // Root is already 0
  }

  public subscribe(directory: FileSystemDirectory, listener: DirectoryListener): Action<void> {
    if (!this.directoryListeners[directory.id]) {
      this.directoryListeners[directory.id] = [];
    }

    this.directoryListeners[directory.id].push(listener);

    return () => { this.unsubscribe(directory, listener); }
  }

  public unsubscribe(directory: FileSystemDirectory, listener: DirectoryListener) {
    for (const [index, entry] of this.directoryListeners[directory.id].entries()) {
      if (entry === listener) {
        this.directoryListeners[directory.id].splice(index);
        return;
      }
    }
  }

  public propagateDirectoryEvent(directory: FileSystemDirectory, type: DirectoryEventType) {
    const listeners = this.directoryListeners[directory.id];
    if (!listeners) { return; }

    for (const listener of listeners) { listener(type); }
  }

  public getNode(path: string): Result<FileSystemNode, Error> {
    const node = this.lookupTable[path];

    if (!node) {
      return Err(Error("Node not found"));
    }

    return Ok(node);
  }

  private updateLookupTableWithPrefix(prefix: string) {
    Object.entries(this.lookupTable)
      .filter(([key]) => key.startsWith(prefix))
      .forEach(([path, node]) => {
        delete this.lookupTable[path];

        this.lookupTable[constructPath(node)] = node;
      });
  }

  public renameNode(node: FileSystemNode, name: string): Result<FileSystemNode, Error> {
    function filenameExistsInParent(parent: FileSystemDirectory, name: string): boolean {
      for (const file of parent.children.iterFromTail()) {
        if (file.value.node.name === name) {
          return true;
        }
      }

      return false;
    }

    // We only check for a duplicate names
    if (!node.parent) {
      return Err(Error("A parent is required, to rename the directory"));
    }

    // We allow any other name, like Apple's HFS+
    if (filenameExistsInParent(node.parent, name)) {
      return Err(Error("Duplicate filename"));
    }

    const oldLookupPath = constructPath(node);

    node.name = name;

    const newLookupPath = constructPath(node);

    if (oldLookupPath !== newLookupPath) {
      this.updateLookupTableWithPrefix(oldLookupPath);
    }

    this.propagateDirectoryEvent(node.parent, 'update');

    return Ok(node);
  }

  public moveNode(node: FileSystemNode, directory: FileSystemDirectory): Result<DirectoryEntry, Error> {
    // Check if the node was a parent of the target directory
    if (isParentOfTargetDirectory(directory, node)) {
      return Err(Error("Node is a parent of the target directory"));
    }

    if (!isEditable(node)) {
      return Err(Error("Node or target directory is not editable"));
    }

    if (!targetDirectoryAllowsModification(directory)) {
      return Err(Error("Target directory does not allow modification"));
    }

    // Remove old path from lookup table
    const path = constructPath(node);
    if (this.lookupTable[path]) { delete this.lookupTable[path]; }

    this.removeNodeFromDirectory(node);
    const entry = this.addNodeToDirectory(directory, node);

    // Add new path to lookup table
    this.lookupTable[constructPath(node)] = node;

    return Ok(entry);
  }

  public getApplication(path: string): Result<FileSystemApplication, Error> {
    const node = this.getNode(path);

    if (!node.ok) { return node; }

    if (node.value.kind !== 'application') {
      return Err(Error("Node is not an application"))
    }

    return Ok(node.value);
  }

  public getDirectory(path: string): Result<FileSystemDirectory, Error> {
    if (!path.endsWith('/')) { path += '/'; }

    const node = this.getNode(path);

    if (!node.ok) { return node; }

    if (node.value.kind !== 'directory') {
      return Err(Error("Node is not a directory"));
    }

    return Ok(node.value);
  }

  public addApplication(config: ApplicationConfig): Result<FileSystemApplication, Error> {
    const parent = this.lookupTable[config.path];
    if (parent.kind !== 'directory') { return Err(Error("Parent is not a directory")); }

    const application = createApplication(++this.id, parent, config.appName, config.entrypoint);

    this.addNodeToDirectory(parent, application);

    this.lookupTable[constructPath(application)] = application;

    return Ok(application);
  }

  public addDirectory(parent: FileSystemDirectory, name: string, editable: boolean, editableContent: boolean): FileSystemDirectory {
    const directory = createDirectory(++this.id, parent, name, editable, editableContent);

    this.addNodeToDirectory(parent, directory);

    this.lookupTable[constructPath(directory)] = directory;

    return directory;
  }

  public addNodeToDirectory(directory: FileSystemDirectory, node: FileSystemNode): DirectoryEntry {
    const { x, y } = calculateNodePosition(
      directory.settings,
      directory.content,
      directory.children.toArray()
    );

    node.parent = directory;

    const entry: DirectoryEntry = {
      node,
      x,
      y,
    };

    directory.children.append(entry);

    return entry;
  }

  public removeNodeFromDirectory(node: FileSystemNode) {
    const parentDirectory = node.parent;
    if (!parentDirectory) { return; }

    const chainNode = findNodeInDirectoryChain(parentDirectory, node);
    if (!chainNode.ok) { return; }

    const result = chainNode.value;
    parentDirectory.children.unlink(result);
  }
}
