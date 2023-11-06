import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useState, useRef, RefObject } from 'react';

type SubView = 'home' | 'about' | 'experience' | 'projects' | 'contact';

type SubViewParams = {
  changeParent: (view: SubView) => void
}

function HomeSubView(params: SubViewParams) {
  return (<>
    <h1>Joey de Ruiter</h1>
    <h3>Software engineer</h3>

    <div>
      <a href="#" onPointerUp={() => params.changeParent('about')}>About</a>
      <a href="#" onPointerUp={() => params.changeParent('experience')}>Experience</a>
      <a href="#" onPointerUp={() => params.changeParent('projects')}>Projects</a>
      <a href="#" onPointerUp={() => params.changeParent('contact')}>Contact</a>
    </div>
  </>)
}

function SubViewNavigation(params: SubViewParams) {
  return (<>
    <div className='w-32'>
      <div>
        <span className='block'>Joey</span>
        <span className='block'>de Ruiter</span>
      </div>

      <div className='flex flex-col m-2'>
        <a href="#" onPointerUp={() => params.changeParent('home')}>Home</a>
        <a href="#" onPointerUp={() => params.changeParent('about')}>About</a>
        <a href="#" onPointerUp={() => params.changeParent('experience')}>Experience</a>
        <a href="#" onPointerUp={() => params.changeParent('projects')}>Projects</a>
        <a href="#" onPointerUp={() => params.changeParent('contact')}>Contact</a>
      </div>
    </div>
  </>)
}

function AboutSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto'>
        <h1>About</h1>
      </div>
    </div>
  </>);
}

function ExperienceSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto'>
        <h1>Experience</h1>
      </div>
    </div>
  </>);
}

function ProjectsSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto'>
        <h1>Project</h1>
      </div>
    </div>
  </>);
}

function ContactSubView(params: SubViewParams) {
  return (<>
    <div className='flex h-full'>
      { SubViewNavigation(params) }
      <div className='flex flex-auto'>
        <h1>Contact</h1>
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

  const [subView, setSubView] = useState<SubView>('about');

  return (
    <div className="contentOuter">
      <div className="content">
        { RenderSubView(subView, { changeParent: setSubView }) }
      </div>
    </div>
  )
}