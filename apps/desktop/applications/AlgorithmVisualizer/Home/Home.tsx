import { KeyboardEvent, KeyboardEventHandler, useState } from "react";
import { AlgorithmSubView, SubViewParams } from "../AlgorithmVisualizerView";
import styles from './../AlgorithmVisualizerView.module.css';
import { AlgorithmOptions, DataGenerationStrategy } from "../Algorithms/AlgorithmContainer";

export function DataGenerationStrategyDropDown(value: DataGenerationStrategy, onChange: (strategy: DataGenerationStrategy) => void) {
  type DataGenEntry = {
    title: string,
    strategy: DataGenerationStrategy
  }

  const entries: DataGenEntry[] = [
    {
      title: 'Randomly distributed',
      strategy: 'randomly-distributed'
    },
    {
      title: 'Sorted left to right',
      strategy: 'sorted-left-to-right'
    },
    {
      title: 'Sorted right to left',
      strategy: 'sorted-right-to-left'
    }
  ];

  let options = entries.map(x => {
    return <option key={x.strategy} value={x.strategy}>{x.title}</option>
  })

  return (
    <>
      <select value={value} onChange={(e) => onChange(e.target.value as DataGenerationStrategy)}>
        {options}
      </select>
    </>
  );
}

export function DataGenerationEntriesInput(value: number | null, onChange: (entries: number | null) => void) {
  function filterInput(evt: KeyboardEvent<HTMLInputElement>) {
    const isAlphanumericKey = evt.key.length === 1;
    const isNumber = parseInt(evt.key, 10);

    if (isAlphanumericKey && !Number.isInteger(isNumber)) {
      evt.preventDefault();
    }
  }

  function onInputChange(value: string) {
    if (value.length === 0) {
      onChange(null);
      return;
    }

    let updatedValue = parseInt(value, 10);
    updatedValue = Math.max(updatedValue, 1);

    onChange(updatedValue);
  }

  const safeValue = value ? value.toString() : "";

  return (
    <input
      type="number"
      onKeyDown={(evt) => filterInput(evt)}
      value={safeValue}
      min={1}
      onChange={(evt) => onInputChange(evt.target.value)}
    />
  );
}

export default function HomeSubView(params: SubViewParams) {
    const [dataGenerationStrategy, setDataGenerationStrategy] = useState<DataGenerationStrategy>("randomly-distributed");
    const [dataGenerationEntries, setDataGenerationEntries] = useState<number | null>(50);
  
    function NavigationButton(name: string, target: AlgorithmSubView) {
      const options: AlgorithmOptions = {
        dataGenerationStrategy,
        amountOfEntries: dataGenerationEntries ?? 50
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
          { DataGenerationEntriesInput(dataGenerationEntries, setDataGenerationEntries) }
        </div>
      </div>
    </>);
  }
  