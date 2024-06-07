import { useEffect, useRef, useState } from "react";
import { SortView, verifySort } from "./SortingView";
import { generateRandomBarData } from "../Util";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import styles from "./SortingStyles.module.css";

export type SortingAlgorithmEntrypoint = (view: SortView, abortSignal: AbortSignal) => Promise<void>;

export function AlgorithmContainer(algorithm: SortingAlgorithmEntrypoint) {
  const parent = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  const [isSorting, setSorting] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());

  const view = useRef(new SortView(generateRandomBarData(50)));
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

    algorithm(view.current, abortController.current.signal).then(() => {
      verifySort(view.current).then(() => {
        isSorted = true;
        setSorting(false);
      });
    });

    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.01;

    gainNode.connect(audioContext.destination);

    function update() {
      if (view.current.rerender()) {
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
  }

  const actionButton = isSorting ? <button onClick={onStop}>Stop</button> : <button onClick={onStart}>Start</button>;

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas ref={graphRef}></canvas>
      <span>we be sorting</span>
      {actionButton}
    </div>
  );
}