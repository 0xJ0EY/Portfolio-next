import { useEffect, useState, useRef } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { AssetManager, LoadingProgress, TotalProgressPerEntry, UpdateAction } from "./AssetManager";
import { DeskLoader, FloorLoader, KeyboardLoader, LightsLoader, MonitorLoader, NoopLoader, clearRenderScenes, createRenderScenes } from "./AssetLoaders";
import styles from './SceneLoader.module.css';
import { detectWebGL, getBrowserDimensions, isDebug, isMobileDevice } from "./util";

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
  const [smallWindow, setSmallWindow] = useState(false);

  function onResize() {
    setSmallWindow(isMobileDevice());
  }

  useEffect(() => {
    onResize();

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    }
  }, []);

  return (<>
    <div className={styles['user-message']}>
      <div className={styles['user-message-position-container']}>
        <div className={styles['user-message-container']}>
          <h1>Portfolio of Joey de Ruiter</h1>
          {smallWindow && <p className={styles['warning']}>WARNING: This portfolio is best experienced on a desktop, laptop or a tablet computer</p>}
          <p>
            <span className={styles['continue-text']}>Click continue to begin</span>
            <span className={styles['blinking-cursor']}></span>
          </p>
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
  return (
    <div className={styles['loading-progress']}>
      <OperatingSystemStats/>
      <div className={styles['error-container']}>
        <h3>ERROR: No WebGL detected</h3>
        <p>WebGL is required to run this site.</p>
        <p>Please enable it or switch to a browser that supports WebGL</p>
      </div> 
    </div>
  );
}

function DisplayLoadingProgress(props: { loadingProgress: LoadingProgress }) {
  const loadingProgress = props.loadingProgress;

  const loadingResources = ShowLoadingResources(loadingProgress);

  return (<>
    <div className={styles['loading-progress']}>
      <OperatingSystemStats/>
      <ShowBios/>
      {loadingResources}
    </div>
  </>)
}

function LoadingUnderscore() {
  return (<>
    <div className={styles['loading-underscore']}>
      <span className={styles['blinking-cursor']}></span>
    </div>
  </>);
}


export function SceneLoader() {
  const [loading, setLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showMessage, setShowMessage] = useState(true);
  const [showLoadingUnderscore, setLoadingUnderscore] = useState(true);

  const scenesRef   = useRef<RendererScenes>(createRenderScenes());
  const managerRef  = useRef<AssetManager>(new AssetManager(scenesRef.current, new LoadingManager()));
  const actions     = useRef<UpdateAction[]>([]);

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  
  useEffect(() => {
    const manager = managerRef.current;

    clearRenderScenes(scenesRef.current);

    manager.init(isDebug());
    manager.reset();

    // if (debug) { setShowMessage(false); }

    // manager.add('Linked to Magi-1', NoopLoader);
    // manager.add('Linked to Magi-2', NoopLoader);
    // manager.add('Linked to Magi-3', NoopLoader);
    // manager.add('Added lights', createLights);
    // manager.add('Placed floor', createFloor);
    // manager.add('Placed keyboard', createKeyboard);

    // manager.add('Placed monitor', createMonitor);
    // manager.add('Placed desk', createDesk);

    // manager.loadAsset('Added lights', undefined, buildLights);

    manager.add('Loading desk', DeskLoader());
    manager.add('Loading lights', LightsLoader());
    manager.add('Loading floor', FloorLoader())
    manager.add('Loading monitor', MonitorLoader());
    manager.add('Loading keyboard', KeyboardLoader());

    setLoadingProgress(managerRef.current.loadingProgress());
    setSupportsWebGL(detectWebGL());

    const abortController = new AbortController();

    const fetchData = async () => {
      const { updateActions } = await manager.load(abortController.signal, () => {
        setLoadingProgress(manager.loadingProgress());
      });

      if (!abortController.signal.aborted) {
        actions.current = updateActions;
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    }
  }, []);

  useEffect(() => {
    if (!loadingProgress) { return; }

    console.log('loading process');

    if (loadingProgress.isDoneLoading()) {
      if (!isDebug()) {
        setTimeout(() => { setShowProgress(false); }, 1000);
        setTimeout(() => { setLoadingUnderscore(false); }, 1800);
      } else {
        setShowMessage(false);
        setShowProgress(false);
        setLoadingUnderscore(false);
      }
    }
  }, [loadingProgress]);

  if (supportsWebGL === false) { return DisplayWebGLError(); }

  return (<>
    { showProgress && loadingProgress && <DisplayLoadingProgress loadingProgress={loadingProgress}/> }
    { showLoadingUnderscore && <LoadingUnderscore/> }
    { showMessage && <ShowUserMessage onClick={() => setShowMessage(false)}/> }
    <Renderer
      loading={loading}
      showMessage={showMessage}
      
      scenes={scenesRef.current}
      actions={actions.current}
    />
  </>);
};
