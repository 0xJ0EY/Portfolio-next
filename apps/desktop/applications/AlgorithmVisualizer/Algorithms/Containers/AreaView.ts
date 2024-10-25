import { Point } from "@/applications/math";
import { sleep } from "../../Util";

export type AreaTile = 'open' | 'wall' | 'start' | 'end';
export type AreaViewTile = AreaTile | 'visited';

function create2DArray<T>(width: number, height: number, value: T): T[][] {
  let result: T[][] = [];

  for (let y = 0; y < height; y++) {
    result[y] = [];

    for (let x = 0; x < width; x++) {
      result[y][x] = value;
    }
  }

  return result;
}

function createWalledGrid(width: number, height: number): AreaTile[][] {
  let result: AreaTile[][] = []

  for (let y = 0; y < height; y++) {
    result[y] = [];

    for (let x = 0; x < width; x++) {
      const isHorizontal = x === 0 || x === width - 1;
      const isVertical = y === 0 || y === height - 1;

      const isWall = isHorizontal || isVertical;

      result[y][x] = isWall ? 'wall' : 'open';
    }
  }

  return result;
}

export function generateMaze(width: number, height: number): Area {
  return generateOpenFieldArea(width, height);
}

export function generateOpenFieldArea(width: number, height: number): Area {
  const grid = createWalledGrid(width, height);

  const start: Point = {
    x: 0,
    y: Math.floor(Math.random() * (height - 2)) + 1
  }

  grid[start.y][start.x] = 'start';

  const end: Point = {
    x: width - 1,
    y: Math.floor(Math.random() * (height - 2)) + 1
  }

  grid[end.y][end.x] = 'end';

  return new Area(grid, start, end);
}

export function generatePipes(width: number, height: number): Area {
  function drawPipe(area: Area, x: number) {
    const openY = Math.floor(Math.random() * (area.getHeight() - 2)) + 1;

    for (let y = 1; y < area.getHeight() - 1; y++) {
      area.setTile(x, y, openY === y ? 'open' : 'wall');
    }
  }

  const area = generateOpenFieldArea(width, height);

  const isEven = width % 2 === 0;

  if (isEven) {
    const center = Math.floor((width - 2) / 2);

    for (let x = 2; x < center; x += 2) {
      drawPipe(area, x);
    }

    for (let x = width - 3; x > center; x -= 2) {
      drawPipe(area, x);
    }

  } else {
    // Draw only pipes from the left side
    for (let x = 2; x < width - 2; x += 2) {
      drawPipe(area, x);
    }
  }

  return area;
}

export class Area {
  private width: number;
  private height: number;

  constructor(private grid: AreaTile[][], private start: Point, private end: Point) {
    this.width = this.grid[0].length ?? 0;
    this.height = this.grid.length ?? 0;
  }

  public getGrid(): AreaTile[][] {
    return this.grid;
  }

  public getWidth(): number {
    return this.width;
  }

  public getStart(): Point {
    return this.start;
  }

  public getEnd(): Point {
    return this.end;
  }

  public getHeight(): number {
    return this.height;
  }

  public getSize(): number {
    return this.width * this.height;
  }

  public inScope(x: number, y: number) {
    const horizontal = x < 0 || x > this.getWidth();
    const vertical = y < 0 || y > this.getHeight();

    return !horizontal && !vertical
  }

  public setTile(x: number, y: number, tile: AreaTile) {
    this.grid[y][x] = tile;
  }

  public getTile(x: number, y: number): AreaTile | null {
    if (!this.inScope(x, y)) { return null; }

    return this.grid[y][x];
  }
}

export class AreaView {
  private dirty: boolean = false;

  private visited: boolean[][];
  private happyPath: Point[] = [];

  constructor(private area: Area) {
    this.visited = create2DArray(area.getWidth(), area.getHeight(), false);
  }

  public getWidth(): number {
    return this.area.getWidth();
  }

  public setHappyPath(path: Point[]): void {
    this.happyPath = path;
  }

  public getHeight(): number {
    return this.area.getHeight();
  }

  public getArea(): Area {
    return this.area;
  }

  public async visit(x: number, y: number) {
    this.dirty = true;

    await sleep(5);

    this.visited[y][x] = true;
  }

  public hasVisited(x: number, y: number): boolean {
    if (!this.area.inScope(x, y)) { return false; }

    return this.visited[y][x];
  }

  public getTile(x: number, y: number): AreaViewTile | null {
    const tile = this.getArea().getTile(x, y);

    if (tile === 'open' && this.hasVisited(x, y)) { return 'visited'; }

    return tile;
  }

  public clearVisited() {
    this.dirty = true;
    this.visited = create2DArray(this.area.getWidth(), this.area.getHeight(), false);
  }

  public rerender(): boolean {
    let dirty = this.dirty;

    this.dirty = false;

    return dirty;
  }
}
