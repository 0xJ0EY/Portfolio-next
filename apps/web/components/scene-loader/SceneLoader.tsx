import { useEffect, useState, useRef } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { AssetManager, LoadingProgress, TotalProgressPerEntry, UpdateAction } from "./AssetManager";
import { NoopLoader, createDesk, createFloor, createLights, createMonitor, createRenderScenes } from "./AssetLoaders";
import styles from './SceneLoader.module.css';
import { detectWebGL } from "./util";

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
  const total = Math.floor(container.total);
  
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
      <span>Magi (C)1998 Joeysoft, bv</span>
    </div>
    <br/>
  </>)
}

function ShowLoadingResources(loadingProgress: LoadingProgress) {
  const resources = loadingProgress.listTotalProgressPerLoadedEntry(5);

  const resourceLoadingItems = ResourceLoadingStatus(loadingProgress);
  const resourceListItems = resources.map(DisplayResource);

  return (<>
    <div>
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

function ShowBios() {
  const magi1 = "Melchior-Magi 1";
  const magi2 = "Balthasar-Magi 2";
  const magi3 = "Casper-Magi 3";

  const length = 30;


  return (<>
    <div>
      <p>Magi, Joeysoft, bv - 1998-2024</p>
      <h3>Components</h3>
      <ul>
        <li>{magi1}{createSpacer(magi1, length, '.')}Linked</li>
        <li>{magi2}{createSpacer(magi2, length, '.')}Linked</li>
        <li>{magi3}{createSpacer(magi3, length, '.')}Linked</li>
      </ul>
    </div>
  </>);
}

function DisplayWebGLError() {
  return (<div className={styles['error-container']}>
      <h3>ERROR: No WebGL detected</h3>
      <p>WebGL is required to run this site.</p>
      <p>Please enable it or switch to a browser that supports WebGL</p>
  </div> );
}

function DisplayLoadingProgress(props: { supportsWebGL: boolean | null, loadingProgress: LoadingProgress }) {
  const loadingProgress = props.loadingProgress;
  const supportsWebGL = props.supportsWebGL ?? true;

  const loadingResources = ShowLoadingResources(loadingProgress);

  return (<>
    <div className={styles['loading-progress']}>
      <OperatingSystemStats/>
      {supportsWebGL && <ShowBios/>}
      {supportsWebGL && loadingResources}
      {!supportsWebGL && <DisplayWebGLError/>}
    </div>
  </>)
}

export function SceneLoader() {
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(true);

  const scenes  = useRef<RendererScenes>(createRenderScenes());
  const actions = useRef<UpdateAction[]>([]);

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  
  useEffect(() => {
    const query = window.location.search;
    const searchParams = new URLSearchParams(query);
    const debug = searchParams.has('debug');

    const manager = new AssetManager(debug, new LoadingManager());

    if (debug) {
      setShowMessage(false);
    }

    manager.add('Linked to Magi-1', NoopLoader);
    manager.add('Linked to Magi-2', NoopLoader);
    manager.add('Linked to Magi-3', NoopLoader);
    manager.add('Added lights', createLights);
    manager.add('Placed floor', createFloor);
    manager.add('Placed monitor', createMonitor);
    manager.add('Placed desk', createDesk);
    
    setLoadingProgress(manager.loadingProgress());
    setSupportsWebGL(detectWebGL());

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
    
  if (loading || !supportsWebGL) {
    return <>{loadingProgress && <DisplayLoadingProgress supportsWebGL={supportsWebGL} loadingProgress={loadingProgress}/>}</>
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
