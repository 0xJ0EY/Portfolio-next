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
        <h1 className={styles['page-h1']}>Welcome</h1>
        <p>
          I’m Joey de Ruiter, a software developer living in the Netherlands.
        </p>

        <p>Thanks for taking the time to explore my portfolio. I hope you enjoy it as much I did enjoy developing it. If you have any questions or comments, please contact me via the “contact application” (click to open it) or shoot me an email at contact@joeyderuiter.me</p>

        <p>
          <hr />
          download cv
          <hr />
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