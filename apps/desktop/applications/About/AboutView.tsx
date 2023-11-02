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
  return (<></>)
}

function AboutSubView(params: SubViewParams) {
  return <>About subview</>
}

function ExperienceSubView(params: SubViewParams) {
  return <>Experience subview</>
}

function ProjectsSubView(params: SubViewParams) {
  return <>Projects subview</>
}

function ContactSubView(params: SubViewParams) {
  return <>Contact subview</>
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