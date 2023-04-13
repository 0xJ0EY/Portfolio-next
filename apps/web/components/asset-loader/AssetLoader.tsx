import { useEffect, useState } from "react";
import { LoadingManager, Scene } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { loadRenderScenes } from "./loaders";

export function AssetLoader() {
  const [loading, setLoading] = useState(true);
  const [scenes, setScenes] = useState({});
  const manager = new LoadingManager();

  useEffect(() => {
    const fetchData = async () => {
      console.log(await loadRenderScenes(manager));
    }

    fetchData();
    setLoading(false);
  }, []);
  
  if (loading) {
    return <>Loading!</>
  } else {
    return <Renderer {...scenes} />
  }
};
