import { AmbientLight, Box3, BoxGeometry, BufferGeometry, CurveUtils, DirectionalLight, Loader, LoadingManager, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Scene, Vector3 } from "three";
import { CssWorldScale, RendererScenes } from "../renderer/Renderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { degToRad } from "three/src/math/MathUtils";
import { AssetKeys } from "./AssetKeys";

export const DisplayParentName = "DisplayParent";
export const DisplayName = "Display";

export type UpdateAction = ((deltaTime: number) => void);
export type UpdateActions = UpdateAction[];
export type OptionalUpdateActions = UpdateAction | UpdateActions | null;

export const createRenderScenes = (): RendererScenes => {
  return {
    sourceScene: new Scene(),
    cutoutScene: new Scene(),
    cssScene: new Scene()
  };
}

const createLights = async (scenes: RendererScenes): Promise<OptionalUpdateActions> => {
  const ambientLight = new AmbientLight(0x404040);
  ambientLight.intensity = .5;
  scenes.sourceScene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.x = .75;
  directionalLight.position.z = .9;
  scenes.sourceScene.add(directionalLight);

  return null;
};

const createFloors = async (scenes: RendererScenes): Promise<OptionalUpdateActions> => {

  // Floor
  const geo = new PlaneGeometry(100, 100);
  const mat = new MeshStandardMaterial({ color: 0xFFFFFF });
  const plane = new Mesh(geo, mat);
  plane.rotateX(-Math.PI / 2);

  plane.position.y = -1.5;

  plane.userData[AssetKeys.CameraCollidable] = true;

  scenes.sourceScene.add(plane.clone());

  return null;
}

const createMonitor = async (loader: GLTFLoader, scenes: RendererScenes): Promise<OptionalUpdateActions> => {
  const gltf = await loader.loadAsync("/assets/Monitor.gltf");
  gltf.scene.name = DisplayParentName;

  const display = gltf.scene.children.find((x) => x.name === DisplayName) as Mesh<BufferGeometry, Material>;
  display.material = new MeshBasicMaterial({ color: 0x000000 });
  display.material.stencilWrite = true;
  display.material.transparent = true;
  display.material.opacity = 1;

  const cutoutDisplay = display.clone();
  display.visible = false;

  const box = display.geometry.boundingBox ?? new Box3();

  const pageWidth = 1000;
  const pageHeight = 998;

  const margin = 0.5;
  const scale = CssWorldScale;

  const width   = (box.max.x - box.min.x) * scale + margin;
  const height  = (box.max.y - box.min.y) * scale + margin;
  const depth   = (box.max.z - box.min.z) * scale;

  const planeHeight = Math.sqrt(Math.pow(depth, 2) + Math.pow(height, 2));

  const viewHeightScale = planeHeight / pageHeight;
  const viewWidthScale  = width / pageWidth;

  // TODO: Calculate the correct aspect ratio for the content
  const div = document.createElement('div');
  div.style.width = `${pageWidth}px`;
  div.style.height = `${pageHeight}px`;

  const iframe = document.createElement('iframe');
  iframe.classList.add("iframe-container");
  iframe.style.width = `${pageWidth}px`;
  iframe.style.height = `${pageHeight + 0}px`;
  iframe.style.backgroundColor = 'white';
  iframe.style.border = '32px solid black';
  iframe.style.boxSizing = 'border-box';
  // iframe.src = "http://192.168.178.49:3001";
  iframe.src = "https://example.com/";
  // iframe.src = "https://joeyderuiter.me";

  div.appendChild(iframe);

  const cssPage = new CSS3DObject(div);

  const [localX, localY, localZ] = [
    ((box.min.x * scale) - margin / 2) + width / 2,
    ((box.min.y * scale) - margin / 2) + height / 2,
    (box.min.z * scale) + depth / 2
  ];

  const [x, y, z] = [
    display.position.x * scale + localX,
    display.position.y * scale + localY,
    display.position.z * scale + localZ
  ];

  cssPage.position.set(x, y, z);

  cssPage.scale.set(viewWidthScale, viewHeightScale, 1);
  cssPage.rotateX(Math.atan(height / depth) - degToRad(90));
  scenes.cssScene.add(cssPage);
  scenes.sourceScene.add(gltf.scene);
  scenes.cutoutScene.add(cutoutDisplay);

  return null;
}

export const loadRenderScenes = async (manager: LoadingManager | undefined): Promise<[RendererScenes, UpdateActions]> => {
  const rendererScenes = createRenderScenes();
  const gltfLoader = new GLTFLoader(manager);

  const actions = [
    createLights(rendererScenes),
    createFloors(rendererScenes),
    createMonitor(gltfLoader, rendererScenes)
  ];

  const result = await Promise.all(actions);

  const updateActions: UpdateActions = result
    .reduce((acc: UpdateActions, cur) => {
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
