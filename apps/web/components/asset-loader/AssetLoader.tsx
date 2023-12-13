import { useEffect, useState } from "react";
import { LoadingManager } from "three";
import { Renderer, RendererScenes } from "../renderer/Renderer";
import { createRenderScenes, loadRenderScenes, UpdateActions } from "./Loaders";
import { sendMessageToChild } from "rpc";

function useSoundManagement() {
  const [isSoundEnabled, setSoundEnabled] = useState(true);

  function toggleSound() {
    if (isSoundEnabled) {
      disableSound();
    } else {
      enableSound();
    }
  }

  function sendSoundStateToChild(enabled: boolean) {
    const iframe = document.getElementById('operating-system-iframe') as HTMLIFrameElement;
    sendMessageToChild(iframe.contentWindow, { method: 'enable_sound_message', enabled });
  }

  function enableSound() {
    setSoundEnabled(true);
    sendSoundStateToChild(true);
  }

  function disableSound() {
    setSoundEnabled(false);
    sendSoundStateToChild(false);
  }

  return {isSoundEnabled, toggleSound, enableSound, disableSound};
}

export function AssetLoader() {
  const [loading, setLoading] = useState(true);
  const {isSoundEnabled, toggleSound} = useSoundManagement();
  const [scenes, setScenes] = useState<RendererScenes>(createRenderScenes());
  const [actions, setActions] = useState<UpdateActions>([]);
  
  useEffect(() => {
    const manager = new LoadingManager();
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
    return (
      <>
        <button onClick={() => toggleSound()}>{isSoundEnabled ? 'Mute' : 'Unmute'}</button>
        <Renderer scenes={scenes} actions={actions} />
      </>
    )
  }
};
