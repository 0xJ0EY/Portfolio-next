import { useEffect, useState, useRef } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { AssetManager, LoadingProgress, LoadingProgressEntry, UpdateAction } from "./AssetManager";
import { CablesLoader, DeskLoader, FloorLoader, KeyboardLoader, LightsLoader, MonitorLoader, MouseLoader, HydraLoader, NoopLoader, createRenderScenes, PlantLoader } from "./AssetLoaders";
import { detectWebGL, isDebug, isMobileDevice } from "./util";
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

function DisplayResource(entry: LoadingProgressEntry) {
  const total = 2;
  let state = 0;

  state += Number(entry.downloaded);
  state += Number(entry.processed);

  const displayState = <>({state}/{total})</>

  return <li style={{ fontFamily: 'monospace' }} key={entry.name}>{entry.name}{createSpacer(entry.name, 30, '.')}{displayState}</li>
}

function OperatingSystemStats() {
  const name = "Joey de Ruiter";
  const company = "Joeysoft, bv.";

  const spacer = 16;

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
  const resources = loadingProgress.listAllEntries();

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
          <p>I would recommend to experience the showcase, but if you just wanted to download my CV, you can do so <a href="/assets/cv/CV_Joey_de_Ruiter_en.pdf" target="_blank">here</a>.</p>
          
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
        <p>Or if you only want to download my CV, you can do so from <a href="/assets/cv/CV_Joey_de_Ruiter_en.pdf" target="_blank">here</a>.</p>
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
  const managerRef  = useRef<AssetManager | null>(null);
  const actions     = useRef<UpdateAction[]>([]);

  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [supportsWebGL, setSupportsWebGL] = useState<boolean | null>(null);
  
  useEffect(() => {
    const hasWebGL = detectWebGL();
    setSupportsWebGL(hasWebGL);
    if (!hasWebGL) { return; }

    managerRef.current = new AssetManager(scenesRef.current, new LoadingManager())
    const manager = managerRef.current;

    manager.init(isDebug());
    manager.reset();

    manager.add('Linked to Magi-1', NoopLoader());
    manager.add('Linked to Magi-2', NoopLoader());
    manager.add('Linked to Magi-3', NoopLoader());
    manager.add('Loading desk', DeskLoader());
    manager.add('Loading cables', CablesLoader());
    manager.add('Loading mouse', MouseLoader());
    manager.add('Loading lights', LightsLoader());
    manager.add('Loading floor', FloorLoader());
    manager.add('Loading plant', PlantLoader());
    manager.add('Loading Alchemical Hydra', HydraLoader());
    manager.add('Loading keyboard', KeyboardLoader());
    manager.add('Loading monitor', MonitorLoader());

    setLoadingProgress(managerRef.current.loadingProgress());

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

  if (supportsWebGL === null) { return <></>; }
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
