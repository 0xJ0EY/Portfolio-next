import { BoxGeometry, CurveUtils, LoadingManager, Mesh, MeshBasicMaterial, Object3D, Scene, Vector3 } from "three";
import { RendererScenes } from "../renderer/Renderer";

// TODO: Add deltatime to void call
export type UpdateAction = (() => void);
export type UpdateActions = UpdateAction[];
export type OptionalUpdateActions = UpdateAction | UpdateActions | null;

export const createRenderScenes = (): RendererScenes => {
  return {
    sourceScene: new Scene(),
    cutoutScene: new Scene(),
    cssScene: new Scene()
  };
}

const createLights = async (rendererScenes: RendererScenes): Promise<OptionalUpdateActions> => {
  const geo = new BoxGeometry(1, 1, 1);
  const mat = new MeshBasicMaterial({ color: 0x00FF00 });
  const mesh = new Mesh(geo, mat);

  rendererScenes.sourceScene.add(mesh);

  return () => {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
  };
};

const createFloors = async (rendererScenes: RendererScenes): Promise<OptionalUpdateActions> => {
  return [
    () => {}
  ];
}

const createMonitor = async (rendererScenes: RendererScenes): Promise<OptionalUpdateActions> => {
  return null;
}

export const loadRenderScenes = async (manager: LoadingManager | null): Promise<[RendererScenes, UpdateActions]> => {
  const rendererScenes = createRenderScenes();

  const actions = [
    createLights(rendererScenes),
    createFloors(rendererScenes),
    createMonitor(rendererScenes)
  ];

  const result = await Promise.all(actions);

  const updateActions: UpdateActions = result
    .reduce((acc: (() => void)[], cur) => {
      if (cur === null) return acc;

      if (Array.isArray(cur)) {
        acc.push(...cur);
      } else {
        acc.push(cur);
      }
      
      return acc;
    }, []);

  return [rendererScenes, updateActions];
};