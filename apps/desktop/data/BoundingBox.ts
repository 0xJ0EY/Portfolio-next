/* These files are copied from the web project, we can make them shared but that takes a bit of effort */
import { TouchData } from "./TouchData";

export class BoundingBox {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {}

  static fromTouchData(data: TouchData): BoundingBox {
    if (data.hasTouchesDown(1)) {
      const touch = data.touches[0];

      const x = touch.x;
      const y = touch.y;

      return new BoundingBox(x, y, x, y);
    }

    const x = data.touches.map((touch) => touch.x);
    const y = data.touches.map((touch) => touch.y);

    const x1 = Math.min(...x);
    const x2 = Math.max(...x);

    const y1 = Math.min(...y);
    const y2 = Math.max(...y);

    return new BoundingBox(x1, y1, x2, y2);
  }

  width(): number {
    return this.x2 - this.x1;
  }

  height(): number {
    return this.y2 - this.y1;
  }

  center(): { x: number, y: number } {
    const x = this.x1 + this.width() / 2;
    const y = this.y1 + this.height() / 2;

    return { x, y };
  }

  diagonal(): number {
    return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2));
  }
}
