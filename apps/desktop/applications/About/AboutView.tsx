import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useReducer, useRef, useState } from 'react';
import styles from './AboutView.module.css';
import { BaseApplicationManager } from '../ApplicationManager';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ProjectAdventOfCode, ProjectAlbert, ProjectJScript, ProjectPCParts, ProjectPaintboy, ProjectPortfolio2021, ProjectPortfolio2024, ProjectTBot, ProjectYoui } from './Projects';

type SubView = (
  'home' |
  'about' |
  'experience' |
  'projects' |
  'project-portfolio-2024' |
  'project-j-script' |
  'project-advent-of-code' |
  'project-portfolio-2021' |
  'project-t-bot' |
  'project-youi' |
  'project-pcparts' |
  'project-albert' |
  'project-paintboy' |
  'contact'
);

export type SubViewParams = {
  manager: BaseApplicationManager,
  changeParent: (view: SubView) => void,
  translate: TFunction,
  language: string
}

function HomeSubView(params: SubViewParams) {
  const t = params.translate;

  return (<>
    <div className={styles['subpage-home']}>
      <h1 className={styles['home-title']}>Joey de Ruiter</h1>
      <h3 className={styles['home-subtitle']}>Software engineer</h3>

      <div className={styles['home-button-container']}>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('about')}>{t("about.navigation.about")}</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('experience')}>{t("about.navigation.experience")}</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('projects')}>{t("about.navigation.projects")}</button>
        <button className={`${styles['home-button']} system-button`} onClick={() => params.changeParent('contact')}>{t("about.navigation.contact")}</button>
      </div>
    </div>
  </>)
}

export function SubViewNavigation(params: SubViewParams) {
  const t = params.translate;

  return (<>
    <div className={styles['navigation']}>
      <div>
        <span className={styles['logo-part']}>Joey</span>
        <span className={styles['logo-part']}>de Ruiter</span>
      </div>

      <div className={styles['navigation-button-container']}>
        <button className='system-button' onClick={() => params.changeParent('home')}>{t("about.navigation.home")}</button>
        <button className='system-button' onClick={() => params.changeParent('about')}>{t("about.navigation.about")}</button>
        <button className='system-button' onClick={() => params.changeParent('experience')}>{t("about.navigation.experience")}</button>
        <button className='system-button' onClick={() => params.changeParent('projects')}>{t("about.navigation.projects")}</button>
        <button className='system-button' onClick={() => params.changeParent('contact')}>{t("about.navigation.contact")}</button>
      </div>
    </div>
  </>)
}

function AboutSubView(params: SubViewParams) {
  function openContactApp() {
    params.manager.open('/Applications/Contact.app');
  }

  function RenderDutchContent() {
    return (<>Dutch content</>);
  }

  function RenderEnglishContent() {
    return (
      <>
        <h1 className={styles['page-h1']}>Welcome</h1>

        <p>
          I’m Joey de Ruiter, a software developer living in the Netherlands.
        </p>

        <p>Thanks for taking the time to explore my portfolio. I hope you enjoy it as much I did enjoy developing it. If you have any questions or comments, please contact me via the <a onClick={() => openContactApp()} href='#contact'>contact application</a> or shoot me an email at <a href="mailto:contact@joeyderuiter.me">contact@joeyderuiter.me</a></p>

        <p>
          download cv
        </p>

        <h2>About me</h2>

        <p>From a young age I was keen on computers, especially games. I had a curiosity on how the magic box in front of me worked, and how it was able to display those images at real time. This translated into a interest into game development from a young age. In middle school, I started to play around with basic technologies to make games.</p>

        <p>After middle school, I enrolled into a college (Grafisch Lyceum Rotterdam) for “mediatechnologie” here I learned the basics of web and game development. But most importantly I fell in love with programming, and finding creative solutions to problems.</p>

        <p>Three years later, I had my degree. But still felt like I was missing some knowledge, so I went and enrolled into local university (Hogeschool Leiden) for their “Informatica” program. A program that would eventually specialise in Software Engineering. In this program I learned a lot about software, how computers operate and communicate on a lower level and higher level concepts like software testing and how to write “clean” maintainable code.</p>

        <p>The most educational part of this degree where the group projects, every period from the second year onward had a group project with other students. These projects always had a different way of working, from agile to waterfall. And a different goal to obtain, some of the projects that have been made are visible under the projects listed on this website.</p>

        <p>During my studies I also attended two different internships, one at ING and a final one at BPI Services. At ING I worked on a internal app for finding and fixing data differences between microservices. On this project I was also responsible for managing the CI/CD pipeline and the environments the app ran on.</p>

        <p>At my BPI internship I worked on an web application called IDFlow, mainly designing, and developing the Flow Manager. The main work items during this internship involved gathering technical and functional requirements, the design for the implementation and building a prototype. This prototype would eventually integrate into the product.</p>

        <p>After my internship and graduation I decided to keep working at BPI for a bit. I was placed onto the iMatch team. This team was responsible for building and developing a hardware and software solution used in reading and verifying the NFC chip in travel documents, and capturing fingerprints.</p>

        <p>During my last few weeks at BPI, I quickly build a product to flash, test and verify the PCBs used within the iMatches. This was always a difficult problem to automate due to the steps needed to flash the hardware. But am not open for new opportunities!</p>

        <h2>Hobbies</h2>

        <p>A lot of my hobbies are focused around computers, but not all of them. I like to tour around on my racing bike every Sunday morning, with a small club of friends and my dad. But other then that I like to write small programs, to explore new technologies and try to solve interesting problems.</p>

        <p>But I also like to build my own small form factor (SFF) pc’s, custom keyboards and of course play games. :^)</p>
      </>
    );
  }

  return (<>
    <div data-subpage className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div data-subpage-content className={styles['subpage-content']}>
        { params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent() }
      </div>
    </div>
  </>);
}

function ExperienceSubView(params: SubViewParams) {
  const t = params.translate;

  function dutchContent() {
    const bpi = (<></>);

    const ing = (<></>);

    const floro = (<></>);

    return { bpi, ing, floro }
  }

  function englishContent() {
    const bpi = (<>
      <p>When I first joined BPI services as an intern, I was placed on the ID Flow team. The then objective was to make the product more suitable for different kind of customer processes. This was done by making the process flow configurable, here me and colleague designed, developed and implemented the Flow Manager. A drag and drop implementation to configure the process flow to model the business process.</p>

      <p>After my internship had ended, I joined the company and was put onto the iMatch team. With the task to improve the iOS support for the iMatch. There was a very bare bones implementation of a Swift SDK when I inherited it. Only capable of reading very basic travel documents. For this project I had to dive deep into the ICAO specification around reading machine readable travel documents (MRTDs) to get some domain knowledge.</p>

      <p>At the end I improved a lot of parts of the iMatch. There was an big improvement in stability, we went from failing around 1 in 10 fingerprint captures to at least 100 continuously, without any error. There was a big improvement in supported MRTDs. We went from only being able to read and verify some passports to being able to read and verify all the passports, we came across.</p>

      <p>For new features I implemented PACE for authentication and creating a secure communication channel. Chip Authentication for verification if it is a real document. And Passive Authentication, for validating the data coming of the document. I also build some more miscellaneous features like being able to update the firmware of the iMatch.</p>

      <p>In my last few weeks at BPI I build a completely new product, to improve the flashing, testing and verification of the iMatch PCBs. The reason why this product was hard to develop was due to the unique use of a single USB-C connector to flash the two chips inside with our firmware. The upper data lines where linked to one chip, and the bottom ones to the other. My idea was to build a custom dongle to split these data lines to their own USB port.</p>

      <p>After getting an go ahead from the CEO for this solution, I went and gathered more requirements from the PO and eventual users. And went to work, within a few weeks there was a ready to use product, that solved a big issue regarding production of the iMatch.</p>

      <h3>Technologies</h3>
      <p>
        <b>IDFlow</b>: C# with .NET Framework and a Vue 2 frontend<br/>
        <b>iMatch</b>: Swift, Python, C and C++
      </p>
    </>);

    const ing = (<>
      <p>At ING I worked together with another intern from my university on a internal tool for detecting and fixing data differences between micro services. I was primarily working on the backend of this tool, but was also responsible for the maintaining the CI/CD pipelines and virtual environments the tool was running on.</p>

      <p>The team consisted of two interns, two internal ING developers and one chapter lead.</p>

      <p>My work was primarily focused around gathering the correct functional and technical requirements for the requested features, design and development of the API of the new features. And getting access to the correct services for our API.</p>

      <p>During this internship I learned a lot about how software is managed within big organisations. I also learned that software in banks need to deal a lot with compliance, even for such a small app as ours.</p>

      <h3>Technologies</h3>
      <p>
        Java Spring boot on the backend and a Lit frontend.<br/>
        For managing the machines a lot of different tooling was used: RHEL, GitLab CI/CD, Password vaults, Jenkins and Ansible.
      </p>
    </>);

    const floro = (<>
      <p>At Floro, I worked as a full-stack developer on a few different CRM and CMS systems, all written in PHP and jQuery. Here I learned the basics of full-stack web development, and how to collaborate within a software engineering team.</p>

      <h3>Technologies</h3>
      <p>PHP and jQuery, Git</p>
    </>);

    return { bpi, ing, floro }
  }

  const content = params.language === 'nl' ? dutchContent() : englishContent();

  return (<>
    <div data-subpage className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div data-subpage-content className={styles['subpage-content']}>
        <h1 className={styles['page-h1']}>{t("about.navigation.experience")}</h1>
        
        <h2>2021 - 2023 - BPI services b.v.</h2>
        { content.bpi }
        
        <h2>2020 - 2021 - ING</h2>
        { content.ing }

        <h2>2015 - 2017 - Floro</h2>
        { content.floro }
      </div>
    </div>
  </>);
}

function ProjectsSubView(params: SubViewParams) {
  const t = params.translate;

  function ProjectButton(name: string, target: SubView, imageUrl: string) {
    return (<>
      <button className={styles['project-button']} onClick={() => params.changeParent(target) }>
        <div>
          <img src={imageUrl} alt={`${target} thumbnail`} width={25} height={25} />
        </div>
        <span>{name}</span>
      </button>
    </>);
  }

  return (<>
    <div data-subpage className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div data-subpage-content className={styles['subpage-content']}>
        <h1 className={styles['page-h1']}>{t("about.navigation.projects")}</h1>

        <h2>2024</h2>
        <ul>
          <li>{ProjectButton('Portfolio 2024', 'project-portfolio-2024', '/icons/project-portfolio-2024.png')}</li>
        </ul>

        <h2>2023</h2>
        <ul>
          <li>{ProjectButton('J-Script', 'project-j-script', '/icons/project-j-script.png')}</li>
        </ul>

        <h2>2022</h2>
        <ul>
          <li>{ProjectButton('Advent of Code', 'project-advent-of-code', '/icons/project-advent-of-code.png')}</li>
        </ul>

        <h2>2021</h2>
        <ul>
          <li>{ProjectButton('Portfolio 2021', 'project-portfolio-2021', '/icons/project-portfolio-2021.png')}</li>
        </ul>

        <h2>2020</h2>
        <ul>
          <li>{ProjectButton('T-Bot', 'project-t-bot', '/icons/project-t-bot.png')}</li>
        </ul>

        <h2>2019</h2>
        <ul>
          <li>{ProjectButton('Youi', 'project-youi', '/icons/project-youi.png')}</li>
          <li>{ProjectButton('PCParts', 'project-pcparts', '/icons/project-pcparts.png')}</li>
          <li>{ProjectButton('Albert', 'project-albert', '/icons/project-albert.png')}</li>
        </ul>

        <h2>2016</h2>
        <ul>
          <li>{ProjectButton('Paintboy', 'project-paintboy', '/icons/project-paintboy.png')}</li>
        </ul>
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
    case 'project-portfolio-2024': return ProjectPortfolio2024(params);
    case 'project-j-script': return ProjectJScript(params);
    case 'project-advent-of-code': return ProjectAdventOfCode(params);
    case 'project-portfolio-2021': return ProjectPortfolio2021(params);
    case 'project-t-bot': return ProjectTBot(params);
    case 'project-youi': return ProjectYoui(params);
    case 'project-pcparts': return ProjectPCParts(params);
    case 'project-albert': return ProjectAlbert(params);
    case 'project-paintboy': return ProjectPaintboy(params);
  }
  
  return <></>;
}

export default function AboutApplicationView(props: WindowProps) {
  const { application, windowContext } = props;

  const [subView, setSubView] = useState<SubView>('home');
  const { t, i18n } = useTranslation("common");

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

  function changeParent(view: SubView) {
    if (view === 'contact') {
      application.on({ kind: 'about-open-contact-event' }, windowContext);
      return;
    }

    setSubView(view);
  }

  return (
    <div className="content-outer">
      <div ref={contentParent} className="content">
        { RenderSubView(subView, 
          {
            manager: application.manager,
            changeParent,
            translate: t,
            language: i18n.language
          }
        ) }
      </div>
    </div>
  )
}