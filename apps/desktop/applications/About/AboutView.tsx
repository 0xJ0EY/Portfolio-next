import { WindowProps } from '@/components/WindowManagement/WindowCompositor';
import { useEffect, useReducer, useRef, useState } from 'react';
import styles from './AboutView.module.css';
import { ApplicationManager, BaseApplicationManager } from '../ApplicationManager';
import { useTranslation } from 'react-i18next';
import { TFunction, loadLanguages } from 'i18next';
import { ProjectAdventOfCode, ProjectAlbert, ProjectJScript, ProjectPCParts, ProjectPaintboy, ProjectPortfolio2021, ProjectPortfolio2024, ProjectTBot, ProjectYoui } from './Projects';
import Image from 'next/image';

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

function Contact(props: { manager: BaseApplicationManager, language: string }) {
  function openContactApp() {
    props.manager.open('/Applications/Contact.app');
  }

  function englishContent() {
    return (<>
      <p>If you have any questions or comments, please contact me via the <a onClick={() => openContactApp()} href='#contact'>contact application</a> or shoot me an email at <a href="mailto:contact@joeyderuiter.me">contact@joeyderuiter.me</a></p>
    </>);
  }

  function dutchContent() {
    return (<>
      <p>Als je opmerkingen of vragen hebt, neem contact met mij op via de <a onClick={() => openContactApp()} href='#contact'>contact applicatie</a> of schiet een mailtje naar met via <a href='mailto:contact@joeyderuiter.me'>contact@joeyderuiter.me</a></p>
    </>);
  }

  return props.language === 'nl' ? dutchContent() : englishContent();
}

function DownloadCv(props: { translate: TFunction }) {
  const t = props.translate;

  return (<>
    <div className={styles['download-cv']}>
      <hr className={styles['about-hr']}/>
      <div className={styles['download-content']}>
        <img src="/icons/printer.png" alt="Printer" draggable={false} />
        <div>
          <h2>{t("about.download_cv.title")}</h2>
          <a target='_blank' href={t("about.download_cv.download_link")}>{t("about.download_cv.instruction")}</a>
        </div>
      </div>
      <hr className={styles['about-hr']}/>
    </div>
  </>);
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

  function ImageOfMyself(props: { language: string }) {
    const text = props.language === 'nl' ? 'Ikzelf, maart 2024' : 'Me, March 2024';

    return (<>
      <div className={styles['image-container']}>
        <img draggable={false} src="/images/me.jpg" alt="Image of myself" />
        <span>{text}</span>
      </div>
    </>);
  }


  function RenderDutchContent() {
    return (
      <div>
        <h1 className={styles['page-h1']}>Welkom</h1>

        <p>
          Ik ben Joey de Ruiter, een software ontwikkelaar in Nederland.
        </p>

        <p>Bedankt om tijd vrij te maken voor het bekijken van mijn portfolio website. Ik hoop dat je er even veel plezier van hebt, als ik had tijdens het ontwikkelen. Als je opmerkingen of vragen hebt, neem contact met mij op via de <a onClick={() => openContactApp()} href='#contact'>contact applicatie</a> of schiet een mailtje naar met via <a href='mailto:contact@joeyderuiter.me'>contact@joeyderuiter.me</a></p>
        
        <DownloadCv translate={params.translate}/>

        <h2>Over mij</h2>

        <ImageOfMyself language='nl'/>

        <p>Vanaf een jonge leeftijd had ik al affiniteit met computers, voornamelijk games. Ik had altijd een nieuwsgierigheid hoe computers altijd de “plaatjes" op het scherm toverde. Deze interesse vertaalde uiteindelijk in grote interesse in game development vanaf een jonge leeftijd. Op de middelbare begon ik te spelen met technologie om simpele games te maken.</p>

        <p>Na de middelbare besloot ik om aan het Grafisch Lyceum Rotterdam te gaan studeren voor mediatechnologie. Tijdens deze opleiding leerde ik de basis van web en game development. Maar belangrijker ik kwam daadwerkelijk in aanraking met programmeren en het oplossen van problemen met creatieve oplossingen.</p>

        <p>Drie jaar later had ik mijn diploma, maar besloot toch verder te studeren. Dus melde ik mij aan bij de lokale hogeschool, Hogeschool Leiden. Voor hun informatica programma. Een programma die uiteindelijk zou specialiseren in software engineering. Tijdens deze opleiding leerde ik veel over software, hoe computers daadwerkelijk werken en software ontwikkel concepten zoals software testen en hoe je “clean" onder houdbare code kan schrijven. Daarnaast heb ik ook mijn minor in  Robotica behaald aan deze school.</p>

        <p>Het meest educatieve deel van deze opleiding waren de groep projecten. Iedere periode sinds begin van het tweede jaar had een groep project met een andere studenten. Deze projecten hadden altijd een ander soort opdracht, en daarnaast moesten we verschillende project management technieken toepassen. Enkele van deze projecten zijn zichtbaar op deze website.</p>

        <p>Een onderdeel van mijn opleiding was, twee stages zoeken een regulieren stage en een afstudeerstage. Mijn reguliere stage heb ik bij ING gedaan, en de afstudeerstage bij BPI Services. Bij ING werkte ik aan een interne app voor het vinden en fixen van data discrepanties tussen microservices.</p>

        <p>Bij de BPI afstudeerstage werkt ik aan ID Flow een webapplicatie origineel ontworpen voor het aanmelden en registeren van bezoekers aan een bedrijventerrein. Het doel van de stage was het ontwerpen, ontwikkelen en implementeren van de Flow Manager. Een oplossing waarmee we de procesflow van IDFlow beter konden configureren en aanpassen op de wensen van de klant. Het resultaat van deze stage is uiteindelijk opgenomen in het daadwerkelijke product.</p>

        <p>Nadat ik mijn stages en opleiding had afgerond besloot ik bij BPI te blijven werken. Ik was op het iMatch team geplaatst. Dit team was verantwoordelijk voor het bouwen en ontwikkelen van de software en hardware oplossing van de iMatch. Een apparaat gebruikt voor het verifiëren van reisdocumenten en opnemen van vingerafdrukken.</p>
      
        <h2>Hobbies</h2>

        <p>Veel van mijn hobbies zijn gecentreerd rondom de computer, maar niet allemaal. Iedere zondag doe ik een rondje op de racefiets met een klein groepje vrienden en mijn vader. Daarnaast vind ik het leuk om kleine programma’s te schrijven om nieuwe technologieën uit te proberen.</p>

        <p>Ik heb ook een interesse in small form factor (SFF) pc’s, custom keyboards en het spelen van games. :ˆ)</p>
      </div>
    );
  }

  function RenderEnglishContent() {
    return (
      <div>
        <h1 className={styles['page-h1']}>Welcome</h1>

        <p>
          I’m Joey de Ruiter, a software developer living in the Netherlands.
        </p>

        <p>Thanks for taking the time to explore my portfolio. I hope you enjoy it as much I did enjoy developing it. If you have any questions or comments, please contact me via the <a onClick={() => openContactApp()} href='#contact'>contact application</a> or shoot me an email at <a href="mailto:contact@joeyderuiter.me">contact@joeyderuiter.me</a></p>

        <DownloadCv translate={params.translate}/>

        <h2>About me</h2>

        <ImageOfMyself language='en'/>

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
      </div>
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
    const bpi = (<>
      <p>Toen ik voor het eerst als stagiair bij BPI kwam, werd ik op het ID Flow team geplaatst. Het toenmalig doel was om het product beter toepasbaar te maken op verschillende soorten klant processen. Dit was gedaan door de statische proces flow van de applicatie configureerbaar te maken. Hiervoor hebben een collega en ik samen de Flow Manager ontworpen, ontwikkeld en geïmplementeerd. De Flow Manager is een drag and drop implementatie voor het configureren van de proces flow aan het gewenste business proces.</p>

      <p>Nadat mijn stage was afgerond, ging ik in dienst bij het bedrijf en werd op het iMatch team geplaatst. Met de taak om de iOS support voor de iMatch te verbeteren. Er was een zeer bare bones implementatie van een Swift SDK die ik overnam. Die enkel de mogelijkheid had om erg basis reisdocumenten uit te lezen. Voor dit project moest ik mij verdiepen in de ICAO specificatie rondom machine readable travel documents (MRTDs) om wat domeinkennis op te doen.</p>

      <p>Aan het einde van het project waren er veel delen van de iMatch door mij verbeterd. Er was een grote verbetering in stabiliteit, we gingen van ongeveer 1 in 10 gefaalde vingerprint scans naar minimaal 100 achter elkaar zonder error. Er was een grote verbetering in ondersteunde MRTDs. Aan het begin was het enkel mogelijk om enkele paspoorten uit te lezen en te verifiëren, maar aan het einde konden we ieder document uitlezen die we tegenkwamen.</p>

      <p>Voor nieuwe features heb ik PACE geïmplementeerd voor authenticatie en het opzetten van een beveiligd communicatie kanaal. Chip Authentication voor het verifiëren of het document daadwerkelijk uitgegeven is door een erkende overheid. En Passive Authentication voor het verifiëren van de data die van de kaart af kwam. Daarnaast heb ik ook enkele andere features ontwikkeld, zoals het updaten van de iMatch firmware.</p>

      <p>In de laatste paar weken dat ik voor BPI te werk was had ik de mogelijkheid om het flash, test en verificatie proces te verbeteren. De redenen waarom dit proces zo lastig was te verbeteren kwam door het unieke gebruik van de USB-C connector om beide chips te flashen. De bovenste data lijnen van de connector gingen naar de eerste chip, en de onderste naar de andere. Het was mijn idee om een custom dongel te maken die de data lijnen zou splitsen naar twee verschillende USB poorten.</p>

      <p>Nadat ik een go-ahead kreeg van de CEO voor deze oplossing, ging ik nog meer requirements halen bij de PO en uiteindelijke gebruikers. Nadat ik deze requirements had verzameld ging ik te werk. Binnen enkele weken was het product klaar om te gebruiken, en hiermee was een groot productie proces flink verbeterd.</p>

      <h3>Technologie gebruikt</h3>
      <p>
        <b>IDFlow</b>: C# met .NET Framework en een Vue 2 frontend<br/>
        <b>iMatch</b>: Swift, Python, C en C++
      </p>
    </>);

    const ing = (<>
      <p>Bij ING werkte ik samen met een andere stagiair van mijn hogeschool aan een interne tool voor het detecteren en repareren van data discrepanties tussen microservices. Ik werkte voornamelijk aan de backend van deze tool, maar was ook verantwoordelijk voor het onderhouden van de CI/CD pipelines en de omgevingen waarop de tool draaide.</p>
    
      <p>Het team bestond uit twee stagiairs, twee interne ING developers en een chapter lead.</p>

      <p>Een groot deel van het werk was het vastleggen van de functionele en technische requirements van de nieuwe features. Hieronder viel het design en development van deze features, maar ook access aanvragen bij andere teams voor de services die gebruikt worden door de API.</p>

      <p>Tijdens deze stage heb ik veel geleerd van hoe software wordt gemanaged binnen grote organisaties. Ook heb ik geleerd dat software binnen banken veel aandacht moeten besteden aan het naleven van de regels gesteld door de Nederlandse Bank. Zelfs voor een kleine app zoals die van ons.</p>

      <h3>Technologie gebruikt</h3>
      <p>
        Java Sprint Boot op de backend en een Lit frontend.<br/>
        Voor het managen van de machines werd er veel verschillende tooling gebruikt: RHEL, GitLab CI/CD, Password vaults, Jenkins en Ansible.
      </p>
    </>);

    const floro = (<>
      <p>Bij Floro werkte ik als een full-stack developer aan een paar verschillende CRM en CMS systemen, allemaal geschreven in PHP en jQuery. Hier leerde ik de basis van full-stack web development en hoe ik efficient in een software ontwikkel team werk.</p>

      <h3>Technologie gebruikt</h3>
      <p>PHP, jQuery en Git</p>
    </>);

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

      <p>A large part of my work was focused around gathering the correct functional and technical requirements for the requested features. Design and development of the API of the new these features. And getting access to the correct services for our API.</p>

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
      <p>PHP, jQuery and git</p>
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
        
        <DownloadCv translate={params.translate}/>

        <Contact manager={params.manager} language={params.language} />
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

        <h2>2022</h2>
        <ul>
          <li>{ProjectButton('J-Script', 'project-j-script', '/icons/project-j-script.png')}</li>
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