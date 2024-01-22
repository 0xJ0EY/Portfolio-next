import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';
import styles from './AboutView.module.css';

type SubView = 'home' | 'about' | 'experience' | 'projects' | 'contact';

type SubViewParams = {
  changeParent: (view: SubView) => void
}

function HomeSubView(params: SubViewParams) {
  return (<>
    <div className={styles['subpage-home']}>
      <h1 className={styles['home-title']}>Joey de Ruiter</h1>
      <h3 className={styles['home-subtitle']}>Software engineer</h3>

      <div className={styles['home-button-container']}>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('about')}>About</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('experience')}>Experience</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('projects')}>Projects</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('contact')}>Contact</button>
      </div>
    </div>
  </>)
}

function SubViewNavigation(params: SubViewParams) {
  return (<>
    <div className={styles['navigation']}>
      <div>
        <span className={styles['logo-part']}>Joey</span>
        <span className={styles['logo-part']}>de Ruiter</span>
      </div>

      <div className={styles['navigation-button-container']}>
        <button className='system-button' onClick={() => params.changeParent('home')}>Home</button>
        <button className='system-button' onClick={() => params.changeParent('about')}>About</button>
        <button className='system-button' onClick={() => params.changeParent('experience')}>Experience</button>
        <button className='system-button' onClick={() => params.changeParent('projects')}>Projects</button>
        <button className='system-button' onClick={() => params.changeParent('contact')}>Contact</button>
      </div>
    </div>
  </>)
}

function AboutSubView(params: SubViewParams) {
  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1 className={styles['page-h1']}>About</h1>
      </div>
    </div>
  </>);
}

function ExperienceSubView(params: SubViewParams) {
  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1 className={styles['page-h1']}>Experience</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis voluptate deleniti nemo nam eum sunt repellat? Dolorum nemo qui sit eveniet officia voluptatem similique consequuntur deserunt, sint quis maxime. Doloribus?</p>
      </div>
    </div>
  </>);
}

function ProjectsSubView(params: SubViewParams) {
  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1 className={styles['page-h1']}>Projects</h1>
      </div>
    </div>
  </>);
}

function RenderSubView(view: SubView, params: SubViewParams): JSX.Element {
  switch (view) {
    case 'home': return HomeSubView(params);
    case 'about': return AboutSubView(params);
    case 'experience': return ExperienceSubView(params);
    case 'projects': return ProjectsSubView(params);
  }
  
  return <></>;
}

export default function AboutApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const [subView, setSubView] = useState<SubView>('home');

  function changeParent(view: SubView) {
    if (view === 'contact') {
      application.on({ kind: 'about-open-contact-event' }, windowContext);
      return;
    }

    setSubView(view);
  }

  return (
    <div className="content-outer">
      <div className="content">
        { RenderSubView(subView, { changeParent }) }
      </div>
    </div>
  )
}