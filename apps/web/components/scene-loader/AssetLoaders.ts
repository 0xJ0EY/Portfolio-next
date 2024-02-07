import { AmbientLight, Box3, BoxGeometry, BufferGeometry, CameraHelper, DirectionalLight, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, Scene, WebGLCapabilities, WebGLRenderer } from "three";
import { AssetManagerContext, OptionalUpdateAction, onProgress } from "./AssetManager";
import { AssetKeys } from "./AssetKeys";
import { RendererScenes, ThreeRenderers } from "../renderer/Renderer";
import { isSafari } from "../renderer/util";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { degToRad } from "three/src/math/MathUtils";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { isMobileDevice } from "./util";

export const DisplayParentName = "DisplayParent";
export const DisplayName = "Display";

const GLTF_SHADOWS_CAST     = 0x01;
const GLTF_SHADOWS_RECEIVE  = 0x02;
const GLTF_SHADOWS_ALL      = GLTF_SHADOWS_CAST | GLTF_SHADOWS_RECEIVE;

const mobileTextureMapDimensions = 4096;

function enableGLTFShadows(gltf: GLTF, state: number = GLTF_SHADOWS_ALL) {
  gltf.scene.traverse(node => {
    if (node instanceof Mesh) {
      node.castShadow     = (state & GLTF_SHADOWS_CAST) === GLTF_SHADOWS_CAST;
      node.receiveShadow  = (state & GLTF_SHADOWS_RECEIVE) === GLTF_SHADOWS_RECEIVE;
    }
  });
}

export function createRenderScenes(): RendererScenes {
  return {
    sourceScene: new Scene(),
    cutoutScene: new Scene(),
    cssScene: new Scene()
  };
}

export function createRenderers(width: number, height: number): ThreeRenderers {
  const webglRenderer = new WebGLRenderer({ antialias: true, alpha: true });

  webglRenderer.capabilities.maxSamples = 32; // Set the gl.MAX_SAMPLES for smoother antialiasing, default is 4
  webglRenderer.shadowMap.enabled = true;
  webglRenderer.shadowMap.type = PCFSoftShadowMap;

  const cssRenderer = new CSS3DRenderer();

  webglRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);

  return {
    webgl: webglRenderer,
    css3d: cssRenderer
  }
}

export async function NoopLoader(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  return null;
}

function getTextureMapDimension(max: number, isMobile: boolean, capabilities: WebGLCapabilities): number {
  let current = !isMobile ? max : mobileTextureMapDimensions;
  return Math.min(current, capabilities.maxTextureSize);
}

export async function createLights(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {

  const isMobile = isMobileDevice();
  const ambientLight = new AmbientLight(0x404040);
  ambientLight.intensity = .5;
  context.scenes.sourceScene.add(ambientLight);

  onProgress(50);

  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.x = 10;
  directionalLight.position.z = 10;
  directionalLight.position.y = 20;
  directionalLight.castShadow = true;

  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.bottom = -15;

  directionalLight.shadow.blurSamples = 10;
  directionalLight.shadow.radius = 10;

  directionalLight.shadow.camera.near = 15;
  directionalLight.shadow.camera.far = 40;

  // Although my iPhone reports that it is capable of 16k texture maps, it crashes at 8
  // This is not a problem on my iPad that is actually capable of 8k texture maps
  const shadowMapDimension = getTextureMapDimension(8192, isMobile, context.renderers.webgl.capabilities);

  directionalLight.shadow.mapSize.width   = shadowMapDimension;
  directionalLight.shadow.mapSize.height  = shadowMapDimension;

  directionalLight.shadow.radius = 10;
  directionalLight.shadow.bias = !isMobile ? -0.00075 : -0.0025;

  context.scenes.sourceScene.add(directionalLight);

  onProgress(100);

  // context.scenes.sourceScene.add(new CameraHelper(directionalLight.shadow.camera));

  return null;
}

export async function createFloor(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
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

  enableGLTFShadows(gltf);

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

  cssPage.position.set(x, y, z)

  cssPage.scale.set(viewWidthScale, viewHeightScale, 1);
  cssPage.rotateX(Math.atan(height / depth) - degToRad(90));

  context.scenes.cssScene.add(cssPage);
  context.scenes.sourceScene.add(gltf.scene);
  context.scenes.cutoutScene.add(cutoutDisplay);

  return null;
}

export async function createKeyboard(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const gltf = await context.gltfLoader.loadAsync("/assets/Keyboard.gltf");

  for (const obj of gltf.scene.children) {
    obj.userData[AssetKeys.CameraCollidable] = true;
  }

  // TODO: Cast a big rectangle over it, so we collide with that instead of the individual keys

  enableGLTFShadows(gltf);

  context.scenes.sourceScene.add(gltf.scene);

  return null;
}

export async function createDesk(context: AssetManagerContext, onProgress: onProgress): Promise<OptionalUpdateAction> {
  const gltf = await context.gltfLoader.loadAsync("/assets/Desk.gltf");

  for (const obj of gltf.scene.children) {
    obj.userData[AssetKeys.CameraCollidable] = true;
  }

  enableGLTFShadows(gltf);

  context.scenes.sourceScene.add(gltf.scene);
  return null;
}
