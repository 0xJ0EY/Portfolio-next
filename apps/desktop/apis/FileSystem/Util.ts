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

  return path;
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
