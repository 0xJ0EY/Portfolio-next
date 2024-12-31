import { Point } from "@/applications/math";
import { SubViewParams } from "../../AlgorithmVisualizerView";
import { AreaView } from "../Containers/AreaView";
import { PathFindingAlgorithmContainer } from "../Containers/PathFindingAlgorithmContainer";
import { adjacentEdges, equals, pointToString } from "../../Util";

interface DfsNode {
  value: Point,
  parent: DfsNode | null
}

function toHappyFlow(container: DfsNode): Point[] {
  let nodes: Point[] = [];
  let node: DfsNode | null = container;

  while (node !== null) {
    nodes.push(node.value);
    node = node.parent;
  }

  return nodes;
}

async function dfs(view: AreaView, abortSignal: AbortSignal) {
  const area = view.getArea();

  const root = area.getStart();
  const goal = area.getEnd();

  const areaWidth = area.getWidth();
  const areaHeight = area.getHeight();

  const discovered = new Set<string>();

  async function discover(node: DfsNode): Promise<boolean> {
    if (abortSignal.aborted) { return false; }
    if (discovered.has(pointToString(node.value))) { return false; }

    discovered.add(pointToString(node.value));

    view.setHappyPath(toHappyFlow(node));
    await view.visit(node.value.x, node.value.y);

    if (equals(node.value, goal)) { return true; }

    for (const neighbor of adjacentEdges(node.value)) {
      if (neighbor.x < 0 || neighbor.x > areaWidth) { continue; }
      if (neighbor.y < 0 || neighbor.y > areaHeight) { continue; }

      // Check if point is not visited already
      if (discovered.has(pointToString(neighbor))) { continue; }

      // Check if point is not wall
      if (area.getTile(neighbor.x, neighbor.y) === 'wall') { continue; }

      if (await discover({ value: neighbor, parent: node })) {
        return true;
      }
    }

    return false;
  }

  await discover({ value: root, parent: null });
}

export default function Dfs(params: SubViewParams) {
  return PathFindingAlgorithmContainer({
    params,
    entrypoint: dfs,
    title: 'Depth-first search',
    options: params.algorithmOptions!
  });
}
