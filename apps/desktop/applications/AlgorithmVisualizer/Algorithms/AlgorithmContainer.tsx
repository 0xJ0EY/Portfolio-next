import { useEffect, useRef, useState } from "react";
import { SortView, SortViewEntry, verifySort } from "./SortingView";
import { generateRandomData, generateSortedDataLeftToRight, generateSortedDataRightToLeft } from "../Util";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import styles from "./SortingStyles.module.css";
import { DataGenerationEntriesInput, DataGenerationStrategyDropDown } from "../Home/Home";
import { SubViewParams } from "../AlgorithmVisualizerView";

export type AlgorithmOptions = {
  dataGenerationStrategy: DataGenerationStrategy,
  amountOfEntries: number
}
export type AlgorithmContainerProps = {
  params: SubViewParams,
  entrypoint: SortingAlgorithmEntrypoint,
  options: AlgorithmOptions,
  title: string,
}

export type DataGenerationStrategy = 'randomly-distributed' | 'sorted-left-to-right' | 'sorted-right-to-left';
export type SortingAlgorithmEntrypoint = (view: SortView, abortSignal: AbortSignal) => Promise<void>;

function generateData(strategy: DataGenerationStrategy, entries: number): SortViewEntry[] {
  switch (strategy) {
    case "randomly-distributed": return generateRandomData(entries);
    case "sorted-left-to-right": return generateSortedDataLeftToRight(entries);
    case "sorted-right-to-left": return generateSortedDataRightToLeft(entries);
  }
}

export function AlgorithmContainer(props: AlgorithmContainerProps) { 
  const { entrypoint, params, title } = props;

  const apis = params.windowProps.application.apis;

  const [dataGenStrategy, setDataGenStrategy] = useState(props.options.dataGenerationStrategy);
  const [amountOfEntries, setAmountOfEntries] = useState<number | null>(props.options.amountOfEntries);

  const parent = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  const [isSorting, setSorting] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());

  const view = useRef(new SortView(generateData(dataGenStrategy, amountOfEntries ?? 50)));
  const graph = useRef(new BarGraph(view.current));

  useEffect(() => {
    if (!graphRef.current) { return; }
    if (!parent.current) { return; }

    abortController.current = new AbortController();

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
      abortController.current?.abort();
    }
  }, []);

  function onStart() {
    if (isSorting) { return; }

    setSorting(true);
    abortController.current = new AbortController();
    
    let isSorted = false;

    entrypoint(view.current, abortController.current.signal).then(() => {
      verifySort(view.current, abortController.current.signal).then(() => {
        isSorted = true;
        setSorting(false);
      });
    });

    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.01;

    gainNode.connect(audioContext.destination);

    function playSound() {
      let indicesList = view.current.accessIndicesList;

        for (let i = 0; i < indicesList.length; i++) {
          let relativeIndex = indicesList[i] / view.current.getHighestValue();

          const oscillator = audioContext.createOscillator();
          oscillator.type = "triangle";

          const freq = 120 + 1200 * (relativeIndex * relativeIndex);
          oscillator.frequency.value = freq;

          const offset = i * 0.1;

          const duration = 0.1;
          
          const start = audioContext.currentTime + offset;
          const stop = start + duration;

          oscillator.connect(gainNode);
          oscillator.start(start);
          oscillator.stop(stop);
        }
        
        view.current.accessIndicesList = [];
    }

    function update() {
      if (view.current.rerender()) {
        if (apis.sound.isEnabled()) {
          playSound();
        }

        graph.current.render();
      }

      if (!isSorted) {
        window.requestAnimationFrame(update);
      }
    }

    window.requestAnimationFrame(update);
  }

  function onStop() {
    abortController.current.abort();

    view.current.cleanColors();
  }

  function regenerate() {
    view.current.setData(generateData(dataGenStrategy, amountOfEntries ?? 50));
    graph.current.render();
  }

  const actionButton = isSorting ? <button onClick={onStop}>Stop</button> : <button onClick={onStart}>Start</button>;

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas ref={graphRef}></canvas>
      <h3>{title}</h3>
      {actionButton}
      
      <hr />

      <button onClick={regenerate} disabled={isSorting}>Regenerate</button>

      <div>
        <label htmlFor="data-generation-strategy">Data generation strategy</label>
        { DataGenerationStrategyDropDown(dataGenStrategy, setDataGenStrategy) }
      </div>

      <div>
        <label htmlFor="generated-data-size">Generated data points</label>
        { DataGenerationEntriesInput(amountOfEntries, setAmountOfEntries) }
      </div>
    </div>
  );
}