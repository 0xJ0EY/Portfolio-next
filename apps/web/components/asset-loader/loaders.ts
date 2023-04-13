import { BoxGeometry, LoadingManager, Mesh, MeshBasicMaterial, Object3D, Scene, Vector3 } from "three";
import { RendererScenes } from "../renderer/Renderer";

enum SceneTarget {
  Source,
  Cutout,
  Css
}

type SceneObject = {
  target: SceneTarget
  object: Object3D,
  updateAction: ((self: Object3D) => void) | null
}

const createRenderScenes = (): [Scene, Scene, Scene] => {
  return [new Scene(), new Scene(), new Scene()];
}

const createLights = async (): Promise<SceneObject[]> => {
  const geo = new BoxGeometry(1, 1, 1);
  const mat = new MeshBasicMaterial({ color: 0x00FF00 });
  const mesh = new Mesh(geo, mat);

  return [{
    target: SceneTarget.Source,
    object: mesh,
    updateAction: null
  }];
};

const createFloors = async (): Promise<SceneObject[]> => {
  return [];
}

const createMonitor = async (): Promise<SceneObject[]> => {
  return [];
}

export const loadRenderScenes = async (manager: LoadingManager | null): Promise<RendererScenes> => {
  const [sourceScene, cutoutScene, cssScene] = createRenderScenes();

  const actions = [
    createLights(),
    createFloors(),
    createMonitor()
  ];

  const updateActions: (() => void)[] = [];

  const results = await Promise.all(actions);

  results.forEach(result => {
    result.forEach(entry => {
      switch (entry.target) {
        case SceneTarget.Source:
          sourceScene.add(entry.object);
          break;
        case SceneTarget.Cutout:
          cutoutScene.add(entry.object);
          break;
        case SceneTarget.Css:
          cssScene.add(entry.object);
          break;
      }

      if (entry.updateAction !== null) {
        // Create a closure with the update action as target
        const updateAction = function() {
          if (entry.updateAction == null) { return; }
          entry.updateAction(entry.object);
        }

        updateActions.push(updateAction);
      };
    });

    console.log(updateActions);
  })

  return { sourceScene, cutoutScene, cssScene };
};