import { LoadingManager, WebGLRenderer } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RendererScenes } from "../renderer/Renderer";
import { sleep } from "./util";

export type UpdateAction = ((deltaTime: number) => void);
export type OptionalUpdateAction = UpdateAction[] | null;

export type onProgress = (progress: number) => void;

export type AssetDownloader<T> = (context: AssetManagerContext) => Promise<T>;
export type AssetBuilder<T> = (context: AssetManagerContext, asset: T | null) => OptionalUpdateAction;

export type AssetLoader<T> = {
  downloader: AssetDownloader<T> | null,
  builder: AssetBuilder<T> | null,
  builderProcessTime: number
}

export type Loader = (context: AssetManagerContext, onProgress: onProgress) => Promise<OptionalUpdateAction>;

export type AssetManagerEntry = {
  key: string,
  loader: Loader,
  order: number,
  progress: number
}

export type AssetContext<T> = {
  name: string,
  assetLoader: AssetLoader<T>
  asset: T | null,
  inScene: boolean
  order: number,
  progress: number
}

export type LoadingProgressEntry = { name: string, progress: number }
export type TotalProgressPerEntry = { entry: LoadingProgressEntry, total: number }

type LoadingResult = Promise<{updateActions: UpdateAction[]}>;

export class AssetManagerContext {
  constructor(
    public debug: boolean,
    public renderer: WebGLRenderer,
    public gltfLoader: GLTFLoader,
    public scenes: RendererScenes,
  ) {}
}

export class LoadingProgress {
  constructor(private entries: LoadingProgressEntry[]) {}

  public progress(): { loaded: number, total: number } {
    return {
      loaded: this.listLoadedEntries().length,
      total: this.listAllEntries().length
    }
  }

  public listAllEntries(): LoadingProgressEntry[] {
    return this.entries;
  }

  public listLoadedEntries(): LoadingProgressEntry[] {
    return this.entries.filter(x => x.progress === 100);
  }

  public listTotalProgressPerLoadedEntry(limit?: number): TotalProgressPerEntry[] {
    const entries = this.listLoadedEntries();
    const progressPerEntry = 100 / this.entries.length;

    const result = entries.map((entry, index) => {
      return {
        entry,
        total: progressPerEntry * (index + 1)
      }
    });

    if (limit) {
      const start = result.length - limit;
      const end   = result.length;

      return result.slice(start, end);
    }

    return result;
  }

  public isDoneLoading(): boolean {
    return this.listLoadedEntries().length === this.listAllEntries().length;
  }
}

export class AssetManager {
  private context: AssetManagerContext | null = null;

  private index = 0;
  private assets: Record<string, AssetContext<GLTF>> = {}

  constructor(private rendererScenes: RendererScenes, private loadingManager?: LoadingManager) {}

  public init(debug: boolean): void {
    const gltfLoader = new GLTFLoader(this.loadingManager);
    const renderer = new WebGLRenderer();

    this.context = new AssetManagerContext(
      debug,
      renderer,
      gltfLoader,
      this.rendererScenes
    );
  }

  public setDebug(enabled: boolean): void {
    if (!this.context) { return; }

    this.context.debug = enabled;
  }

  public getRenderScenes(): RendererScenes | null {
    return this.context?.scenes ?? null;
  }

  public add(name: string, loader: AssetLoader<GLTF>): void {
    this.assets[name] = {
      name,
      assetLoader: loader,
      asset: null,
      inScene: false,
      order: this.index++,
      progress: 0
    }
  }

  public reset(): void {
    const scenes = this.rendererScenes;

    this.index = 0;
    this.assets = {};

    scenes.sourceScene.clear();
    scenes.cutoutScene.clear();
    scenes.cssScene.clear();
  }

  public loadingProgress(): LoadingProgress {
    const entries = Object.values(this.assets)
      .sort((a, b) => a.order - b.order)
      .map((entry) => { return { name: entry.name, progress: entry.progress }});

    return new LoadingProgress(entries);
  }

  public async load(signal?: AbortSignal, onUpdate?: () => void): LoadingResult {
    if (!this.context) { this.init(false); }

    function onProgress(asset: AssetContext<GLTF>, progress: number) {
      asset.progress = progress;

      if (onUpdate) { onUpdate(); }
    }

    const downloadActions = Object.values(this.assets).map(asset => {
      return (async () => {
        const downloader = asset.assetLoader.downloader;

        // No downloader, set the result to 50 no the less
        if (!downloader) { onProgress(asset, 50); return; }

        // Already downloaded, set progress to 75
        if (asset.asset) { onProgress(asset, 75); return; }

        asset.asset = await downloader(this.context!);

        onProgress(asset, 75);
      })();
    });

    await Promise.all(downloadActions);

    const actions = Object.values(this.assets).sort((a, b) => a.order - b.order);

    for (const asset of actions) {
      const builder = asset.assetLoader.builder;

      if (asset.inScene) { onProgress(asset, 100); continue; }
      if (!builder) { onProgress(asset, 100); continue; }

      if (asset.assetLoader.builderProcessTime) {
        await sleep(asset.assetLoader.builderProcessTime);
      }

      if (signal && signal.aborted) { return { updateActions: [] }};

      builder(this.context!, asset.asset);
      asset.inScene = true;

      onProgress(asset, 100);
    }

    return { updateActions: [] }
  }
}
