import { useEffect, useRef } from "react";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import styles from "./SortingStyles.module.css";
import { generateRandomBarData } from "../Util";

export type SortViewEntryColor = 'white' | 'red' | 'green';

export type SortViewEntry = {
  value: number,
  color: SortViewEntryColor,
}

async function bubbleSort(view: SortView) {
  for (let i = 0; i < view.size() - 1; i++) {
    for (let j = 0; j < view.size() - 1; j++) {
      if (view.entry(j).value > view.entry(j + 1).value) {
        view.cleanColors();
        await view.swap(j, j + 1);
      }
    }
  }

  view.cleanColors();
}

async function verifySort(view: SortView) {
  for (let i = 1; i < view.size(); i++) {
    if (view.entry(i).value < view.entry(i - 1).value) {
      return;
    }

    view.mark(i - 1, 'green');
    view.mark(i, 'red');

    await sleep(2);
  }

  view.mark(view.size() - 1, 'green');
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export class SortView {
  private dirty: boolean = false;
  private highestValue: number = 0;
  private delayMs: number = 2;
  private verificationDelayMs: number = 2;

  private accessCount: number = 0;

  constructor(private data: SortViewEntry[]) {
    this.highestValue = this.findHighestValue();
  }

  private findHighestValue(): number {
    let max = 0;

    for (let i = 0; i < this.data.length; i++) {
      max = Math.max(this.data[i].value, max);
    }

    return max;
  }

  private async onAccess() {
    await sleep(this.delayMs);

    this.accessCount += 1;
  }

  public cleanColors(): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i].color = 'white';
    }

    this.dirty = true;
  }

  public rerender(): boolean {
    let dirty = this.dirty;

    this.dirty = false;

    return dirty;
  }

  public async swap(idx: number, idy: number): Promise<void> {
    await this.onAccess();

    this.dirty = true;

    this.mark(idx, 'red');
    this.mark(idy, 'red');

    let temp = this.data[idx];
    this.data[idx] = this.data[idy];
    this.data[idy] = temp;

    await this.onAccess();
  }

  public mark(id: number, color: SortViewEntryColor): void {
    this.data[id].color = color;
    this.dirty = true;
  }

  public entry(index: number): SortViewEntry {
    return this.data[index];
  }

  public size(): number {
    return this.data.length;
  }

  public getHighestValue(): number {
    return this.highestValue;
  }
}

export default function BubbleSort(params: SubViewParams) {
  const parent = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  const isSorting = useRef<boolean>(false);

  const view = useRef(new SortView(generateRandomBarData(50)));
  const graph = useRef(new BarGraph(view.current));

  useEffect(() => {
    if (!graphRef.current) { return; }
    if (!parent.current) { return; }

    const barGraph = graph.current;

    if (!barGraph) { return; }
    if (!barGraph.bind(graphRef.current)) { return }

    function onResize() {
      const current = parent.current!;

      const width = current.clientWidth;
      const height = width / (16/9);

      barGraph.resize(width, height);
    }

    const observer = new ResizeObserver(onResize);
    observer.observe(parent.current);

    return () => {
      observer.disconnect();
    }
  }, []);

  function onStart() {
    if (isSorting.current) { return; }
    isSorting.current = true;
    
    let isSorted = false;

    bubbleSort(view.current).then(() => {
      verifySort(view.current).then(() => {
        isSorted = true;
        isSorting.current = false;
      });
    });

    function update() {
      if (view.current.rerender()) {
        graph.current.render();
      }

      if (!isSorted) {
        window.requestAnimationFrame(update);
      }
    }

    window.requestAnimationFrame(update);
  }

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas ref={graphRef}></canvas>
      <span>bubble sorting</span>
      <button onClick={onStart}>Start</button>
    </div>
  );
}
