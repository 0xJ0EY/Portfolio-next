import { KeyboardEvent, KeyboardEventHandler, useState } from "react";
import { AlgorithmSubView, SubViewParams } from "../AlgorithmVisualizerView";

import styles from './Home.module.css';
import { AlgorithmOptions, DataGenerationStrategy } from "../Algorithms/AlgorithmContainer";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";


export function DataGenerationStrategyDropDown(value: DataGenerationStrategy, onChange: (strategy: DataGenerationStrategy) => void, t: TFunction) {
  type DataGenEntry = {
    title: string,
    strategy: DataGenerationStrategy
  }

  const entries: DataGenEntry[] = [
    {
      title: t('algorithms.data_generation_options.randomly_distributed'),
      strategy: 'randomly-distributed'
    },
    {
      title: t('algorithms.data_generation_options.sorted_left_to_right'),
      strategy: 'sorted-left-to-right'
    },
    {
      title: t('algorithms.data_generation_options.sorted_right_to_left'),
      strategy: 'sorted-right-to-left'
    }
  ];

  let options = entries.map(x => {
    return <option key={x.strategy} value={x.strategy}>{x.title}</option>
  })

  return (
    <>
      <select
        id="data-generation-strategy"
        name="data-generation-strategy"
        className="system-button"
        value={value}
        onChange={(e) => onChange(e.target.value as DataGenerationStrategy)}>
        {options}
      </select>
    </>
  );
}

export function DataGenerationEntriesInput(value: number | null, onChange: (entries: number | null) => void) {
  const MIN_VALUE = 1;
  const MAX_VALUE = 2048;

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

    // Clamp values
    updatedValue = Math.max(updatedValue, MIN_VALUE);
    updatedValue = Math.min(updatedValue, MAX_VALUE);

    onChange(updatedValue);
  }

  const safeValue = value ? value.toString() : "";

  return (
    <input
      id="generated-data-size"
      type="number"
      className="system-text-input"
      onKeyDown={(evt) => filterInput(evt)}
      value={safeValue}
      min={1}
      style={{ width: '80px' }}
      onChange={(evt) => onInputChange(evt.target.value)}
    />
  );
}

export default function HomeSubView(params: SubViewParams) {
    const [dataGenerationStrategy, setDataGenerationStrategy] = useState<DataGenerationStrategy>("randomly-distributed");
    const [dataGenerationEntries, setDataGenerationEntries] = useState<number | null>(50);

    const { t } = useTranslation('common');
  
    function NavigationButton(name: string, target: AlgorithmSubView) {
      const options: AlgorithmOptions = {
        dataGenerationStrategy,
        amountOfEntries: dataGenerationEntries ?? 50
      };

      return (<>
        <button className={`${styles['project-button']} xl-system-button`} onClick={() => params.changeParent(target, options) }>
          <span>{name}</span>
        </button>
      </>);
    }
  
    return (<>
      <div data-subpage className={`${styles['subpage']} ${styles['home-page']}`}>
        <div data-subpage-content>
          <h1>Sorting</h1>
          {NavigationButton('Bubble sort', 'bubble-sort')}
          {NavigationButton('Bogo sort', 'bogo-sort')}
          {NavigationButton('Merge sort', 'merge-sort')}
          {NavigationButton('Quick sort', 'quick-sort')}
          {NavigationButton('Heap sort', 'heap-sort')}
  
          <h3>{t('algorithms.sorting_options')}</h3>

          <table>
            <tbody>
              <tr>
                <td><label htmlFor="data-generation-strategy">{t('algorithms.data_generation_strategy')}</label></td>
                <td>{ DataGenerationStrategyDropDown(dataGenerationStrategy, setDataGenerationStrategy, t) }</td>
              </tr>

              <tr>
                <td><label htmlFor="generated-data-size">{t('algorithms.data_generation_points')}</label></td>
                <td>{ DataGenerationEntriesInput(dataGenerationEntries, setDataGenerationEntries) }</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>);
  }
  