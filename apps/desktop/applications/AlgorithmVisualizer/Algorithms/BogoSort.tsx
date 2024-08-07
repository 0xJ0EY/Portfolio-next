
import { SubViewParams } from "../AlgorithmVisualizerView";
import { SortView, verifySort } from "./SortingView";
import { AlgorithmContainer } from "./AlgorithmContainer";

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
  return AlgorithmContainer({
    params,
    entrypoint: bogosort,
    title: 'Bogo sort',
    options: params.algorithmOptions!,
  });
}
