import { LoadingManager, WebGLRenderer } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RendererScenes } from "../renderer/Renderer";
import { createRenderScenes } from "./AssetLoaders";

export type UpdateAction = ((deltaTime: number) => void);
export type OptionalUpdateAction = UpdateAction[] | null;

export type onProgress = (progress: number) => void;
// export type AssetLoader = (context: AssetManagerContext) => Promise<GLTF>;
// export type AssetBuilder = (context: AssetManagerContext, asset?: GLTF) => OptionalUpdateAction;

export type AssetDownloader<T> = (context: AssetManagerContext) => Promise<T>;
export type AssetBuilder<T> = (context: AssetManagerContext, asset: T | null) => OptionalUpdateAction;

export type AssetLoader<T> = {
  downloader: AssetDownloader<T> | null,
  builder: AssetBuilder<T> | null
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
  order: number,
  progress: number
}

export type LoadingProgressEntry = { name: string, progress: number }
export type TotalProgressPerEntry = { entry: LoadingProgressEntry, total: number }

type LoadingResult = Promise<{rendererScenes: RendererScenes, updateActions: UpdateAction[]}>;

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
  private context: AssetManagerContext;

  private index = 0;
  private entries: Record<string, AssetManagerEntry> = {};
  private assets: Record<string, AssetContext<GLTF>> = {}

  constructor(debug: boolean, loadingManager?: LoadingManager) {
    const gltfLoader = new GLTFLoader(loadingManager);
    const rendererScenes = createRenderScenes();
    const renderer = new WebGLRenderer();

    this.context = new AssetManagerContext(
      debug,
      renderer,
      gltfLoader,
      rendererScenes
    );
  }

  // public loadAsset(name: string, assetLoader?: AssetLoader, builder?: AssetBuilder) {
  //   this.assets[name] = {
  //     assetLoader,
  //     builder,
  //     order: this.index,
  //     progress: 0
  //   }
  // }

  public add(name: string, loader: AssetLoader<GLTF>): void {
    this.assets[name] = {
      name,
      assetLoader: loader,
      asset: null,
      order: this.index++,
      progress: 0
    }
  }

  // public add(name: string, loader: Loader): void {
  //   this.entries[name] = { key: name, loader, order: this.index++, progress: 0 };
  // }

  public loadingProgress(): LoadingProgress {
    const entries = Object.values(this.entries)
      .sort((a, b) => a.order - b.order)
      .map((entry) => { return { name: entry.key, progress: entry.progress }});

    return new LoadingProgress(entries);
  }

  public async load(onUpdate?: () => void): LoadingResult {

    function onProgress(asset: AssetContext<GLTF>, progress: number) {
      asset.progress = progress;

      if (onUpdate) { onUpdate(); }
    }

    const downloadActions = Object.values(this.assets).map(asset => {
      return (async () => {
        const downloader = asset.assetLoader.downloader;

        if (!downloader) { onProgress(asset, 50); return; }

        asset.asset = await downloader(this.context);

        onProgress(asset, 75);
      })();
    });

    await Promise.all(downloadActions);

    Object.values(this.assets)
      .sort((a, b) => a.order - b.order)
      .map(asset => {
        const builder = asset.assetLoader.builder;

        if (!builder) { onProgress(asset, 100); return; }

        console.log(asset);

        // setTimeout()

        const action = builder(this.context, asset.asset);

        onProgress(asset, 100);

        return action;
    });

    console.log(this.context.scenes);
    // const actions = Object.values(this.entries).map(entry => {
    //   const onProgress = (progress: number) => {
    //     entry.progress = progress;
    //     if (onUpdate) { onUpdate(); }
    //   }

    //   const handle = async (): Promise<OptionalUpdateAction> => {
    //     const actions = await entry.loader(this.context, onProgress);

    //     // Always set progress to 100, even if it is not handled within the function
    //     onProgress(100);

    //     return actions;
    //   }

    //   return handle();
    // })

    // const results: OptionalUpdateAction[] = await Promise.all(actions);

    return { rendererScenes: this.context.scenes, updateActions: [] }
  }
}
