import { Point } from "@/applications/math";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { AreaView } from "./Containers/AreaView";
import { PathFindingAlgorithmContainer } from "./Containers/PathFindingAlgorithmContainer";
import { Queue } from "@/data/Queue";

interface BfsContainer {
  value: Point,
  parent: BfsContainer | null
}

function equals(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function adjacentEdges(point: Point): Point[] {
  let results: Point[] = [];

  for (let edge of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const [edgeX, edgeY] = edge;

    const x = point.x + edgeX;
    const y = point.y + edgeY;

    results.push({ x, y });
  }

  return results;
}

function pointToString(point: Point): string {
  return `x${point.x};y${point.y}`;
}

async function bfs(view: AreaView, abortSignal: AbortSignal) {
  console.log('start bfs');

  const queue = new Queue<BfsContainer>();
  const explored = new Set<string>();

  const area = view.getArea();

  const root = area.getStart();
  const goal = area.getEnd();

  const areaWidth = area.getWidth();
  const areaHeight = area.getHeight();

  explored.add(pointToString(root));
  queue.enqueue({ value: root, parent: null });

  while (queue.size() > 0) {
    if (abortSignal.aborted) { return; }

    const container = queue.dequeue()!;
    const value = container.value;

    await view.visit(value.x, value.y);

    if (equals(value, goal)) {
      console.log('found the goal');
      return;
    }

    for (const edge of adjacentEdges(value)) {
      if (edge.x < 0 || edge.x > areaWidth) { continue; }
      if (edge.y < 0 || edge.y > areaHeight) { continue; }

      const tag = pointToString(edge);

      // Check if point is not visited already
      if (explored.has(tag)) { continue; }

      // Check if point is not wall
      if (area.getTile(edge.x, edge.y) === 'wall') { continue; }

      // Add new edge to explored
      explored.add(tag);
      queue.enqueue({ value: edge, parent: container });
    }
  }
}

export default function Bfs(params: SubViewParams) {
  return PathFindingAlgorithmContainer({
    params,
    entrypoint: bfs,
    title: 'Breath-first search',
    options: params.algorithmOptions!
  });
}
