
import { SubViewParams } from "../../AlgorithmVisualizerView";
import { SortView } from "../Containers/SortingView";
import { SortingAlgorithmContainer } from "../Containers/SortingAlgorithmContainer";

async function heapSort(view: SortView, abortSignal: AbortSignal) {

  const indexLeftChild = (i: number) => 2 * i + 1;
  const indexParent = (i: number) => Math.floor((i - 1) / 2);

  async function siftDown(view: SortView, root: number, end: number) {
    view.cleanColors();

    while (indexLeftChild(root) < end) {
      if (abortSignal.aborted) { return; }

      let child = indexLeftChild(root);

      if (child + 1 < end && view.entryValue(child) < view.entryValue(child + 1)) {
        child++;
      }

      if (view.entryValue(root) < view.entryValue(child)) {
        await view.swap(root, child)

        root = child;
      } else {
        return;
      }
    }
  }

  async function heapify(view: SortView, count: number) {
    let start = indexParent(count - 1) + 1;

    while (start-- > 0) {
      if (abortSignal.aborted) { return; }

      view.cleanColors();
      await siftDown(view, start, count);
    }
  }

  async function sort(view: SortView) {
    await heapify(view, view.size());

    let end = view.size();

    while (end-- > 1) {
      if (abortSignal.aborted) { return; }

      await view.swap(end, 0);
      await siftDown(view, 0, end);
    }
  }

  await sort(view);

  view.cleanColors();
}

export default function HeapSort(params: SubViewParams) {
  return SortingAlgorithmContainer({
    params,
    entrypoint: heapSort,
    title: 'Heap sort',
    options: params.algorithmOptions!,
  });
}
