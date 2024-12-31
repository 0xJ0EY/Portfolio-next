import { SubViewParams } from "../../AlgorithmVisualizerView";
import { SortingAlgorithmContainer } from "../Containers/SortingAlgorithmContainer";
import { SortView, verifySort } from "../Containers/SortingView";

async function bogosort(view: SortView, abortSignal: AbortSignal) {
  while (!await verifySort(view, abortSignal)) {
    view.cleanColors();

    for (let i = view.size() - 1; i > 0; i--) {
      if (abortSignal.aborted) { return; }

      // Fisher–Yates shuffle
      const j = Math.floor(Math.random() * i);
      await view.swap(i, j);
    }
  }

  view.cleanColors();
}

export default function BogoSort(params: SubViewParams) {
  return SortingAlgorithmContainer({
    params,
    entrypoint: bogosort,
    title: 'Bogo sort',
    options: params.algorithmOptions!,
  });
}
