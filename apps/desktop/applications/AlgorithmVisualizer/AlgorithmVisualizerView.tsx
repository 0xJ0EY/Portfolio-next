import { ScreenResolution } from '@/apis/Screen/ScreenService';
import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AlgorithmVisualizerView.module.css';
import dynamic from 'next/dynamic';

type SubView = (
  'home' |
  'bubble-sort'
);

export type SubViewParams = {
  windowProps: WindowProps,
  changeParent: (view: SubView) => void,
}

const BubbleSortLoader = dynamic(() => import('./BubbleSort/BubbleSort'), { loading: () => <>loading</>});

function HomeSubView(params: SubViewParams) {
  function NavigationButton(name: string, target: SubView) {
    return (<>
      <button className={styles['project-button']} onClick={() => params.changeParent(target) }>
        <span>{name}</span>
      </button>
    </>);
  }

  return (<>
    <div data-subpage className={styles['subpage']}>
      <div data-subpage-content>
        <h1>Sorting</h1>
        {NavigationButton('Bubble sort', 'bubble-sort')}
      </div>
    </div>
  </>);
}

function RenderSubView(view: SubView, params: SubViewParams): JSX.Element {
  switch (view) {
    case 'home': return HomeSubView(params);
    case 'bubble-sort': return <BubbleSortLoader {...params} />;
  }

  return <>No subview found</>;
}

export default function DebugApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const [subView, setSubView] = useState<SubView>('home');
  const [needsMobileView, setNeedsMobileView] = useState<boolean>(false);
  const { t, i18n } = useTranslation("common");

  const apis = application.apis;

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

  function onScreenChangeListener(resolution: ScreenResolution): void {
    setNeedsMobileView(resolution.isMobileDevice());
  }

  useEffect(() => {
    const unsubscribe = apis.screen.subscribe(onScreenChangeListener);

    const resolution = apis.screen.getResolution();
    if (resolution) { onScreenChangeListener(resolution); }

    return () => {
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    resetSubPageScroll();
  }, [subView]);

  function changeParent(view: SubView) {
    setSubView(view);
  }

  return (
    <div className="content-outer">
      <div className="content">
        <div className='content-inner' ref={contentParent}>
          { RenderSubView(subView,
            {
              windowProps: props,
              changeParent
            }
          ) }
        </div>
      </div>
    </div>
  )
} 