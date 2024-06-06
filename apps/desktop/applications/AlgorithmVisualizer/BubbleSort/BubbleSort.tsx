import { useEffect, useRef } from "react";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import styles from "./SortingStyles.module.css";
import { generateRandomBarData } from "../Util";

export type SortViewEntry = {
  value: number,
  color: 'white' | 'red' | 'green'
}

async function bubbleSort(view: SortView) {
  for (let i = 0; i < view.size() - 1; i++) {
    for (let j = 0; j < view.size() - 1; j++) {
      if (view.entry(j).value > view.entry(j + 1).value) {
        await view.swap(j, j + 1);
      }
    }
  }
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export class SortView {
  private dirty: boolean = false;
  private highestValue: number = 0;
  private delayMs: number = 5;

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

  public async swap(idx: number, idy: number): Promise<void> {
    await this.onAccess();

    let temp = this.data[idx];
    this.data[idx] = this.data[idy];
    this.data[idy] = temp;

    await this.onAccess();
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
    let lastTime: number = 0;

    console.log('foobar');

    bubbleSort(view.current).then(() => { console.log('we done')});

    function update(now: number) {
      if (!lastTime) { lastTime = now; }
      let elapsed = now - lastTime;

      graph.current.render();

      window.requestAnimationFrame(update);
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
