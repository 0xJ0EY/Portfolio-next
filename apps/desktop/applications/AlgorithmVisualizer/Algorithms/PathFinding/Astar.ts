import { Point, pointMagnitude } from "@/applications/math";
import { SubViewParams } from "../../AlgorithmVisualizerView";
import { AreaView } from "../Containers/AreaView";
import { PathFindingAlgorithmContainer } from "../Containers/PathFindingAlgorithmContainer";
import { adjacentEdges, pointToString } from "../../Util";

async function astar(view: AreaView, abortSignal: AbortSignal) {
  const area = view.getArea();

  const root = area.getStart();
  const goal = area.getEnd();

  const areaWidth = area.getWidth();
  const areaHeight = area.getHeight();

  const goalTag = pointToString(goal);

  async function discover(start: Point, goal: Point, h: (x: Point) => number): Promise<boolean> {
    function reconstructPath(cameFrom: Map<Point, Point>, current: Point): Point[] {
      let active = current;
      let path: Point[] = [active];

      while (cameFrom.has(active)) {
        active = cameFrom.get(active)!;
        path.push(active);
      }

      return path;
    }

    function lowestFScore(openSet: Set<Point>, fScore: Map<string, number>): Point {
      let lowest: { score: number, entry: Point } = { score: Infinity, entry: {x: Infinity, y: Infinity} };

      for (const x of openSet) {
        const score = fScore.get(pointToString(x)) ?? Infinity;

        if (score < lowest.score) {
          lowest = { score, entry: x };
        }
      }

      if (lowest.score === Infinity) { throw new Error("Unable to find lowest fscore"); }

      return lowest.entry;
    }

    const openSet = new Set<Point>();
    openSet.add(start);

    const cameFrom = new Map<Point, Point>();

    const gScore = new Map<string, number>();
    const startTag = pointToString(start);

    gScore.set(startTag, 0);

    const fScore = new Map<string, number>();
    fScore.set(startTag, h(start));

    while (openSet.size > 0) {
      if (abortSignal.aborted) { return false; }

      const current = lowestFScore(openSet, fScore);
      const currentTag = pointToString(current);

      view.setHappyPath(reconstructPath(cameFrom, current));
      await view.visit(current.x, current.y);

      if (currentTag === goalTag) {
        return true;
      }

      openSet.delete(current);

      for (const edge of adjacentEdges(current)) {
        if (edge.x < 0 || edge.x > areaWidth) { continue; }
        if (edge.y < 0 || edge.y > areaHeight) { continue; }

        if (area.getTile(edge.x, edge.y) === 'wall') { continue; }

        const edgeTag = pointToString(edge);
        const tentativeGScore = (gScore.get(currentTag) ?? Infinity) + 1;

        if (tentativeGScore < (gScore.get(edgeTag) ?? Infinity)) {
          cameFrom.set(edge, current);
          gScore.set(edgeTag, tentativeGScore);
          fScore.set(edgeTag, tentativeGScore + h(edge));

          if (!openSet.has(edge)) { openSet.add(edge); }
        }
      }
    }

    return false;
  }

  function cost(x: Point): number {
    const xAxis = Math.abs(goal.x - x.x);
    const yAxis = Math.abs(goal.y - x.y);

    return (xAxis + yAxis) * 5;
  }

  await discover(root, goal, cost);
}

export default function Astar(params: SubViewParams) {
  return PathFindingAlgorithmContainer({
    params,
    entrypoint: astar,
    title: 'A* Search',
    options: params.algorithmOptions!
  });
}
