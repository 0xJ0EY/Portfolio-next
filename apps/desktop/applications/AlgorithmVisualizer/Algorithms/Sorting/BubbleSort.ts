
import { SubViewParams } from "../../AlgorithmVisualizerView";
import { SortView } from "../Containers/SortingView";
import { SortingAlgorithmContainer } from "../Containers/SortingAlgorithmContainer";

async function bubbleSort(view: SortView, abortSignal: AbortSignal) {
  for (let i = 0; i < view.size() - 1; i++) {
    for (let j = 0; j < view.size() - 1; j++) {
      if (abortSignal.aborted) { return; }

      if (view.entry(j).value > view.entry(j + 1).value) {
        view.cleanColors();
        await view.swap(j, j + 1);
      }
    }
  }

  view.cleanColors();
}

export default function BubbleSort(params: SubViewParams) {
  return SortingAlgorithmContainer({
    params,
    entrypoint: bubbleSort,
    title: 'Bubble sort',
    options: params.algorithmOptions!
  });
}
