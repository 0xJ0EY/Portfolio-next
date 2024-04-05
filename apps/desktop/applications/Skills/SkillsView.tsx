import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import Image from 'next/image';
import styles from './SkillsView.module.css';
import { useTranslation } from "react-i18next";

function SkillEntry(props: { language: string, icon: { src: string, alt: string }}) {
  const { language, icon } = props;
  
  return (<>
    <div className={styles['language-entry']}>
      <Image
        quality={100}
        draggable={false}
        width={40}
        height={40}
        src={icon.src}
        alt={icon.alt}
      />
      <span>{language}</span>
    </div>
  </>);
}

export default function SkillsView(props: WindowProps) {
  const { t } = useTranslation('common');
  
  return (
    <div className="content-outer">
      <div className="content">
        <div className={styles['skills-content']}>
          <h1>{ t("skills.programming_languages") }</h1>

          <ul>
            <li><SkillEntry language="TypeScript / JavaScript" icon={{src: '/icons/skills/typescript.svg', alt: 'TypeScript' }} /></li>
            <li><SkillEntry language="Swift" icon={{src: '/icons/skills/swift.svg', alt: 'Swift' }} /></li>
            <li><SkillEntry language="Rust" icon={{src: '/icons/skills/rust.svg', alt: 'Rust' }} /></li>
            <li><SkillEntry language="C / C++" icon={{src: '/icons/skills/c.svg', alt: 'C' }} /></li>
            <li><SkillEntry language="Java" icon={{src: '/icons/skills/java.svg', alt: 'Java' }} /></li>
            <li><SkillEntry language="Python" icon={{src: '/icons/skills/python.svg', alt: 'Python' }} /></li>
            <li><SkillEntry language="HTML/CSS" icon={{src: '/icons/skills/html.svg', alt: 'HTML5' }} /></li>
          </ul>

          <h1>{ t("skills.frameworks") }</h1>
          <ul>
            <li><SkillEntry language="React / NextJS" icon={{src: '/icons/skills/react.svg', alt: 'React' }} /></li>
            <li><SkillEntry language="Angular" icon={{src: '/icons/skills/angular.svg', alt: 'Angular' }} /></li>
            <li><SkillEntry language="Svelte" icon={{src: '/icons/skills/svelte.svg', alt: 'Svelte' }} /></li>
            <li><SkillEntry language="SwiftUI" icon={{src: '/icons/skills/swiftui.png', alt: 'SwiftUI' }} /></li>
            <li><SkillEntry language="Spring Boot" icon={{src: '/icons/skills/spring-boot.svg', alt: 'Spring Boot' }} /></li>
          </ul>
          
          <h1>{ t("skills.databases") }</h1>
          <ul>
            <li><SkillEntry language="PostgreSQL" icon={{src: '/icons/skills/postgresql.svg', alt: 'PostgreSQL' }} /></li>
            <li><SkillEntry language="MariaDB" icon={{src: '/icons/skills/mariadb.svg', alt: 'MariaDB' }} /></li>
          </ul>

          <h1>{ t("skills.devops") }</h1>
          <ul>
            <li><SkillEntry language="Azure DevOps" icon={{src: '/icons/skills/azure-devops.svg', alt: 'Azure DevOps' }} /></li>
            <li><SkillEntry language="GitLab" icon={{src: '/icons/skills/gitlab.svg', alt: 'GitLab' }} /></li>
            <li><SkillEntry language="Docker" icon={{src: '/icons/skills/docker.svg', alt: 'Docker' }} /></li>
            <li><SkillEntry language="Ansible" icon={{src: '/icons/skills/ansible.svg', alt: 'Ansible' }} /></li>
          </ul>

          <h1>{ t("skills.tools") }</h1>
          <ul>
            <li><SkillEntry language="Visual Studio Code" icon={{src: '/icons/skills/vsc.svg', alt: 'Visual Studio Code' }} /></li>
            <li><SkillEntry language="Git" icon={{src: '/icons/skills/git.svg', alt: 'Git' }} /></li>
            <li><SkillEntry language="Vim" icon={{src: '/icons/skills/vim.svg', alt: 'Vim' }} /></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
