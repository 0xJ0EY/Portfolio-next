import { KeyboardEvent, useState } from "react";
import { AlgorithmSubView, SubViewParams } from "../AlgorithmVisualizerView";

import styles from './Home.module.css';
import { SortingDataGenerationStrategy } from "../Algorithms/Containers/SortingAlgorithmContainer";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { AlgorithmOptions } from "../Algorithms/Containers/Containers";
import { PathFindingDataGenerationStrategy } from "../Algorithms/Containers/PathFindingAlgorithmContainer";

export function SortingGenerationStrategyDropdown(id: string, value: string, onChange: (strategy: SortingDataGenerationStrategy) => void, t: TFunction) {
  const entries: DataGenerationEntry<SortingDataGenerationStrategy>[] = [
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

  return DataGenerationStrategyDropDown(id, entries, value, onChange);
}

export function PathFindingGenerationStrategyDropdown(id: string, value: string, onChange: (strategy: PathFindingDataGenerationStrategy) => void, t: TFunction) {
  const entries: DataGenerationEntry<PathFindingDataGenerationStrategy>[] = [
    {
      title: t('algorithms.path_finding_generation_options.maze'),
      strategy: 'maze'
    },
    {
      title: t('algorithms.path_finding_generation_options.open_field'),
      strategy: 'open-field'
    },
    {
      title: t('algorithms.path_finding_generation_options.pipes'),
      strategy: 'pipes'
    }
  ];

  return DataGenerationStrategyDropDown(id, entries, value, onChange);
}

export type DataGenerationEntry<T> = {
  title: string,
  strategy: T
}

export function DataGenerationStrategyDropDown<T>(id: string, entries: DataGenerationEntry<T>[], value: string, onChange: (strategy: T) => void) {
  // There are some nasty cast in this piece of code, but we handle all the inputs / outputs ourself, the generic T is required to be castable to a string

  let options = entries.map(x => {
    return <option key={x.strategy as string} value={x.strategy as string}>{x.title}</option>
  })

  return (
    <>
      <select
        id={id}
        className="system-button"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}>
        {options}
      </select>
    </>
  );
}

export function DataGenerationEntriesInput(id: string, value: number | null, onChange: (entries: number | null) => void, min: number, max: number) {
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
    updatedValue = Math.max(updatedValue, min);
    updatedValue = Math.min(updatedValue, max);

    onChange(updatedValue);
  }

  const safeValue = value ? value.toString() : "";

  return (
    <input
      id={id}
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
    const [sortingGenerationStrategy, setSortingGenerationStrategy] = useState<SortingDataGenerationStrategy>("randomly-distributed");
    const [sortingGenerationEntries, setSortingGenerationEntries] = useState<number | null>(50);

    const [pathFindingGenerationStrategy, setPathFindingGenerationStrategy] = useState<PathFindingDataGenerationStrategy>("maze");
    const [pathFindingWidth, setPathFindingWidth] = useState<number | null>(40);
    const [pathFindingHeight, setPathFindingHeight] = useState<number | null>(20);

    const { t } = useTranslation('common');
  
    function NavigationButton(name: string, target: AlgorithmSubView) {
      const options: AlgorithmOptions = {
        sorting: {
          dataGenerationStrategy: sortingGenerationStrategy,
          amountOfEntries: sortingGenerationEntries ?? 50
        },
        pathFinding: {
          dataGenerationStrategy: pathFindingGenerationStrategy,
          width: pathFindingWidth ?? 40,
          height: pathFindingHeight ?? 20
        }
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
                <td>{ SortingGenerationStrategyDropdown("data-generation-strategy", sortingGenerationStrategy, setSortingGenerationStrategy, t) }</td>
              </tr>

              <tr>
                <td><label htmlFor="generated-data-size">{t('algorithms.data_generation_points')}</label></td>
                <td>{ DataGenerationEntriesInput("generated-data-size", sortingGenerationEntries, setSortingGenerationEntries, 1, 2048) }</td>
              </tr>
            </tbody>
          </table>

          <h1>Path finding</h1>
          {NavigationButton('Depth-first search', 'dfs')}
          {NavigationButton('Breadth-first search', 'bfs')}
          {NavigationButton('A* search', 'astar')}

          <table>
            <tbody>
              <tr>
                <td><label htmlFor="path-finding-data-gen-strategy">{t('algorithms.data_generation_strategy')}</label></td>
                <td>{ PathFindingGenerationStrategyDropdown("path-finding-data-gen-strategy", pathFindingGenerationStrategy, setPathFindingGenerationStrategy, t) }</td>
              </tr>

              <tr>
                <td><label htmlFor="path-finding-width">{t('algorithms.path_finding_width')}</label></td>
                <td>{ DataGenerationEntriesInput("path-finding-width", pathFindingWidth, setPathFindingWidth, 5, 100) }</td>
              </tr>

              <tr>
                <td><label htmlFor="path-finding-height">{t('algorithms.path_finding_height')}</label></td>
                <td>{ DataGenerationEntriesInput("path-finding-height", pathFindingHeight, setPathFindingHeight, 5, 100) }</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>);
  }
  