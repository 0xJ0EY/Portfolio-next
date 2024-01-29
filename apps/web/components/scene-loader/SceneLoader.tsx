import { useEffect, useState, useRef } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { AssetManager, LoadingProgress, TotalProgressPerEntry, UpdateAction } from "./AssetManager";
import { createDesk, createFloor, createLights, createMonitor, createRenderScenes } from "./AssetLoaders";
import styles from './SceneLoader.module.css';

function createSpacer(source: string, length: number, fill: string = '\xa0') {
  let spacer = '\xa0';

  for (let i = 0; i < length - 1 - source.length; i++) { spacer += fill; }

  return spacer + '\xa0';
}

function ResourceLoadingStatus(loadingProgress: LoadingProgress) {
  const progress = loadingProgress.progress();

  if (progress.loaded === progress.total) { 
    return (<h3>Finished loading resources</h3>);
  }

  return (<h3>Loading resources ({progress.loaded}/{progress.total})</h3>);
}

function DisplayResource(container: TotalProgressPerEntry) {
  const entry = container.entry;
  const total = container.total;
  
  return <li style={{ fontFamily: 'monospace' }} key={entry.name}>{entry.name}{createSpacer(entry.name, 30, '.')}{total}%</li>
}

function OperatingSystemStats() {
  const name = "Joey de Ruiter";
  const company = "Joeysoft, bv.";

  const spacer = 30;

  return (<>
    <div>
      <span className={styles['bold']}>{name}</span>
      {createSpacer(name, spacer)}
      <span>Released: 7 april 1998</span>
    </div>
    <div>
      <span className={styles['bold']}>{company}</span>
      {createSpacer(company, spacer)}
      <span>The Magi System</span>
    </div>
    <br/>
    <br/>
  </>)
}

function ShowLoadingResources(loadingProgress: LoadingProgress) {
  const resources = loadingProgress.listTotalProgressPerLoadedEntry();

  const resourceLoadingItems = ResourceLoadingStatus(loadingProgress);
  const resourceListItems = resources.map(DisplayResource);

  return (<>
    <div className={styles['loaded-resources']}>
      <OperatingSystemStats/>
      {resourceLoadingItems}
      <ul>{resourceListItems}</ul>
    </div>
  </>);
}

function ShowUserMessage(props: { onClick: () => void }) {
  const onClick = props.onClick;

  return (<>
    <div className={styles['user-message']}>
      <div className={styles['user-message-position-container']}>
        <div className={styles['user-message-container']}>
          <h1>Portfolio of Joey de Ruiter</h1>
          <span>Click continue to begin</span>
          <div className={styles['button-center-container']}>
            <button onClick={onClick}>Continue</button>
          </div>
        </div>
      </div>
    </div>
  </>);
}

function DisplayLoadingProgress(props: { loadingProgress: LoadingProgress }) {
  const loadingProgress = props.loadingProgress;
  const loadingResources = ShowLoadingResources(loadingProgress);

  return <>
    {loadingResources}
  </>
}

export function SceneLoader() {
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(true);

  const scenes  = useRef<RendererScenes>(createRenderScenes());
  const actions = useRef<UpdateAction[]>([]);

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  
  useEffect(() => {
    const query = window.location.search;
    const searchParams = new URLSearchParams(query);
    const debug = searchParams.has('debug');

    const manager = new AssetManager(debug, new LoadingManager());

    manager.add('Lights', createLights);
    manager.add('Floor', createFloor);
    manager.add('Monitor', createMonitor);
    manager.add('Desk', createDesk);
    
    setLoadingProgress(manager.loadingProgress());

    const fetchData = async () => {
      const { rendererScenes, updateActions } = await manager.load(() => {
        setLoadingProgress(manager.loadingProgress());
      });

      scenes.current = rendererScenes;
      actions.current = updateActions;
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!loadingProgress) { return; }

    if (loadingProgress.isDoneLoading()) {
      setTimeout(() => { setLoading(false); }, 1000);
    }
  }, [loadingProgress]);
    
  if (loading) {
    return <>{loadingProgress && <DisplayLoadingProgress loadingProgress={loadingProgress}/>}</>
  } else {
    return (<>
      { showMessage && <ShowUserMessage onClick={() => setShowMessage(false)}/> }
      <Renderer
        showMessage={showMessage}
        scenes={scenes.current}
        actions={actions.current}
      />
    </>)
  }
};
