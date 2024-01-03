import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState } from 'react';
import styles from './AboutView.module.css';

type SubView = 'home' | 'about' | 'experience' | 'projects' | 'contact';

type SubViewParams = {
  changeParent: (view: SubView) => void
}

function HomeSubView(params: SubViewParams) {
  return (<>
    <div className="flex flex-col h-full justify-center">
      <h1 className={styles['home-title']}>Joey de Ruiter</h1>
      <h3 className={styles['home-subtitle']}>Software engineer</h3>

      <div className='flex justify-center mt-3'>
        <button className='mx-1 system-button' onClick={() => params.changeParent('about')}>About</button>
        <button className='mx-1 system-button' onClick={() => params.changeParent('experience')}>Experience</button>
        <button className='mx-1 system-button' onClick={() => params.changeParent('projects')}>Projects</button>
        <button className='mx-1 system-button' onClick={() => params.changeParent('contact')}>Contact</button>
      </div>
    </div>
  </>)
}

function SubViewNavigation(params: SubViewParams) {
  return (<>
    <div className={`w-48 p-6 ${styles['navigation']}`}>
      <div>
        <span className={styles['logo-part']}>Joey</span>
        <span className={styles['logo-part']}>de Ruiter</span>
      </div>

      <div className='flex flex-col mt-4'>
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
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto p-6 flex-col'>
        <h1 className={styles['page-h1']}>About</h1>
      </div>
    </div>
  </>);
}

function ExperienceSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto p-6 flex-col'>
        <h1 className={styles['page-h1']}>Experience</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis voluptate deleniti nemo nam eum sunt repellat? Dolorum nemo qui sit eveniet officia voluptatem similique consequuntur deserunt, sint quis maxime. Doloribus?</p>
      </div>
    </div>
  </>);
}

function ProjectsSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto p-6 flex-col'>
        <h1 className={styles['page-h1']}>Projects</h1>
      </div>
    </div>
  </>);
}

function ContactSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto p-6 flex-col'>
        <h1 className={styles['page-h1']}>Contact</h1>
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
    case 'contact': return ContactSubView(params);
  }
}

export default function AboutApplicationView(props: WindowProps) {
  useEffect(() => { }, []);

  const [subView, setSubView] = useState<SubView>('home');

  return (
    <div className="contentOuter">
      <div className="content">
        { RenderSubView(subView, { changeParent: setSubView }) }
      </div>
    </div>
  )
}