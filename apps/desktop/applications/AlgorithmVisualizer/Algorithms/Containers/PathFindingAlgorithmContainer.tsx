import { useEffect, useRef, useState } from "react";
import styles from "./AlgorithmContainer.module.css";
import { AreaGraph } from "@/components/GraphViewer/GraphViewer";
import { Area, AreaView, generateMaze, generateOpenFieldArea, generatePipes } from "./AreaView";
import { PathFindingAlgorithmContainerProps } from "./Containers";
import { useTranslation } from "react-i18next";
import { PathFindingGenerationStrategyDropdown, DataGenerationEntriesInput } from "../../Home/Home";
import { pointMagnitude } from "@/applications/math";

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

  const [pathFindingGenerationStrategy, setPathFindingGenerationStrategy] = useState(props.options.pathFinding.dataGenerationStrategy);
  const [pathFindingWidth, setPathFindingWidth] = useState<number | null>(props.options.pathFinding.width);
  const [pathFindingHeight, setPathFindingHeight] = useState<number | null>(props.options.pathFinding.height);

  const view = useRef(new AreaView());
  const graph = useRef(new AreaGraph(view.current));

  const [isPathFinding, setPathFinding] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());

  function onResize() {
    const current = parent.current!;
    const data = view.current;
    const areaGraph = graph.current;

    const width = current.scrollWidth;

    const tileSize = width / data.getWidth();
    const height = tileSize * data.getHeight();

    areaGraph.resize(width, height);
  }

  function onPointerEvt(evt: PointerEvent) {
    const current = parent.current!;
    const data = view.current;
    const area = view.current.getArea();

    const width = current.scrollWidth;
    const tileSize = width / data.getWidth();

    const rect = current.getBoundingClientRect();
    const [x, y] = [evt.clientX - rect.x, evt.clientY - rect.y];

    const [tileX, tileY] = [Math.floor(x / tileSize), Math.floor(y / tileSize)]

    // TODO: Move tile swapping to a more appropriate area
    const inHorizontalBounds  = tileX > 0 && tileX < data.getWidth() - 1;
    const inVerticalBounds    = tileY > 0 && tileY < data.getHeight() - 1;

    const inBounds = inHorizontalBounds && inVerticalBounds;

    if (!inBounds) { return; }

    area.setTile(tileX, tileY, area.getTile(tileX, tileY) === 'wall' ? 'open' : 'wall');

    view.current.clearVisited();
    graph.current.render();
  }

  useEffect(() => {
    view.current.setData(
      generateData(
        pathFindingGenerationStrategy,
        pathFindingWidth ?? 40,
        pathFindingHeight ?? 20
      )
    );

    if (!parent.current) { return; }
    if (!graphRef.current) { return; }

    abortController.current = new AbortController();

    const areaGraph = graph.current;

    if (!areaGraph) { return; }
    if (!areaGraph.bind(graphRef.current)) { return; } // Bind the rendering

    areaGraph.subscribe(onPointerEvt); // Subscribe to pointer events

    const observer = new ResizeObserver(onResize);
    observer.observe(parent.current);

    return () => {
      observer.disconnect();
      areaGraph.disconnect(onPointerEvt);
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

    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.01;

    gainNode.connect(audioContext.destination);

    const start = view.current.getArea().getStart();
    const end = view.current.getArea().getEnd();

    const maxMagnitude = pointMagnitude(start, end);

    function playSound() {
      const accessedList = view.current.accessedList;

      for (let i = 0; i < accessedList.length; i++) {
        const magnitude = pointMagnitude(accessedList[i], end);

        const scale = magnitude / maxMagnitude;

        const freq = 120 + 1200 * (scale * scale);

        const oscillator = audioContext.createOscillator();
        oscillator.type = "triangle";

        oscillator.frequency.value = freq;

        const offset = i * 0.1;
        const duration = 0.1;

        const startTime = audioContext.currentTime + offset;
        const endTime = startTime + duration;

        oscillator.connect(gainNode);
        oscillator.start(startTime);
        oscillator.stop(endTime);
      }

      view.current.accessedList = [];
    }

    function update() {
      if (view.current.rerender()) {
        if (apis.sound.isEnabled()) {
          playSound();
        }

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

  function regenerate(): void {
    view.current.setData(
      generateData(
        pathFindingGenerationStrategy,
        pathFindingWidth ?? 40,
        pathFindingHeight ?? 20
      )
    );

    graph.current.render();
    onResize();
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

        <button className="system-button" onClick={regenerate} disabled={isPathFinding}>{t('algorithms.regenerate')}</button>

        <table>
          <tbody>
            <tr>
              <td><label htmlFor="path-finding-data-gen-strategy">{t('algorithms.data_generation_strategy')}</label></td>
              <td>{ PathFindingGenerationStrategyDropdown("path-finding-data-gen-strategy", pathFindingGenerationStrategy, setPathFindingGenerationStrategy, t) }</td>
            </tr>

            <tr>
              <td><label htmlFor="path-finding-width">{t('algorithms.path_finding_width')}</label></td>
              <td>{ DataGenerationEntriesInput("path-finding-width", pathFindingWidth, setPathFindingWidth, 5, 100) }</td>
            </tr>

            <tr>
              <td><label htmlFor="path-finding-height">{t('algorithms.path_finding_height')}</label></td>
              <td>{ DataGenerationEntriesInput("path-finding-height", pathFindingHeight, setPathFindingHeight, 5, 100) }</td>
            </tr>
          </tbody>
        </table>

        <button className={styles['button-link']} onClick={() => params.changeParent('home')}>{t('algorithms.return_to_overview')}</button>
      </div>
    </div>
  );
}
