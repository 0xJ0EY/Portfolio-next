
interface Graph {
  bind(element: HTMLCanvasElement): boolean;
}

export class BarGraph {
  private context: CanvasRenderingContext2D | null = null;

  constructor() {}

  public bind(element: HTMLCanvasElement): boolean {
    this.context = element.getContext('2d');

    if (this.context === null) { return false; }

    this.context.canvas.addEventListener('resize')

    return true;

    // return this.context !== null;
  }
}
