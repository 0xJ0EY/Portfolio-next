import { AmbientLight, Box3, BufferGeometry, Color, DoubleSide, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Scene, Texture } from "three";
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
const NamePlateName = "NamePlate";
const FloorName = "Floor";

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
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/SmoothFloor.jpg'); }
    const assetLoader   = async () => { asset = await loadModel(context, '/assets/SmoothFloor.glb'); }

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

      node.material = material;
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
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/Desk-light.png'); }
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
  let namePlateTexture: Texture | null = null;

  let asset: GLTF | null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const monitorLoader   = async () => { monitorTexture = await loadTexture(context, '/assets/Monitor.jpg'); }
    const computerLoader  = async () => { computerTexture = await loadTexture(context, '/assets/Computer.jpg'); }
    const namePlateLoader = async () => { namePlateTexture = await loadTexture(context, '/assets/NamePlate.jpg'); }
    const assetLoader     = async () => { asset = await loadModel(context, '/assets/Monitor.glb'); }

    await Promise.all([monitorLoader(), computerLoader(), namePlateLoader(), assetLoader()]);
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
    const nameplateMaterial = new MeshStandardMaterial({ map: namePlateTexture });

    asset.scene.traverse((node) => {
      if (!(node instanceof Mesh)) { return; }

      switch (node.name) {
        case DisplayName:
          node.material = displayMaterial;
          break;
        case MonitorName:
          node.material = monitorMaterial;
          break;
        case ComputerName:
          node.material = computerMaterial;
          break;
        case NamePlateName:
          node.material = nameplateMaterial;
          break;
      }
    });

    const display = asset.scene.children.find((x) => x.name === DisplayName) as Mesh<BufferGeometry, Material>;
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
  let caseTexture: Texture | null = null;
  let keyCapTexture: Texture | null = null;

  let asset: GLTF | null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const caseTextureLoader   = async () => { caseTexture = await loadTexture(context, '/assets/KeyboardCase.jpg'); }
    const keyCapTextureLoader = async () => { keyCapTexture = await loadTexture(context, '/assets/KeyboardKeyCaps.jpg'); }

    const assetLoader = async () => { asset = await loadModel(context, '/assets/Keyboard.glb'); }

    await Promise.all([
      caseTextureLoader(),
      keyCapTextureLoader(),
      assetLoader()
    ]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }
    if (!caseTexture || !keyCapTexture) { return null; }

    enableCameraCollision(asset);

    const caseMaterial    = new MeshStandardMaterial({ map: caseTexture });
    const keyCapMaterial  = new MeshStandardMaterial({ map: keyCapTexture });

    asset.scene.traverse((node) => {
      if (!(node instanceof Mesh)) { return; }

      if (node.name === "Case") {
        node.material = caseMaterial;
      } else {
        node.material = keyCapMaterial;
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

export function MouseLoader(): AssetLoader {
  let texture: Texture | null = null;
  let asset: GLTF | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/Mouse.jpg'); }
    const assetLoader = async () => { asset = await loadModel(context, '/assets/Mouse.glb'); }

    await Promise.all([textureLoader(), assetLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }
    if (!texture) { return null; }

    const material = new MeshBasicMaterial({ map: texture });

    asset.scene.traverse(node => {
      if (!(node instanceof Mesh)) { return; }

      node.material = material;
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

export function CablesLoader(): AssetLoader {
  let asset: GLTF | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    asset = await loadModel(context, '/assets/Cables.gltf');
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }

    const material = new MeshBasicMaterial({ color: 0x303030 });

    asset.scene.traverse(node => {
      if (!(node instanceof Mesh)) { return; }

      node.material = material;
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

export function HydraLoader(): AssetLoader {
  let asset: GLTF | null = null;
  let texture: Texture | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const assetLoader = async () => { asset = await loadModel(context, '/assets/Hydra.glb'); }
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/Hydra.jpg'); }

    await Promise.all([assetLoader(), textureLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }

    let material = new MeshBasicMaterial({ map: texture });

    asset.scene.traverse(node => {
      if (!(node instanceof Mesh)) { return; }

      node.material = material;
      node.material.side = DoubleSide; // We need to do this, otherwise the ears are transparent
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

export function PlantLoader(): AssetLoader {
  let asset: GLTF | null = null;
  let texture: Texture | null = null;

  async function downloader(context: AssetManagerContext): Promise<void> {
    const assetLoader = async () => { asset = await loadModel(context, '/assets/Plant.glb'); }
    const textureLoader = async () => { texture = await loadTexture(context, '/assets/Plant.jpg'); }

    await Promise.all([assetLoader(), textureLoader()]);
  }

  function builder(context: AssetManagerContext): OptionalUpdateAction {
    if (!asset) { return null; }

    let material = new MeshBasicMaterial({ map: texture });

    asset.scene.traverse(node => {
      if (!(node instanceof Mesh)) { return; }

      node.material = material;
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
