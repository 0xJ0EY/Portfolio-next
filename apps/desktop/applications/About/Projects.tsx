import { SubViewNavigation, SubViewParams } from "./AboutView";
import styles from './AboutView.module.css';

export function ProjectPortfolio(params: SubViewParams) {

  function RenderEnglishContent() {
    return <></>
  }

  function RenderDutchContent() {
    return <></>
  }

  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1>Portfolio 2024</h1>
        { params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent() }
      </div>
    </div>
  </>);
}