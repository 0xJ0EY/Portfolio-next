import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlgorithmOptions } from './Algorithms/AlgorithmContainer';

export type AlgorithmSubView = (
  'home' |
  'bubble-sort' |
  'merge-sort' |
  'bogo-sort' |
  'heap-sort' |
  'quick-sort' 
);

export type SubViewParams = {
  windowProps: WindowProps,
  changeParent: (view: AlgorithmSubView, options?: AlgorithmOptions) => void,
  algorithmOptions: AlgorithmOptions | null;
}

function Loader() { return <></> }

const HomeLoader = dynamic(() => import('./Home/Home'), { loading: Loader });
const BubbleSortLoader = dynamic(() => import('./Algorithms/BubbleSort'), { loading: Loader });
const BogoSortLoader = dynamic(() => import('./Algorithms/BogoSort'), { loading: Loader });
const MergeSortLoader = dynamic(() => import('./Algorithms/MergeSort'), { loading: Loader });
const QuickSortLoader = dynamic(() => import('./Algorithms/QuickSort'), { loading: Loader });
const HeapSortLoader = dynamic(() => import('./Algorithms/HeapSort'), { loading: Loader });

function RenderSubView(view: AlgorithmSubView, params: SubViewParams): JSX.Element {
  switch (view) {
    case 'home': return <HomeLoader {...params} />;
    case 'bubble-sort': return <BubbleSortLoader {...params} />;
    case 'bogo-sort': return <BogoSortLoader {...params} />;
    case 'merge-sort': return <MergeSortLoader {...params} />;
    case 'quick-sort': return <QuickSortLoader {...params} />;
    case 'heap-sort': return <HeapSortLoader {...params} />;
  }

  return <>No subview found</>;
}

export default function AlgorithmVisualizerView(props: WindowProps) {
  const { application, windowContext } = props;

  const [subView, setSubView] = useState<AlgorithmSubView>('home');
  const [algorithmOptions, setAlgorithmOptions] = useState<AlgorithmOptions | null>(null);

  const contentParent = useRef<HTMLDivElement>(null);

  function resetSubPageScroll() {
    if (!contentParent.current) { return; }

    const subViewParent = contentParent.current;
    const subViewParentChildren = Array.from(subViewParent.children);

    const subView = subViewParentChildren.find(x => x.hasAttribute('data-subpage'));
    if (!subView) { return; }

    const subViewChildren = Array.from(subView.children);

    const contentView = subViewChildren.find(x => x.hasAttribute('data-subpage-content'));

    if (!contentView) { return; }
    contentView.scrollTop = 0;
  }

  useEffect(() => {
    resetSubPageScroll();
  }, [subView]);

  function changeParent(view: AlgorithmSubView, options?: AlgorithmOptions) {
    setAlgorithmOptions(options ?? null);
    setSubView(view);
  }

  return (
    <div className="content-outer">
      <div className="content">
        <div className='content-inner' ref={contentParent}>
          { RenderSubView(subView,
            {
              windowProps: props,
              changeParent,
              algorithmOptions
            }
          ) }
        </div>
      </div>
    </div>
  )
} 