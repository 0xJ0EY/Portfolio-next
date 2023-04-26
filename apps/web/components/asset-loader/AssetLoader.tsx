import { useEffect, useState } from "react";
import { LoadingManager, Scene } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { createRenderScenes, loadRenderScenes, UpdateActions } from "./Loaders";

export function AssetLoader() {
  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState<RendererScenes>(createRenderScenes());
  const [actions, setActions] = useState<UpdateActions>([]);
  const manager = new LoadingManager();

  useEffect(() => {
    const fetchData = async () => {
      const [rendererScenes, updateActions] = await loadRenderScenes(manager);

      setActions(updateActions);
      setScenes(rendererScenes);

      setLoading(false);
    }

    fetchData();
  }, []);
  
  if (loading) {
    return <>Loading!</>
  } else {
    return <Renderer scenes={scenes} actions={actions} />
  }
};
