import { AmbientLight, Box3, BufferGeometry, DirectionalLight, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Scene } from "three";
import { AssetManagerContext, OptionalUpdateAction, onProgress } from "./AssetManager";
import { AssetKeys } from "./AssetKeys";
import { RendererScenes } from "../renderer/Renderer";
import { isSafari } from "../renderer/util";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { degToRad } from "three/src/math/MathUtils";

export const DisplayParentName = "DisplayParent";
export const DisplayName = "Display";

export function createRenderScenes(): RendererScenes {
  return {
    sourceScene: new Scene(),
    cutoutScene: new Scene(),
    cssScene: new Scene()
  };
}

export async function createLights(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const ambientLight = new AmbientLight(0x404040);
  ambientLight.intensity = .5;
  context.scenes.sourceScene.add(ambientLight);

  onProgress(50);

  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.x = .75;
  directionalLight.position.z = .9;
  context.scenes.sourceScene.add(directionalLight);

  onProgress(100);

  return null;
}

export async function createFloor(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const geo = new PlaneGeometry(100, 100);
  const mat = new MeshStandardMaterial({ color: 0xFFFFFF });
  const plane = new Mesh(geo, mat);
  plane.rotateX(-Math.PI / 2);

  plane.position.y = -1.5;

  plane.userData[AssetKeys.CameraCollidable] = true;

  context.scenes.sourceScene.add(plane.clone());

  return null;
}

function transformWebUrlToDesktop(webUrl: string): string {
  const parts = webUrl.split('-');

  const index = parts.findIndex(x => x === 'web');
  parts[index] = 'desktop';

  return 'https://' + parts.join('-');
}

function getDesktopTargetUrl(): string {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local';

  if (env === 'production') {
    return 'https://portfolio-next-web.vercel.app';
  }

  if (env === 'preview' || env === 'development') {
    console.log(process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);

    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? window.location.host;

    return transformWebUrlToDesktop(vercelUrl);
  } else {
    return 'http://192.168.178.134:3001'
  }
}

function getDesktopTarget(debug: boolean): string {
  const url = getDesktopTargetUrl();

  if (!debug) { return url; }

  return `${url}/?debug`;
}

export async function createMonitor(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const gltf = await context.gltfLoader.loadAsync("/assets/Monitor.gltf");

  onProgress(50);

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

  // Use a slightly higher margin on Safari, as 0.1 gives white lines and 0.2 is too big for other browser to look nice.
  const margin = isSafari() ? 0.2 : 0.1;

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
  iframe.id = 'operating-system-iframe';
  iframe.classList.add("iframe-container");
  iframe.style.width = `100%`;
  iframe.style.height = `100%`;
  iframe.style.backgroundColor = 'black';
  iframe.style.boxSizing = 'border-box';
  iframe.style.padding = '32px';

  iframe.src = getDesktopTarget(context.debug);

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

  context.scenes.cssScene.add(cssPage);
  context.scenes.sourceScene.add(gltf.scene);
  context.scenes.cutoutScene.add(cutoutDisplay);

  return null;
}

export async function createDesk(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const gltf = await context.gltfLoader.loadAsync("/assets/Desk.gltf");

  gltf.scene.position.y = -1.3;

  for (const obj of gltf.scene.children) {
    obj.userData[AssetKeys.CameraCollidable] = true;
  }

  context.scenes.sourceScene.add(gltf.scene);

  return null;
}
