import { AmbientLight, Box3, BoxGeometry, BufferGeometry, CameraHelper, Color, DirectionalLight, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, PointLight, Scene, Vector3, WebGLCapabilities, WebGLRenderer } from "three";
import { AssetLoader, AssetManagerContext, OptionalUpdateAction } from "./AssetManager";
import { AssetKeys } from "./AssetKeys";
import { RendererScenes } from "../renderer/Renderer";
import { isSafari } from "../renderer/util";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { degToRad } from "three/src/math/MathUtils";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { isMobileDevice } from "./util";

export const DisplayParentName = "DisplayParent";
export const DisplayName = "Display";

const GLTF_SHADOWS_CAST     = 0x01;
const GLTF_SHADOWS_RECEIVE  = 0x02;
const GLTF_SHADOWS_ALL      = GLTF_SHADOWS_CAST | GLTF_SHADOWS_RECEIVE;

function enableGLTFShadows(gltf: GLTF, state: number = GLTF_SHADOWS_ALL) {
  gltf.scene.traverse(node => {
    if (node instanceof Mesh) {
      node.castShadow     = (state & GLTF_SHADOWS_CAST) === GLTF_SHADOWS_CAST;
      node.receiveShadow  = (state & GLTF_SHADOWS_RECEIVE) === GLTF_SHADOWS_RECEIVE;
    }
  });
}

export function createRenderScenes(): RendererScenes {
  const sourceScene = new Scene();

  // The SAOPass doesn't work if the background is 0xFFFFFF, so we opt for 0xFEFEFE instead
  // I thought it came due to the cutout shader, but it doesn't seem to have any effect on it.
  sourceScene.background = new Color(0xFEFEFE);

  return {
    sourceScene,
    cutoutScene: new Scene(),
    cssScene: new Scene()
  };
}

function getTextureMapDimension(requested: number, capabilities: WebGLCapabilities): number {
  return Math.min(requested, capabilities.maxTextureSize);
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
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ?? window.location.host;

    return transformWebUrlToDesktop(vercelUrl);
  } else {
    return 'http://192.168.178.134:3001/'
  }
}

function getDesktopTarget(debug: boolean): string {
  const url = getDesktopTargetUrl();

  if (!debug) { return url; }

  return `${url}/?debug`;
}

export function NoopLoader(): AssetLoader<GLTF> {
  return {
    downloader: null,
    builder: null,
    builderProcessTime: 0
  }
}

export function LightsLoader(): AssetLoader<GLTF> {
  function builder(context: AssetManagerContext, asset: GLTF | null): OptionalUpdateAction {

    const isMobile = isMobileDevice();
    const ambientLight = new AmbientLight(0x404040);
    ambientLight.intensity = .5;
    context.scenes.sourceScene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.x = 10;
    directionalLight.position.z = 10;
    directionalLight.position.y = 20;
    directionalLight.castShadow = true;

    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;

    directionalLight.shadow.blurSamples = 8;
    directionalLight.shadow.radius = 2;

    directionalLight.shadow.camera.near = 14;
    directionalLight.shadow.camera.far = 35;

    // Although my iPhone reports that it is capable of 16k texture maps, it crashes at 8
    // This is not a problem on my iPad that is actually capable of 8k texture maps
    const shadowMapDimension = getTextureMapDimension(isMobile ? 1024 : 2048, context.renderer.capabilities);

    directionalLight.shadow.mapSize.width   = shadowMapDimension;
    directionalLight.shadow.mapSize.height  = shadowMapDimension;

    directionalLight.shadow.bias = !isMobile ? -0.00075 : -0.0025;

    context.scenes.sourceScene.add(directionalLight);

    return null;
  }

  return {
    downloader: null,
    builder,
    builderProcessTime: 0
  }
}

export function FloorLoader(): AssetLoader<GLTF> {

  function builder(context: AssetManagerContext, asset: GLTF | null): OptionalUpdateAction {
    const geo = new PlaneGeometry(100, 100);
    const mat = new MeshStandardMaterial({ color: 0x808080 });
    const plane = new Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);

    plane.castShadow = true;
    plane.receiveShadow = true;

    plane.userData[AssetKeys.CameraCollidable] = true;

    context.scenes.sourceScene.add(plane.clone());

    return null;
  }

  return {
    downloader: null,
    builder,
    builderProcessTime: 0
  }
}

export function DeskLoader(): AssetLoader<GLTF> {
  async function downloader(context: AssetManagerContext): Promise<GLTF> {
    return context.gltfLoader.loadAsync('/assets/Desk.gltf');
  }

  function builder(context: AssetManagerContext, asset: GLTF | null): OptionalUpdateAction {
    if (!asset) { return null; }

    for (const obj of asset.scene.children) {
      obj.userData[AssetKeys.CameraCollidable] = true;
    }

    enableGLTFShadows(asset);

    context.scenes.sourceScene.add(asset.scene);

    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 0
  }
}

export function MonitorLoader(): AssetLoader<GLTF> {
  async function downloader(context: AssetManagerContext): Promise<GLTF> {
    return context.gltfLoader.loadAsync('/assets/Monitor.gltf');
  }

  function builder(context: AssetManagerContext, asset: GLTF | null): OptionalUpdateAction {
    if (!asset) { return null; }

    asset.scene.name = DisplayParentName;

    enableGLTFShadows(asset);

    const display = asset.scene.children.find((x) => x.name === DisplayName) as Mesh<BufferGeometry, Material>;
    display.material = new MeshBasicMaterial({ color: 0x000000 });
    display.material.stencilWrite = true;
    display.material.transparent = true;

    const cutoutDisplay = display.clone();
    display.position.z -= 0.1;

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
      cutoutDisplay.position.x + localX,
      cutoutDisplay.position.y + localY,
      cutoutDisplay.position.z + localZ
    ];

    cssPage.position.set(x, y, z)

    cssPage.scale.set(viewWidthScale, viewHeightScale, 1);
    cssPage.rotateX(Math.atan(height / depth) - degToRad(90));

    context.scenes.cssScene.add(cssPage);
    context.scenes.sourceScene.add(asset.scene);
    context.scenes.cutoutScene.add(cutoutDisplay);

    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 200
  }
}

export function KeyboardLoader(): AssetLoader<GLTF> {
  async function downloader(context: AssetManagerContext): Promise<GLTF> {
    return context.gltfLoader.loadAsync('/assets/Keyboard.gltf');
  }

  function builder(context: AssetManagerContext, asset: GLTF | null): OptionalUpdateAction {
    if (!asset) { return null; }

    for (const obj of asset.scene.children) {
      obj.userData[AssetKeys.CameraCollidable] = true;
    }

    enableGLTFShadows(asset);

    context.scenes.sourceScene.add(asset.scene);

    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 0
  }
}
