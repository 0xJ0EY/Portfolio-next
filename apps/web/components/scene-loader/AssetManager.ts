import { LoadingManager, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RendererScenes } from "../renderer/Renderer";
import { createRenderScenes } from "./AssetLoaders";

export type UpdateAction = ((deltaTime: number) => void);
export type OptionalUpdateAction = UpdateAction[] | null;

export type onProgress = (progress: number) => void;
export type Loader = (context: AssetManagerContext, onProgress: onProgress) => Promise<OptionalUpdateAction>;

export type AssetManagerEntry = { key: string, loader: Loader, order: number, progress: number }
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

  public add(name: string, loader: Loader): void {
    this.entries[name] = { key: name, loader, order: this.index++, progress: 0 };
  }

  public loadingProgress(): LoadingProgress {
    const entries = Object.values(this.entries)
      .sort((a, b) => a.order - b.order)
      .map((entry) => { return { name: entry.key, progress: entry.progress }});

    return new LoadingProgress(entries);
  }

  public async load(onUpdate?: () => void): LoadingResult {
    const actions = Object.values(this.entries).map(entry => {
      const onProgress = (progress: number) => {
        entry.progress = progress;
        if (onUpdate) { onUpdate(); }
      }

      const handle = async (): Promise<OptionalUpdateAction> => {
        const actions = await entry.loader(this.context, onProgress);

        // Always set progress to 100, even if it is not handled within the function
        onProgress(100);

        return actions;
      }

      return handle();
    })

    const results: OptionalUpdateAction[] = await Promise.all(actions);

    return { rendererScenes: this.context.scenes, updateActions: [] }
  }
}
