import { useEffect, useRef, useState } from "react";
import styles from "./AlgorithmContainer.module.css";
import { AreaGraph } from "@/components/GraphViewer/GraphViewer";
import { Area, AreaView, generateMaze, generateOpenFieldArea, generatePipes } from "./AreaView";
import { PathFindingAlgorithmContainerProps } from "./Containers";
import { useTranslation } from "react-i18next";

export type PathFindingDataGenerationStrategy = 'maze' | 'open-field' | 'pipes';

function generateData(strategy: PathFindingDataGenerationStrategy, width: number, height: number): Area {
  switch (strategy) {
    case "maze": return generateMaze(width, height);
    case "open-field": return generateOpenFieldArea(width, height);
    case "pipes": return generatePipes(width, height);
  }
}

export function PathFindingAlgorithmContainer(props: PathFindingAlgorithmContainerProps) {
  const { entrypoint, params, title } = props;

  const parent = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);

  const apis = params.windowProps.application.apis;

  const { t } = useTranslation('common');

  const [dataGenStrategy, setDataGenStrategy] = useState(props.options.pathFinding.dataGenerationStrategy);
  const [dataGenWidth, setDataGenWidth] = useState(props.options.pathFinding.width);
  const [dataGenHeight, setDataGenHeight] = useState(props.options.pathFinding.height);

  const view = useRef(new AreaView(generateData(dataGenStrategy, dataGenWidth, dataGenHeight)));
  const graph = useRef(new AreaGraph(view.current));

  const [isPathFinding, setPathFinding] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());

  useEffect(() => {
    if (!parent.current) { return; }
    if (!graphRef.current) { return; }

    abortController.current = new AbortController();

    const areaGraph = graph.current;

    if (!areaGraph) { return; }
    if (!areaGraph.bind(graphRef.current)) { return; }

    function onResize() {
      const current = parent.current!;
      const data = view.current;

      const width = current.scrollWidth;

      const tileSize = width / data.getWidth();
      const height = tileSize * data.getHeight();

      areaGraph.resize(width, height);
    }

    const observer = new ResizeObserver(onResize);
    observer.observe(parent.current);

    return () => {
      observer.disconnect();
      abortController.current?.abort();
    }
  }, []);

  function onStart() {
    if (isPathFinding) { return; }

    view.current.clearVisited();

    setPathFinding(true);
    abortController.current = new AbortController();

    let isSolved = false;

    entrypoint(view.current, abortController.current.signal).then(() => {
        isSolved = true;
        setPathFinding(false);
    });

    function update() {
      if (view.current.rerender()) {
        graph.current.render();
      }

      if (!isSolved) {
        window.requestAnimationFrame(update);
      }
    }

    window.requestAnimationFrame(update);
  }

  function onStop() {
    abortController.current.abort();

    setPathFinding(false);
  }

  const actionButton = isPathFinding ? <button className="xl-system-button" onClick={onStop}>{t('algorithms.stop')}</button> : <button className="xl-system-button" onClick={onStart}>{t('algorithms.start')}</button>;

  return (
    <div className={styles['parent']} ref={parent}>
      <canvas className={styles['algo-visualization']} ref={graphRef}></canvas>

      <div className={styles['data-container']}>
        <h3>{title}</h3>

        <div>
          {actionButton}
        </div>

        <hr/>

        <button className={styles['button-link']} onClick={() => params.changeParent('home')}>{t('algorithms.return_to_overview')}</button>

      </div>

    </div>
  );
}
