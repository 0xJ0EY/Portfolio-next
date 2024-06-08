
import { SubViewParams } from "../AlgorithmVisualizerView";
import { SortView } from "./SortingView";
import { AlgorithmContainer } from "./AlgorithmContainer";

async function quickSort(view: SortView, abortSignal: AbortSignal) {
  async function partition(view: SortView, low: number, high: number): Promise<number | null> {
    // we use the middle element as pivot
    const pivot = view.entry(Math.floor((low + high) / 2));

    let i = low;
    let j = high;

    while (i <= j) {
      view.cleanColors();

      if (abortSignal.aborted) { return null; }

      while (view.entry(i).value < pivot.value) {
        i++;
      }

      while (view.entry(j).value > pivot.value) {
        j--;
      }

      if (i <= j) {
        await view.swap(i, j);
        i++;
        j--;
      }
    }

    return i;
  }

  async function sort(view: SortView, low: number, high: number) {
    if (abortSignal.aborted) { return; }

    const index = await partition(view, low, high);

    if (index === null) { return; }

    if (low < index - 1) {
      await sort(view, low, index - 1);
    }

    if (index < high) {
      await sort(view, index, high);
    }
  }

  await sort(view, 0, view.size() - 1);

  view.cleanColors();
}

export default function QuickSort(params: SubViewParams) {
  return AlgorithmContainer({
    params,
    entrypoint: quickSort,
    title: 'Quick Sort',
    options: params.algorithmOptions!
  });
}
