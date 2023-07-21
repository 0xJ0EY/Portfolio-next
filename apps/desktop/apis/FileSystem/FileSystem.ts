import { Application, ApplicationConfig, ApplicationManager } from "@/applications/ApplicationManager";
import { Err, Ok, Result } from "../../components/util";
import { infoConfig } from "@/applications/InfoApplication";
import { aboutConfig } from "@/applications/AboutApplication";
import { LocalWindowCompositor } from "../../components/WindowManagement/LocalWindowCompositor";
import { finderConfig } from "@/applications/Finder/FinderApplication";
import { LocalApplicationManager } from "@/applications/LocalApplicationManager";
import { SystemAPIs } from "../../components/Desktop";

export type FileSystemDirectory = {
  parent: FileSystemDirectory | null
  kind: 'directory',
  name: string,
  children: FileSystemNode[]
};

export type FileSystemFile = {
  parent: FileSystemDirectory
  kind: 'file',
  name: string
};

export type FileSystemApplication = {
  parent: FileSystemDirectory
  kind: 'application'
  name: string,
  entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application
}

export type FileSystemNode = FileSystemDirectory | FileSystemFile | FileSystemApplication

function createApplication(parent: FileSystemDirectory, name: string, entrypoint: (compositor: LocalWindowCompositor, manager: LocalApplicationManager, apis: SystemAPIs) => Application): FileSystemApplication {
  return {
    parent,
    kind: 'application',
    name,
    entrypoint
  }
}

function createRootNode(): FileSystemDirectory {
  return {
    parent: null,
    kind: 'directory',
    name: '/',
    children: []
  }
}

function createDirectory(parent: FileSystemDirectory, name: string): FileSystemDirectory {
  return {
    parent,
    kind: 'directory',
    name,
    children: []
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
  fileSystem.addDirectory(root, 'Applications');

  fileSystem.addApplication(finderConfig);
  fileSystem.addApplication(aboutConfig);
  fileSystem.addApplication(infoConfig);

  const home = fileSystem.addDirectory(root, 'home');
  const joey = fileSystem.addDirectory(home, 'joey');
  fileSystem.addDirectory(joey, 'Desktop');

  return fileSystem;
}

export class FileSystem {
  private root: FileSystemDirectory;
  private lookupTable: Record<string, FileSystemNode> = {};

  constructor() {
    this.root = createRootNode();
    this.lookupTable['/'] = this.root;
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

    const application = createApplication(parent, config.appName, config.entrypoint);

    parent.children.push(application);

    this.lookupTable[constructPath(application)] = application;

    return Ok(application);
  }

  public addDirectory(parent: FileSystemDirectory, name: string): FileSystemDirectory {
    const directory = createDirectory(parent, name);
    parent.children.push(directory);
    this.lookupTable[constructPath(directory)] = directory;

    return directory;
  }
}
