import { SubViewParams } from "../../AlgorithmVisualizerView"
import { SortView } from "./SortingView"
import { SortingDataGenerationStrategy } from "./SortingAlgorithmContainer"
import { PathFindingDataGenerationStrategy } from "./PathFindingAlgorithmContainer"
import { AreaView } from "./AreaView"

export type AlgorithmOptions = {
  sorting: {
    dataGenerationStrategy: SortingDataGenerationStrategy,
    amountOfEntries: number
  },
  pathFinding: {
    dataGenerationStrategy: PathFindingDataGenerationStrategy
    width: number,
    height: number
  }
}

export type SortingAlgorithmContainerProps = {
  params: SubViewParams,
  entrypoint: SortingAlgorithmEntrypoint,
  options: AlgorithmOptions,
  title: string,
}

export type PathFindingAlgorithmContainerProps = {
  params: SubViewParams,
  entrypoint: PathFindingAlgorithmEntrypoint,
  options: AlgorithmOptions,
  title: string,
}

export type SortingAlgorithmEntrypoint = (view: SortView, abortSignal: AbortSignal) => Promise<void>;
export type PathFindingAlgorithmEntrypoint = (view: AreaView, abortSignal: AbortSignal) => Promise<void>;
