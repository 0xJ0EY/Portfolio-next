import { AreaView, AreaViewTile } from "@/applications/AlgorithmVisualizer/Algorithms/Containers/AreaView";
import { SortView, SortViewEntry } from "@/applications/AlgorithmVisualizer/Algorithms/Containers/SortingView";

interface Graph {
  resize(width: number, height: number): void;
  bind(element: HTMLCanvasElement): boolean;
}

export abstract class CanvasGraph implements Graph {
  protected parent: HTMLCanvasElement | null = null;
  protected context: CanvasRenderingContext2D | null = null;

  constructor() {}

  public resize(width: number, height: number): void {
    if (this.parent === null) { return; }

    this.parent.width = width;
    this.parent.height = height;

    this.render();
  }

  public bind(element: HTMLCanvasElement): boolean {
    this.context = element.getContext('2d');
    this.parent = element;

    if (this.context === null) { return false; }

    this.render();

    return true;
  }

  abstract render(): void;
}

export class BarGraph extends CanvasGraph {
  constructor(private view: SortView) {
    super();
  }

  private renderBar(index: number) {
    function barColor(entry: SortViewEntry) {
      switch (entry.color) {
        case "white": return "#fff";
        case "red": return "#f00";
        case "green": return "#0f0";
      }
    }

    const context = this.context!;
    const parentWidth = this.parent!.width;
    const parentHeight = this.parent!.height;

    const entry = this.view.entry(index);

    const containerWidth = parentWidth / this.view.size();
    const containerHeight = parentHeight / this.view.getHighestValue() * entry.value;

    const widthOffset = containerWidth * 0.05;

    const x = (containerWidth * index) + widthOffset;
    const y = parentHeight - containerHeight; // We render from the top left corner

    const width = containerWidth - (widthOffset * 2);
    const height = containerHeight;

    context.fillStyle = barColor(entry);
    context.fillRect(x, y, width, height);
  }

  public render(): void {
    if (this.context === null) { return; }
    if (this.parent === null) { return; }

    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, this.parent.width, this.parent.height);

    for (let i = 0; i < this.view.size(); i++) {
      this.renderBar(i);
    }
  }
}

export class AreaGraph extends CanvasGraph {

  constructor(private view: AreaView) {
    super();
  }

  public subscribe(handler: (evt: PointerEvent) => void) {
    if (!this.parent) { return; }

    this.parent.addEventListener('pointerdown', handler);
  }

  public disconnect(handler: (evt: PointerEvent) => void) {
    if (!this.parent) { return; }

    this.parent.removeEventListener('pointerdown', handler);
  }

  private calculateTileSize(): number {
    const width = this.parent!.width;

    return width / this.view.getWidth();
  }

  private renderTile(x: number, y: number, tile: AreaViewTile, tileSize: number) {
    function tileColor(tile: AreaViewTile) {
      switch (tile) {
        case "open": return '#fff';
        case "wall": return '#000';
        case "start": return '#0f0';
        case "end": return '#f00';
        case "visited": return "#5ca314"
        case "happy-path": return '#90e83c';
      }
    }

    const context = this.context!;

    const offsetX = x * tileSize;
    const offsetY = y * tileSize;


    context.fillStyle = '#000';

    context.fillRect(
      Math.floor(offsetX),
      Math.floor(offsetY),
      Math.ceil(tileSize),
      Math.ceil(tileSize)
    );

    context.fillStyle = tileColor(tile);

    context.fillRect(
      Math.floor(offsetX) + 1,
      Math.floor(offsetY) + 1,
      Math.ceil(tileSize),
      Math.ceil(tileSize)
    );
  }

  public render(): void {
    if (this.context === null) { return; }
    if (this.parent === null) { return; }

    const area = this.view.getArea();
    const width = this.view.getWidth();

    const tileSize = this.calculateTileSize();

    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, this.parent.width, this.parent.height);

    for (let i = 0; i < area.getSize(); i++) {
      const x = i % width;
      const y = Math.floor(i / width);

      const tile = this.view.getTile(x, y);

      if (tile) { this.renderTile(x, y, tile, tileSize); }
    }
  }
}
