import { AmbientLight, Box3, BoxGeometry, BufferGeometry, CameraHelper, Color, DirectionalLight, DoubleSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, PointLight, RepeatWrapping, Scene, Texture, TextureLoader, Vector3, WebGLCapabilities, WebGLRenderer, sRGBEncoding } from "three";
import { AssetLoader, AssetManagerContext, OptionalUpdateAction } from "./AssetManager";
import { AssetKeys } from "./AssetKeys";
import { RendererScenes } from "../renderer/Renderer";
import { isSafari } from "../renderer/util";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { degToRad } from "three/src/math/MathUtils";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export const DisplayParentName = "DisplayParent";
export const DisplayName = "Display";
const MonitorName = "Monitor";
const ComputerName = "Computer";
const DeskName = "Desk";
const FloorName = "Floor";

const GLTF_SHADOWS_CAST     = 0x01;
const GLTF_SHADOWS_RECEIVE  = 0x02;
const GLTF_SHADOWS_ALL      = GLTF_SHADOWS_CAST | GLTF_SHADOWS_RECEIVE;

async function loadTexture(context: AssetManagerContext, asset: string): Promise<Texture> {
  const texture = await context.textureLoader.loadAsync(asset);

  texture.flipY = false;

  return texture;
}

async function loadModel(context: AssetManagerContext, asset: string): Promise<GLTF> {
  return await context.gltfLoader.loadAsync(asset);
}

function enableCameraCollision(asset: GLTF): void {
  for (const obj of asset.scene.children) {
    obj.userData[AssetKeys.CameraCollidable] = true;
  }
}

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

export function NoopLoader(): AssetLoader {
  return {
    downloader: null,
    builder: null,
    builderProcessTime: 0
  }
}

export function LightsLoader(): AssetLoader {
  function builder(context: AssetManagerContext): OptionalUpdateAction {
    const ambientLight = new AmbientLight(0x404040);
    ambientLight.intensity = 4;
    context.scenes.sourceScene.add(ambientLight);

    return null;
  }

  return {
    downloader: null,
    builder,
    builderProcessTime: 0
  }
}

export function FloorLoader(): AssetLoader {
  let asset: GLTF | null = null;
  let texture: Texture | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/Floor.png'); }
    const assetLoader   = async () => { asset = await loadModel(context, '/assets/Floor.glb'); }

    await Promise.all([textureLoader(), assetLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!texture) { return null; }
    if (!asset) { return null; }

    enableCameraCollision(asset);

    context.scenes.sourceScene.add(asset.scene);

    const material = new MeshStandardMaterial({ map: texture });
    asset.scene.traverse((node) => {
      if (!(node instanceof Mesh)) { return; }

      if (node.name === FloorName) {
        node.material = material;
      }
    });


    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 0
  }
}

export function DeskLoader(): AssetLoader {
  let asset: GLTF | null = null;
  let texture: Texture | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/DeskTexture.png'); }
    const assetLoader   = async () => { asset = await loadModel(context, '/assets/Desk.glb'); }

    await Promise.all([textureLoader(), assetLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!texture) { return null; }
    if (!asset) { return null; }

    for (const obj of asset.scene.children) {
      obj.userData[AssetKeys.CameraCollidable] = true;
    }

    const material = new MeshStandardMaterial({ map: texture });
    asset.scene.traverse((node) => {
      if (!(node instanceof Mesh)) { return; }

      if (node.name === DeskName) {
        node.material = material;
      }
    });

    context.scenes.sourceScene.add(asset.scene);

    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 0
  }
}

export function MonitorLoader(): AssetLoader {
  let monitorTexture: Texture | null = null;
  let computerTexture: Texture | null = null;

  let asset: GLTF | null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const monitorLoader   = async () => { monitorTexture = await loadTexture(context, '/assets/Monitor.png'); }
    const computerLoader  = async () => { computerTexture = await loadTexture(context, '/assets/Computer.png'); }
    const assetLoader     = async () => { asset = await loadModel(context, '/assets/Monitor.glb'); }

    await Promise.all([monitorLoader(), computerLoader(), assetLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }
    if (!monitorTexture || !computerTexture) { return null; }

    asset.scene.name = DisplayParentName;

    const displayMaterial = new MeshBasicMaterial({ color: 0x000000 });
    displayMaterial.stencilWrite = true;
    displayMaterial.transparent = true;

    const monitorMaterial   = new MeshStandardMaterial({ map: monitorTexture });
    const computerMaterial  = new MeshStandardMaterial({ map: computerTexture });

    asset.scene.traverse((node) => {
      if (!(node instanceof Mesh)) { return; }

      if (node.name === DisplayName) {
        node.material = displayMaterial;

      } else if (node.name === MonitorName) {
        node.material = monitorMaterial;

      } else if (node.name === ComputerName) {
        node.material = computerMaterial;
      }
    });

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
    builderProcessTime: 250
  }
}

export function KeyboardLoader(): AssetLoader {
  let asset: GLTF | null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    asset = await loadModel(context, '/assets/Keyboard.gltf');
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
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


export function MuttadilesLoader(): AssetLoader {
  let asset: GLTF | null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    asset = await loadModel(context, '/assets/Muttadiles.gltf');
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }

    enableGLTFShadows(asset);

    asset.scene.traverse(node => {
      if (node instanceof Mesh) {
        node.material.side = 0;
      }
    })

    context.scenes.sourceScene.add(asset.scene);

    return null;
  }

  return {
    downloader,
    builder,
    builderProcessTime: 0
  }
}
