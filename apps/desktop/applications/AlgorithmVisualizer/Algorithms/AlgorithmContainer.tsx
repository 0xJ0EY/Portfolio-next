import { useEffect, useRef } from "react";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { SortView, verifySort } from "./SortingView";
import { generateRandomBarData } from "../Util";
import { BarGraph } from "@/components/GraphViewer/GraphViewer";
import styles from "./SortingStyles.module.css";

export type SortingAlgorithmEntrypoint = (view: SortView) => Promise<void>;

export function AlgorithmContainer(algorithm: SortingAlgorithmEntrypoint) {
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

    algorithm(view.current).then(() => {
      verifySort(view.current).then(() => {
        isSorted = true;
        isSorting.current = false;
      });
    });

    const audioContext = new AudioContext();

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.001;

    gainNode.connect(audioContext.destination);

    function update() {
      if (view.current.rerender()) {
        let len = 512;

        let indicesList = view.current.accessIndicesList;

        let pscale = len / indicesList.length;

        let max = Math.max(...indicesList);

        for (let i = 0; i < indicesList.length; i++) {
          let relativeIndex = indicesList[i] / max;

          const oscillator = audioContext.createOscillator();
          oscillator.type = "square";

          const freq = 120 + 1000 * (relativeIndex * relativeIndex);
          oscillator.frequency.value = freq;

          view.current.accessIndicesList = [];

          const offset = (i * pscale);
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

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas ref={graphRef}></canvas>
      <span>bubble sorting</span>
      <button onClick={onStart}>Start</button>
    </div>
  );
}