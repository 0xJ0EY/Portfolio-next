import { SubViewNavigation, SubViewParams } from "./AboutView";
import styles from './AboutView.module.css';

function ProjectPage(props: { title: string, params: SubViewParams, content: JSX.Element }) {
  const params = props.params;

  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1>{props.title}</h1>
        { props.content }
      </div>
    </div>
  </>);
}

export function ProjectPortfolio2024(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2024', content, params});
}

export function ProjectJScript(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'J-Script', content, params});
}

export function ProjectAdventOfCode(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Advent of Code', content, params});
}

export function ProjectPortfolio2021(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2021', content, params});
}

export function ProjectTBot(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'T-Bot', content, params});
}

export function ProjectYoui(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Youi', content, params});
}

export function ProjectPCParts(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'PCParts', content, params});
}

export function ProjectAlbert(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Albert', content, params});
}

export function ProjectPaintboy(params: SubViewParams) {
  function RenderEnglishContent() {
    return <>English content</>
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Paintboy', content, params});
}
