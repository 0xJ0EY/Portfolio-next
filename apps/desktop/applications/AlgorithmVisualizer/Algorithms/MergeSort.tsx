
import { SubViewParams } from "../AlgorithmVisualizerView";
import { SortView, SortViewEntry, SortViewEntryColor } from "./SortingView";
import { AlgorithmContainer } from "./AlgorithmContainer";

async function mergeSort(view: SortView, abortSignal: AbortSignal) {
  async function merge(view: SortView, low: number, pivot: number, high: number) {
    function color(index: number): SortViewEntryColor {
      if (index === low) { return 'green' }
      if (index === high - 1) { return 'green' }

      return 'red';
    }
    
    let data: SortViewEntry[] = [];

    let i = low, j = pivot, o = 0;

    while (i < pivot && j < high) {
      const entryI = view.entry(i);
      const entryJ = view.entry(j);

      if (entryI.value < entryJ.value) {
        i += 1;
        data[o++] = entryI;
      } else {
        j += 1;
        data[o++] = entryJ;
      }
    }

    // copy rest
    while (i < pivot) { data[o++] = view.entry(i++); }
    while (j < high) { data[o++] = view.entry(j++); }

    view.cleanColors();

    view.mark(low, 'green');
    view.mark(high - 1, 'green');

    if (abortSignal.aborted) { return; }

    for (let i = 0; i < data.length; i++) {
      await view.set(low + i, data[i], color(low + i));
    }
  }


  async function sort(view: SortView, low: number, high: number) {
    if (low + 1 < high) {
      let pivot = Math.floor((low + high) / 2);

      await sort(view, low, pivot);
      await sort(view, pivot, high);

      await merge(view, low, pivot, high);
    }
  }

  await sort(view, 0, view.size());
  
  view.cleanColors();
}

export default function MergeSort(params: SubViewParams) {
  return AlgorithmContainer({
    entrypoint: mergeSort,
    title: 'Merge sort'
  });
}
