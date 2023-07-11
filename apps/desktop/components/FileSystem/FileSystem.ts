import { Application } from "@/applications/ApplicationManager";
import { Err, Ok, Result } from "../util";
import { InfoApplication } from "@/applications/InfoApplication";
import { AboutApplication } from "@/applications/AboutApplication";

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
  entrypoint: () => Application
}

export type FileSystemNode = FileSystemDirectory | FileSystemFile | FileSystemApplication

function createApplication(parent: FileSystemDirectory, name: string, entrypoint: () => Application): FileSystemApplication {
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

export class FileSystem {
  private root: FileSystemDirectory = createRootNode();
  private lookupTable: Record<string, FileSystemNode> = {};

  public init() {
    this.lookupTable['/'] = this.root;

    // create file tree
    const applicationsDir = this.addDirectory(this.root, 'Applications');
    this.addApplication(applicationsDir, 'About.app');
    this.addApplication(applicationsDir, 'Info.app');

    const home = this.addDirectory(this.root, 'Home');
    const joey = this.addDirectory(home, 'Joey');
    this.addDirectory(joey, 'Desktop');
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

  private addApplication(parent: FileSystemDirectory, name: string): Result<FileSystemApplication, Error> {

    let entrypoint: () => Application;

    console.log(name);

    switch (name) {
      case 'Info.app': entrypoint = () => { return new InfoApplication() }; break;
      case 'About.app': entrypoint = () => { return new AboutApplication() }; break;
      default: return Err(Error(`Application "${name}" not in the application list.`))
    }

    const application = createApplication(parent, name, entrypoint);

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
