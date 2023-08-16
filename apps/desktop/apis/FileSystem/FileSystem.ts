import { Application, ApplicationConfig, ApplicationManager } from "@/applications/ApplicationManager";
import { Err, Ok, Result } from "../../components/util";
import { infoConfig } from "@/applications/InfoApplication";
import { aboutConfig } from "@/applications/AboutApplication";
import { LocalWindowCompositor } from "../../components/WindowManagement/LocalWindowCompositor";
import { finderConfig } from "@/applications/Finder/Finder";
import { LocalApplicationManager } from "@/applications/LocalApplicationManager";
import { SystemAPIs } from "../../components/OperatingSystem";
import { rectangleIntersection } from "@/applications/math";
import { Chain } from "@/data/Chain";

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

export type DirectoryEntry = {
  node: FileSystemNode,
  x: number,
  y: number,
  selected: boolean,
}

export type FileSystemDirectory = {
  id: number,
  parent: FileSystemDirectory | null
  kind: 'directory',
  name: string,
  settings: DirectorySettings,
  content: DirectoryContent,
  children: Chain<DirectoryEntry>
  editable: boolean
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

export type FileSystemNode = FileSystemDirectory | FileSystemFile | FileSystemApplication

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
    children: new Chain()
  }
}

function createDirectory(id: number, parent: FileSystemDirectory, name: string, editable: boolean): FileSystemDirectory {
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
    children: new Chain()
  }
}

function constructPath(node: FileSystemNode): string {
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
  fileSystem.addDirectory(root, 'Applications', false);

  fileSystem.addApplication(finderConfig);
  fileSystem.addApplication(aboutConfig);
  fileSystem.addApplication(infoConfig);

  // Create unix like /home folder (macOS also has one)
  fileSystem.addDirectory(root, 'home', false);

  // Create macOS like Users folder
  const users = fileSystem.addDirectory(root, 'Users', false);
  const joey = fileSystem.addDirectory(users, 'joey', false);
  const desktop = fileSystem.addDirectory(joey, 'Desktop', false);
  fileSystem.addDirectory(desktop, 'foo', true);
  fileSystem.addDirectory(desktop, 'bar', true);

  return fileSystem;
}

function entriesWithinSelection(entries: DirectoryEntry[], x: number, y: number, dimensions: { width: number, height: number }): boolean {
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

function calculateNodePosition(
  settings: DirectorySettings,
  content: DirectoryContent,
  others: DirectoryEntry[]
): { x: number, y: number } {
  const nodeBoundingBox = { width: 120, height: 80 };

  const positionRange = generatePositionRange(settings, content, nodeBoundingBox);
  const possiblePosition = positionRange.find(pos => !entriesWithinSelection(others, pos.x, pos.y, nodeBoundingBox));

  // TODO: handle not having a possible position
  if (!possiblePosition) { return { x: 0, y: 0 }; }

  return possiblePosition;
}

export function addNodeToDirectory(directory: FileSystemDirectory, node: FileSystemNode) {

  console.log('Adding node: ' + node.name + ' to ' + directory.name);

  const { x, y } = calculateNodePosition(
    directory.settings,
    directory.content,
    directory.children.toArray()
  );

  const entry: DirectoryEntry = {
    node,
    x,
    y,
    selected: false
  };

  directory.children.append(entry);
}

export class FileSystem {
  private id: number;
  private root: FileSystemDirectory;
  private lookupTable: Record<string, FileSystemNode> = {};

  constructor() {
    this.root = createRootNode();
    this.lookupTable['/'] = this.root;
    this.id = 1; // Root is already 0
  }

  public getNode(path: string): Result<FileSystemNode, Error> {
    const node = this.lookupTable[path];

    if (!node) {
      return Err(Error("Node not found"));
    }

    return Ok(node);
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

    addNodeToDirectory(parent, application);

    this.lookupTable[constructPath(application)] = application;

    return Ok(application);
  }

  public addDirectory(parent: FileSystemDirectory, name: string, editable: boolean): FileSystemDirectory {
    const directory = createDirectory(++this.id, parent, name, editable);

    addNodeToDirectory(parent, directory);

    this.lookupTable[constructPath(directory)] = directory;

    return directory;
  }
}
