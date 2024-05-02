import { useEffect, useRef } from "react";
import { SubViewParams } from "../AlgorithmVisualizerView";
import { barGraph } from "@/components/GraphViewer/GraphViewer";
import { resizableWindowEventFilter } from "@/components/WindowManagement/WindowFilters";
import { WindowEvent } from "@/components/WindowManagement/WindowEvents";

export default function BubbleSort(params: SubViewParams) {
  const graph = useRef<HTMLCanvasElement>(null); 

  const windowId = params.windowProps.windowContext.id;
  const compositor = params.windowProps.application.compositor;

  useEffect(() => {
    if (!graph.current) { return; }

    const unsubscribe = compositor.subscribeWithFilter(
      windowId,
      resizableWindowEventFilter,
      (evt: WindowEvent) => {
        console.log(evt);
      });

    barGraph(graph.current);

    return () => { unsubscribe() }
  }, []);

  return (<>
    <canvas ref={graph}></canvas>
    <span>bubble sorting</span>
  </>);
}
