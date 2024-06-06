
import { SubViewParams } from "../AlgorithmVisualizerView";
import { SortView } from "./SortingView";
import { AlgorithmContainer } from "./AlgorithmContainer";

async function bubbleSort(view: SortView) {
  for (let i = 0; i < view.size() - 1; i++) {
    for (let j = 0; j < view.size() - 1; j++) {
      if (view.entry(j).value > view.entry(j + 1).value) {
        view.cleanColors();
        await view.swap(j, j + 1);
      }
    }
  }

  view.cleanColors();
}

export default function BubbleSort(params: SubViewParams) {
  return AlgorithmContainer(bubbleSort);
}
