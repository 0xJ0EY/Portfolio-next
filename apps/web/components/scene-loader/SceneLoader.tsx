import { useEffect, useState, useRef } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { AssetManager, LoadingProgress, UpdateAction } from "./AssetManager";
import { createDesk, createFloor, createLights, createMonitor, createRenderScenes } from "./AssetLoaders";

function DisplayLoadingProgress(props: { loadingProgress: LoadingProgress }) {
  const loadingProgress = props.loadingProgress;

  const progress = loadingProgress.progress();

  const items = loadingProgress.listTotalProgressPerLoadedEntry();
  const displayItems = items.map(x => <li key={x.entry.name}>{x.entry.name} {x.total}</li>)

  return <>
    <div>{progress.loaded} / {progress.total}</div>
    <ul>{displayItems}</ul>
  </>
}

export function SceneLoader() {
  const [loading, setLoading] = useState(true);
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

      setLoading(false);
    }

    fetchData();

  }, []);
    
  if (loading) {
    return <>{loadingProgress && <DisplayLoadingProgress loadingProgress={loadingProgress}/>}</>
  } else {
    return (
      <Renderer
        scenes={scenes.current}
        actions={actions.current}
      />
    )
  }
};
