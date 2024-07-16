import { FileSystemDirectory, FileSystemNode } from "./FileSystem";

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

  return path + node.filenameExtension;
}

export function pathParts(path: string): string[] {
  const nodes = path.split('/').filter(x => x.length > 0);

  if (nodes.length < 1 ) { return ["/"]; }

  return nodes;
}

// Pops the last entry off the path, so it should always return a directory path
export function pathPop(path: string): string {
  const nodes = path.split('/').filter(x => x.length > 0);
  if (nodes.length <= 1) { return "/" };

  nodes.pop();

  return `/${nodes.join('/')}/`;
}

export function pathLastEntry(path: string): string | null {
  const nodes = path.split('/').filter(x => x.length > 0);
  if (nodes.length < 0) { return null; }

  return nodes[nodes.length - 1];
}

export function pathShift(path: string): string {
  return "";
}

export function isUniqueFile(parent: FileSystemDirectory, name: string): boolean {
  if (name === '') { return false; }

  for (const child of parent.children.iterFromHead()) {
    const node = child.value.node;

    if (node.name === name) { return false; }
  }

  return true;
}

export function generateUniqueNameForDirectory(directory: FileSystemDirectory, template: string): string {
  function existsInDirectory(directory: FileSystemDirectory, name: string): boolean {
    for (const node of directory.children.iterFromTail()) {
      const nodeName = node.value.node.name;

      if (nodeName === name) { return true; }
    }

    return false;
  }

  if (!existsInDirectory(directory, template)) { return template; }

  let iteration = 1;

  while (existsInDirectory(directory, `${template} ${++iteration}`)) {}

  return `${template} ${iteration}`;
}
