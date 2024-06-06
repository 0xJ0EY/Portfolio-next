import { SortView, SortViewEntry } from "@/applications/AlgorithmVisualizer/Algorithms/SortingView";

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

  public updateData(data: SortViewEntry[]): void {
    this.render();
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
