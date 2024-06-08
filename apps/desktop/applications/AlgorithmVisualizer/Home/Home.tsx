import { useState } from "react";
import { AlgorithmSubView, SubViewParams } from "../AlgorithmVisualizerView";
import styles from './../AlgorithmVisualizerView.module.css';
import { AlgorithmOptions, DataGenerationStrategy, DataGenerationStrategyDropDown } from "../Algorithms/AlgorithmContainer";

export default function HomeSubView(params: SubViewParams) {
    const [dataGenerationStrategy, setDataGenerationStrategy] = useState<DataGenerationStrategy>("randomly-distributed");
  
    function NavigationButton(name: string, target: AlgorithmSubView) {
      const options: AlgorithmOptions = {
        dataGenerationStrategy,
        amountOfEntries: 50
      };

      return (<>
        <button className={styles['project-button']} onClick={() => params.changeParent(target, options) }>
          <span>{name}</span>
        </button>
      </>);
    }
  
    return (<>
      <div data-subpage className={styles['subpage']}>
        <div data-subpage-content>
          <h1>Sorting</h1>
          {NavigationButton('Bubble sort', 'bubble-sort')}
          {NavigationButton('Bogo sort', 'bogo-sort')}
          {NavigationButton('Merge sort', 'merge-sort')}
  
          <h3>Options</h3>
  
          { DataGenerationStrategyDropDown(dataGenerationStrategy, setDataGenerationStrategy) }
        </div>
      </div>
    </>);
  }
  