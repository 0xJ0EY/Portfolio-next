import { useEffect, useState } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { createRenderScenes, loadRenderScenes, UpdateActions } from "./Loaders";
import { sendMessageToChild } from "rpc";

export function AssetLoader() {
  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState<RendererScenes>(createRenderScenes());
  const [actions, setActions] = useState<UpdateActions>([]);
  
  useEffect(() => {
    const query = window.location.search;
    const searchParams = new URLSearchParams(query);

    const manager = new LoadingManager();
    const fetchData = async () => {
      const debug = searchParams.has('debug');
      const [rendererScenes, updateActions] = await loadRenderScenes(manager, debug);

      setActions(updateActions);
      setScenes(rendererScenes);

      setLoading(false);
    }

    fetchData();
  }, []);
  
  if (loading) {
    return <>Loading!</>
  } else {
    return (
      <>
        <Renderer scenes={scenes} actions={actions} />
      </>
    )
  }
};
