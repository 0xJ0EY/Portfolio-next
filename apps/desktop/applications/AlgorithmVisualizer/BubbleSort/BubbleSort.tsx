import { useEffect, useRef } from "react";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { BarGraph, barGraph } from "@/components/GraphViewer/GraphViewer";
import { resizableWindowEventFilter } from "@/components/WindowManagement/WindowFilters";
import { WindowEvent } from "@/components/WindowManagement/WindowEvents";

export default function BubbleSort(params: SubViewParams) {
  const graph = useRef<HTMLCanvasElement>(null); 

  const windowId = params.windowProps.windowContext.id;
  const compositor = params.windowProps.application.compositor;

  useEffect(() => {
    if (!graph.current) { return; }

    const barGraph = new BarGraph();
    if (!barGraph.bind(graph.current)) { return }

    const unsubscribe = compositor.subscribeWithFilter(
      windowId,
      resizableWindowEventFilter,
      (evt: WindowEvent) => {
        console.log(evt);

        graphBar.resize(100, 100);
      });


    return () => { unsubscribe() }
  }, []);

  return (<>
    <canvas ref={graph}></canvas>
    <span>bubble sorting</span>
  </>);
}
