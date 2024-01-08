import { Application, ApplicationConfig } from "@/applications/ApplicationManager";
import { Action } from "../../components/util";
import { Err, Ok, Result } from "result";
import { debugConfig } from "@/applications/Debug/DebugApplication";
import { aboutConfig } from "@/applications/About/About";
import { LocalWindowCompositor } from "../../components/WindowManagement/LocalWindowCompositor";
import { finderConfig } from "@/applications/Finder/Finder";
import { LocalApplicationManager } from "@/applications/LocalApplicationManager";
import { SystemAPIs } from "../../components/OperatingSystem";
import { BoundingBox, Point, rectangleIntersection } from "@/applications/math";
import { Chain, Node } from "@/data/Chain";
import { constructPath } from "./util";
import { notesConfig } from "@/applications/Notes/Notes";
import { doomConfig } from "@/applications/Doom/Doom";

export type DirectorySettings = {
  alwaysOpenAsIconView: boolean,
  sortBy: null, // TODO: Implement this
  sortDirection: 'horizontal' | 'vertical',
  sortOrigin: 'top-left' | 'top-right',
}

export type ApplicationIcon = {
  src: string,
  alt: string
}

export type DirectoryContent = {
  view: 'icons' | 'list',
  width: number,
  height: number,
  overflowBehavior: 'overflow' | 'overlay'
}

export type FileSystemNode = FileSystemDirectory | FileSystemTextFile | FileSystemApplication | FileSystemHyperLink;

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
  filenameExtension: '',
  settings: DirectorySettings,
  content: DirectoryContent,
  children: Chain<DirectoryEntry>
  editable: boolean,
  stickyBit: boolean,
};

export type FileSystemHyperLink = {
  id: number,
  parent: FileSystemDirectory,
  kind: 'hyperlink',
  filenameExtension: '',
  icon: ApplicationIcon,
  target: FileSystemNode,
  editable: boolean,
  name: string
}

export type FileSystemTextFile = {
  id: number,
  parent: FileSystemDirectory
  kind: 'textfile',
  filenameExtension: '.txt',
  name: string,
  content: string,
  editable: boolean
};

export type FileSystemApplication = {
  id: number,
  parent: FileSystemDirectory
  icon: ApplicationIcon,
  kind: 'application'
  name: string,
  filenameExtension: '',
  editable: boolean,
  entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application,
}

function createApplication(
  id: number,
  parent: FileSystemDirectory,
  name: string,
  icon: ApplicationIcon,
  entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application
): FileSystemApplication {
  return {
    id,
    parent,
    kind: 'application',
    name,
    filenameExtension: '',
    icon,
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
      width: 480,
      height: 800,
      overflowBehavior: 'overflow',
    },
    name: '/',
    filenameExtension: '',
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
      width: 480,
      height: 800,
      overflowBehavior: 'overflow',
    },
    name,
    filenameExtension: '',
    editable,
    stickyBit,
    children: new Chain()
  }
}

function createTextFile(id: number, parent: FileSystemDirectory, name: string, content: string, editable: boolean): FileSystemTextFile {
  return {
    id,
    parent,
    kind: 'textfile',
    name,
    filenameExtension: '.txt',
    content,
    editable,
  }
}

function createHyperLink(id: number, parent: FileSystemDirectory, target: FileSystemNode, name: string, icon: ApplicationIcon, editable: boolean): FileSystemHyperLink {
  return {
    id,
    parent,
    target,
    kind: 'hyperlink',
    filenameExtension: '',
    icon,
    name,
    editable
  }
}

export function getIconFromNode(node: FileSystemNode): ApplicationIcon {
  switch (node.kind) {
    case 'application':
    case 'hyperlink': return node.icon;
    case "directory": return { src: '/icons/folder-icon.png', alt: 'Directory icon' };
    case "hyperlink": return { src: '/icons/folder-icon.png', alt: 'Hyperlink icon' };
    case "textfile": return { src: '/icons/folder-icon.png', alt: 'File icon' }
  }
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
  fileSystem.addApplication(notesConfig);
  fileSystem.addApplication(doomConfig);

  // Create unix like /home folder (macOS also has one)
  fileSystem.addDirectory(root, 'home', false, false);

  // Create macOS like Users folder
  const users = fileSystem.addDirectory(root, 'Users', false, false);
  const joey = fileSystem.addDirectory(users, 'joey', false, false);

  const documents = fileSystem.addDirectory(joey, 'Documents', false, true);
  const trash = fileSystem.addDirectory(joey, 'Trash', false, true);

  const desktop = fileSystem.addDirectory(joey, 'Desktop', false, true);
  const tempIcon = { src: '/icons/folder-icon.png', alt: 'Hyperlink icon' };

  fileSystem.addHyperLink(desktop, documents, 'Documents', tempIcon, true);
  fileSystem.addHyperLink(desktop, trash, 'Trash', tempIcon, true);

  const text = `=====
== README
=====`;

  fileSystem.addTextFile(desktop, 'readme', text, true);

  return fileSystem;
}

export function addDebugAppToFileSystem(fs: FileSystem): void {
  fs.addApplication(debugConfig);
}

export function removeDebugAppFromFileSystem(fs: FileSystem): void {
  const debugApplication = fs.getApplication('/Applications/Debug.app');

  if (!debugApplication.ok) { return; }

  fs.removeNodeFromDirectory(debugApplication.value);
}

function entriesWithinSelection(entries: Point[], x: number, y: number, dimensions: { width: number, height: number }): number {
  const { width, height } = dimensions;
  // NOTE(Joey): The width & height are used for both the new incoming entry as the already existing entries.
  // It might be a good idea to make this static to the file system/configuration, instead of just randomly defined

  let overlapping = 0;

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

    if (overlap) { overlapping++; }
  }

  return overlapping;
}

function generatePosition(iteration: number, settings: DirectorySettings, content: DirectoryContent, boundingBox: BoundingBox): { x: number, y: number } {
  const direction = settings.sortDirection;
  const origin    = settings.sortOrigin;
  const gridWidth   = Math.floor(content.width / boundingBox.width);
  const gridHeight  = Math.floor(content.height / boundingBox.height);

  function positionX(iteration: number, direction: 'horizontal' | 'vertical'): number {
    switch (direction) {
      case "horizontal":
        return iteration % gridWidth;

      case "vertical":
        return Math.floor(iteration / gridHeight);
    }
  }

  function positionY(iteration: number, direction: 'horizontal' | 'vertical'): number {
    switch (direction) {
      case "horizontal":
        return Math.floor(iteration / gridWidth);

      case "vertical":
        return iteration % gridHeight;
    }
  }

  let x = positionX(iteration, direction) * boundingBox.width;
  if (origin === 'top-right') { x = (content.width - boundingBox.width) - x; }

  const y = positionY(iteration, direction) * boundingBox.height;

  return { x, y };
}

function generatePositionRange(settings: DirectorySettings, content: DirectoryContent, boundingBox: { width: number, height: number}): { x: number, y: number }[] {
  const horizontalSteps = Math.floor(content.width / boundingBox.width);
  const verticalSteps = Math.floor(content.height / boundingBox.height);

  let steps = [];

  const iterations = horizontalSteps * verticalSteps;

  for (let iteration = 0; iteration < iterations; iteration++) {
    steps.push(generatePosition(iteration, settings, content, boundingBox));
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
  const possiblePosition = positionRange.find(pos => entriesWithinSelection(others, pos.x, pos.y, nodeBoundingBox) === 0);

  if (possiblePosition) { return possiblePosition; }

  // Handle the not possible position behavior
  switch (content.overflowBehavior) {
    case 'overflow': {
      let iteration = positionRange.length;
      let position: { x: number, y: number };

      do {
        position = generatePosition(iteration++, settings, content, nodeBoundingBox);
      } while (entriesWithinSelection(others, position.x, position.y, nodeBoundingBox) !== 0);

      return position;
    };
    case 'overlay': {
      let iteration = 0;
      let round = 1;
      let position: { x: number, y: number };

      do {
        position = generatePosition(iteration++, settings, content, nodeBoundingBox);

        if (iteration !== 0 && iteration % positionRange.length === 0) {
          iteration = 0;
          round++;
        }

      } while(entriesWithinSelection(others, position.x, position.y, nodeBoundingBox) > round);

      return position;
    }
  }
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

export type NodeRefreshEvent = { kind: 'refresh' }
export type NodeUpdateEvent = { kind: 'update' }
export type NodeRenameEvent = { kind: 'rename', path: string }

export type NodeEventType = NodeRefreshEvent | NodeUpdateEvent | NodeRenameEvent;
export type NodeListener = (type: NodeEventType) => void;

export class FileSystem {
  private id: number;
  private root: FileSystemDirectory;
  private lookupTable: Record<string, FileSystemNode> = {};

  // The number used here, is equal to the id of the directory
  private nodeListeners: Record<number, (NodeListener)[]> = {};

  constructor() {
    this.root = createRootNode();
    this.lookupTable['/'] = this.root;
    this.id = 1; // Root is already 0
  }

  public subscribe(node: FileSystemNode, listener: NodeListener): Action<void> {
    if (!this.nodeListeners[node.id]) {
      this.nodeListeners[node.id] = [];
    }

    this.nodeListeners[node.id].push(listener);

    return () => { this.unsubscribe(node, listener); }
  }

  public unsubscribe(node: FileSystemNode, listener: NodeListener) {
    for (const [index, entry] of this.nodeListeners[node.id].entries()) {
      if (entry === listener) {
        this.nodeListeners[node.id].splice(index);
        return;
      }
    }
  }

  public propagateNodeEvent(node: FileSystemNode, type: NodeEventType) {
    const listeners = this.nodeListeners[node.id];
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

        const newLookupPath = constructPath(node);
        this.lookupTable[newLookupPath] = node;

        this.propagateNodeEvent(node, {kind: 'rename', path: newLookupPath});
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

    // We need the name to be at the very least 1 character
    if (name.length < 1) {
      return Err(Error("The name is too short"));
    }

    const oldLookupPath = constructPath(node);

    node.name = name;

    const newLookupPath = constructPath(node);

    if (oldLookupPath !== newLookupPath) {
      this.updateLookupTableWithPrefix(oldLookupPath);
    }

    this.propagateNodeEvent(node, { kind: 'rename', path: newLookupPath });
    this.propagateNodeEvent(node.parent, { kind: 'update' });

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

    // Inform the old parent that the node has been removed
    if (node.parent) { this.propagateNodeEvent(node.parent, { kind: 'update' }); }

    const entry = this.addNodeToDirectory(directory, node);

    // Add new path to lookup table
    this.lookupTable[constructPath(node)] = node;

    // Inform the new parent that a node has been added
    if (node.parent) { this.propagateNodeEvent(node.parent, { kind: 'update' }); }

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

    const application = createApplication(++this.id, parent, config.appName, config.appIcon, config.entrypoint);

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

  public addTextFile(parent: FileSystemDirectory, name: string, content: string, editable: boolean): FileSystemTextFile {
    const textFile = createTextFile(++this.id, parent, name, content, editable);

    this.addNodeToDirectory(parent, textFile);

    this.lookupTable[constructPath(textFile)] = textFile;

    return textFile;
  }

  public addHyperLink(parent: FileSystemDirectory, target: FileSystemNode, name: string, icon: ApplicationIcon, editable: boolean) {
    const hyperlink = createHyperLink(++this.id, parent, target, name, icon, editable);

    this.addNodeToDirectory(parent, hyperlink);

    this.lookupTable[constructPath(hyperlink)] = hyperlink;

    return hyperlink;
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
