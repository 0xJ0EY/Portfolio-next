import { SubViewParams } from "../../AlgorithmVisualizerView";
import { SortingAlgorithmContainer } from "../Containers/SortingAlgorithmContainer";
import { SortView } from "../Containers/SortingView";

async function quickSort(view: SortView, abortSignal: AbortSignal) {
  async function partition(view: SortView, low: number, high: number): Promise<number | null> {
    // we use the middle element as pivot
    const pivot = view.entry(Math.floor((low + high) / 2));

    let i = low;
    let j = high;

    while (true) {
      view.cleanColors();

      if (abortSignal.aborted) { return null; }

      while (view.entry(i).value < pivot.value) { i++; }
      while (view.entry(j).value > pivot.value) { j--; }

      if (i >= j) { return j; }

      await view.swap(i, j);
    }
  }

  async function sort(view: SortView, low: number, high: number) {
    if (abortSignal.aborted) { return; }

    if (low >= 0 && high >= 0 && low < high) {
      const pivot = await partition(view, low, high);

      if (pivot === null) { return; }

      await sort(view, low, pivot);
      await sort(view, pivot + 1, high);
    }
  }

  await sort(view, 0, view.size() - 1);

  view.cleanColors();
}

export default function QuickSort(params: SubViewParams) {
  return SortingAlgorithmContainer({
    params,
    entrypoint: quickSort,
    title: 'Quick Sort',
    options: params.algorithmOptions!
  });
}
