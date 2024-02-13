import { LoadingManager, WebGLRenderer } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RendererScenes } from "../renderer/Renderer";
import { sleep } from "./util";

export type UpdateAction = ((deltaTime: number) => void);
export type OptionalUpdateAction = UpdateAction[] | null;

export type AssetDownloader<T> = (context: AssetManagerContext) => Promise<T>;
export type AssetBuilder<T> = (context: AssetManagerContext, asset: T | null) => OptionalUpdateAction;

export type AssetLoader<T> = {
  downloader: AssetDownloader<T> | null,
  builder: AssetBuilder<T> | null,
  builderProcessTime: number
}

export type AssetContext<T> = {
  name: string,
  assetLoader: AssetLoader<T>
  asset: T | null,
  inScene: boolean

  order: number,

  downloaded: boolean,
  processed: boolean,
}

export type LoadingProgressEntry = { name: string, downloaded: boolean, processed: boolean }
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
    return this.entries.filter(x => x.downloaded && x.processed);
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
    const noDownloadNeeded = loader.downloader === null;
    const noProcessNeeded = loader.builder === null;

    this.assets[name] = {
      name,
      assetLoader: loader,
      asset: null,
      inScene: false,
      order: this.index++,
      downloaded: noDownloadNeeded,
      processed: noProcessNeeded,
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
    const entries: LoadingProgressEntry[] = Object.values(this.assets)
      .sort((a, b) => a.order - b.order)
      .map((entry) => { return {
        name: entry.name,
        downloaded: entry.downloaded,
        processed: entry.processed
      }
    });

    return new LoadingProgress(entries);
  }

  public async load(signal?: AbortSignal, onUpdate?: () => void): LoadingResult {
    if (!this.context) { this.init(false); }


    function update() {
      if (onUpdate) { onUpdate(); }
    }

    const downloadActions = Object.values(this.assets).map(asset => {
      return (async () => {
        const downloader = asset.assetLoader.downloader;

        if (!downloader) { return; }
        if (asset.asset) { return; }

        asset.asset = await downloader(this.context!);
        asset.downloaded = true;

        update();
      })();
    });

    await Promise.all(downloadActions);

    const actions = Object.values(this.assets).sort((a, b) => a.order - b.order);

    for (const asset of actions) {
      const builder = asset.assetLoader.builder;

      if (asset.inScene) { continue; }
      if (!builder) { continue; }

      if (asset.assetLoader.builderProcessTime) {
        await sleep(asset.assetLoader.builderProcessTime);
      }

      if (signal && signal.aborted) { return { updateActions: [] }};

      builder(this.context!, asset.asset);
      asset.processed = true;

      update();
    }

    return { updateActions: [] }
  }
}
