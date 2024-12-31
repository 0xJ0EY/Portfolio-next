import { useEffect, useRef, useState } from "react";
import { SortView, SortViewEntry, verifySort } from "./SortingView";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import { DataGenerationEntriesInput, SortingGenerationStrategyDropdown } from "../../Home/Home";
import styles from "./AlgorithmContainer.module.css";
import { useTranslation } from "react-i18next";
import { SortingAlgorithmContainerProps } from "./Containers";

export type SortingDataGenerationStrategy = 'randomly-distributed' | 'sorted-left-to-right' | 'sorted-right-to-left';

function generateRandomData(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = 0; i < entries; i++) {
    data.push({ value: i, color: 'white' });
  }

  // Fisher–Yates shuffle
  for (let i = entries - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i));
    [data[i], data[j]] = [data[j], data[i]];
  }

  return data;
}

function generateSortedDataLeftToRight(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = 0; i < entries; i++) {
    data.push({ value: i, color: 'white' });
  }

  return data;
}

function generateSortedDataRightToLeft(entries: number): SortViewEntry[] {
  let data: SortViewEntry[] = [];

  for (let i = entries; i > 0; i--) {
    data.push({ value: i, color: 'white' });
  }

  return data;
}

function generateData(strategy: SortingDataGenerationStrategy, entries: number): SortViewEntry[] {
  switch (strategy) {
    case "randomly-distributed": return generateRandomData(entries);
    case "sorted-left-to-right": return generateSortedDataLeftToRight(entries);
    case "sorted-right-to-left": return generateSortedDataRightToLeft(entries);
  }
}

export function SortingAlgorithmContainer(props: SortingAlgorithmContainerProps) { 
  const { entrypoint, params, title } = props;

  const apis = params.windowProps.application.apis;

  const { t } = useTranslation('common');

  const [dataGenStrategy, setDataGenStrategy] = useState(props.options.sorting.dataGenerationStrategy);
  const [amountOfEntries, setAmountOfEntries] = useState<number | null>(props.options.sorting.amountOfEntries);

  const parent = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  const [isSorting, setSorting] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());

  const view = useRef(new SortView([]));
  const graph = useRef(new BarGraph(view.current));

  useEffect(() => {
    view.current.setData(generateData(dataGenStrategy, amountOfEntries ?? 50));

    if (!graphRef.current) { return; }
    if (!parent.current) { return; }

    abortController.current = new AbortController();

    const barGraph = graph.current;

    if (!barGraph) { return; }
    if (!barGraph.bind(graphRef.current)) { return }

    function onResize() {
      const current = parent.current!;

      const width = current.scrollWidth;
      const height = width / (16/8);

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
      const indicesList = view.current.accessIndicesList;

      for (let i = 0; i < indicesList.length; i++) {
        const relativeIndex = indicesList[i] / view.current.getHighestValue();

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

  const actionButton = isSorting ? <button className="xl-system-button" onClick={onStop}>{t('algorithms.stop')}</button> : <button className="xl-system-button" onClick={onStart}>{t('algorithms.start')}</button>;

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas className={styles['algo-visualization']} ref={graphRef}></canvas>

      <div className={styles['data-container']}>
        <h3>{title}</h3>

        <div>
          {actionButton}
        </div>

        <hr />

        <button className="system-button" onClick={regenerate} disabled={isSorting}>{t('algorithms.regenerate')}</button>

        <table>
          <tbody>
            <tr>
            <td><label htmlFor="data-generation-strategy">{t('algorithms.data_generation_strategy')}</label></td>
              <td>{ SortingGenerationStrategyDropdown("data-generation-strategy", dataGenStrategy, setDataGenStrategy, t) }</td>
            </tr>
            <tr>
            <td><label htmlFor="generated-data-size">{t('algorithms.data_generation_points')}</label></td>
              <td>{ DataGenerationEntriesInput("generated-data-size", amountOfEntries, setAmountOfEntries, 1, 2048) }</td>
            </tr>
          </tbody>
        </table>

        <button className={styles['button-link']} onClick={() => params.changeParent('home')}>{t('algorithms.return_to_overview')}</button>
      </div>
    </div>
  );
}