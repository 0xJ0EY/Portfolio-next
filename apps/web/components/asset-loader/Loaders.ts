import { AmbientLight, Box3, BoxGeometry, BufferGeometry, CurveUtils, DirectionalLight, Loader, LoadingManager, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Scene, Vector3 } from "three";
import { RendererScenes } from "../renderer/Renderer";
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

const transformWebUrlToDesktop = (webUrl: string): string => {
  const parts = webUrl.split('-');

  const index = parts.findIndex(x => x === 'web');
  parts[index] = 'desktop';

  return 'https://' + parts.join('-');
}

const getTargetDomain = (): string => {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local';

  if (env === 'production') {
    return 'https://portfolio-next-web.vercel.app/';
  }

  if (env === 'preview' || env === 'development') {
    console.log(process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);

    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? window.location.host;

    return transformWebUrlToDesktop(vercelUrl);
  } else {
    return 'http://192.168.178.134:3001'
  }
}

const createMonitor = async (loader: GLTFLoader, scenes: RendererScenes): Promise<OptionalUpdateActions> => {
  const gltf = await loader.loadAsync("/assets/Monitor.gltf");
  gltf.scene.name = DisplayParentName;

  // Correct for desk hight
  for (const x of gltf.scene.children) {
    x.position.y += 5.59;
  }

  const display = gltf.scene.children.find((x) => x.name === DisplayName) as Mesh<BufferGeometry, Material>;
  display.material = new MeshBasicMaterial({ color: 0x000000 });
  display.material.stencilWrite = true;
  display.material.transparent = true;
  display.material.opacity = 1;

  const cutoutDisplay = display.clone();
  display.visible = false;

  const box = display.geometry.boundingBox ?? new Box3();

  const pageWidth = 1280;
  const pageHeight = 980;

  const margin = 0.1;

  const width   = (box.max.x - box.min.x) + margin;
  const height  = width * (pageHeight / pageWidth);
  const depth   = (box.max.z - box.min.z);

  const planeHeight = Math.sqrt(Math.pow(depth, 2) + Math.pow(height, 2));

  const viewHeightScale = planeHeight / pageHeight;
  const viewWidthScale  = width / pageWidth;

  // TODO: Calculate the correct aspect ratio for the content
  const div = document.createElement('div');
  div.style.width = `${pageWidth}px`;
  div.style.height = `${pageHeight}px`;

  const iframe = document.createElement('iframe');
  iframe.classList.add("iframe-container");
  iframe.style.width = `100%`;
  iframe.style.height = `100%`;
  iframe.style.backgroundColor = 'black';
  iframe.style.border = '0 solid black';
  iframe.style.boxSizing = 'border-box';
  iframe.style.padding = '32px';

  iframe.src = getTargetDomain();

  div.appendChild(iframe);

  const cssPage = new CSS3DObject(div);

  const [localX, localY, localZ] = [
    (box.min.x - margin / 2) + width / 2,
    (box.min.y - margin / 2) + height / 2,
    box.min.z + depth / 2
  ];

  const [x, y, z] = [
    display.position.x + localX,
    display.position.y + localY,
    display.position.z + localZ
  ];

  cssPage.position.set(x, y, z);

  cssPage.scale.set(viewWidthScale, viewHeightScale, 1);
  cssPage.rotateX(Math.atan(height / depth) - degToRad(90));

  scenes.cssScene.add(cssPage);
  scenes.sourceScene.add(gltf.scene);
  scenes.cutoutScene.add(cutoutDisplay);

  return null;
}

const createDesk = async (loader: GLTFLoader, scenes: RendererScenes): Promise<OptionalUpdateActions> => {
  const gltf = await loader.loadAsync("/assets/Desk.gltf");

  gltf.scene.position.y = -1.3;

  for (const obj of gltf.scene.children) {
    obj.userData[AssetKeys.CameraCollidable] = true;
  }

  scenes.sourceScene.add(gltf.scene);

  return null;
}

export const loadRenderScenes = async (manager: LoadingManager | undefined): Promise<[RendererScenes, UpdateActions]> => {
  const rendererScenes = createRenderScenes();
  const gltfLoader = new GLTFLoader(manager);

  const actions = [
    createLights(rendererScenes),
    createFloors(rendererScenes),
    createMonitor(gltfLoader, rendererScenes),
    createDesk(gltfLoader, rendererScenes),
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
