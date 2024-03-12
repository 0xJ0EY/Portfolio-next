import { SubViewNavigation, SubViewParams } from "./AboutView";
import styles from './AboutView.module.css';

function ProjectPage(props: { title: string, params: SubViewParams, content: JSX.Element }) {
  const params = props.params;

  function openContactApp() {
    params.manager.open('/Applications/Contact.app');
  }

  function englishContent() {
    const contact = (<>
      <p>If you have any questions or comments, please contact me via the <a onClick={() => openContactApp()} href='#contact'>contact application</a> or shoot me an email at <a href="mailto:contact@joeyderuiter.me">contact@joeyderuiter.me</a></p>
    </>);

    return { contact };
  }

  function dutchContent() {
    const contact = (<>
      <p></p>
    </>);

    return { contact };
  }

  const content = params.language === 'nl' ? dutchContent() : englishContent();

  return (<>
    <div className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div className={styles['subpage-content']}>
        <h1>{props.title}</h1>
        { props.content }

        <h3>Contact</h3>
        { content.contact }
      </div>
    </div>
  </>);
}

export function ProjectPortfolio2024(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>Somewhere in 2023 I decided it might be time to replace my portfolio website. As it was a long time ago that build my original one.</p>

      <p>After looking at some portfolio showcases of some other developers, I was very impressed by Henry Heffernan’s showcase (<a rel="noreferrer" target="_blank" href="https://henryheffernan.com/">https://henryheffernan.com/</a>). And decided to build something similar to it. Although I wanted to build a more Unix like operating system.</p>

      <p>So I started to work on my first prototype. My prototype was an attempt to render the scene with a “cutout” shader, so it would display the content of the monitor through the 3D scene. After a successful attempt, I decided to work on the real thing.</p>

      <p>Now building a portfolio website is a great opportunity to try out some new technologies, so for this project I decided to try out React within the NextJS framework. And now after I finished it, I would say that the choice is good. I had some troubles at first with the way React has to handle its data and the rules of hooks, but at the end I was quite comfortable with it.</p>

      <p>One of the things I really wanted to build was a virtual file system, where the user would be able to actually drag and drop files like a real operating system. This file system would also be the corner stone on how the user would interact with the website, just like many other operating systems.</p>

      <p>Another thing I really wanted to get right, was browser support and mobile support. Due to the weird nature of the how this portfolio website works, it landed itself in many not well supported use cases of a browser. This led to many browser specific ways of handling certain features. Mobile support was a bit hard to do, as I needed a custom implementation for zooming in and out of the website. Due to some technical difficulties zooming has a delayed effect.</p>

      <p>This project was very fun to build, but it took way longer than originally expected. Funny enough, this wasn’t due to the programming. This was mainly due to me under estimating how hard graphic design and 3D modelling would be, and me wanting to deliver a high quality product and not just some ”programmer art”.</p>

      <h3>Technology</h3>
      <p>
        React, NextJS, TypeScript and webgl
      </p>
    </>);
  }

  function RenderDutchContent() {
    return (<>Dutch content</>);
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2024', content, params});
}

export function ProjectJScript(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>J(oey)-Script is a small half complete runtime I wrote at the end of 2023 in Rust. The reason why I build this, was to get a better grasp on how programs are actually parsed and executed, I also used this program as an opportunity to improve my Rust skills. The runtime is based on my own interpretation of the JavaScript standard without focusing too much on the details. It uses an Esprima inspired abstract syntax tree as an internal data structure to parse the program.</p>

      <p>Within this project, I decided to write a lot of unit tests. To capture as much unexpected behavior changes as possible, and I must say. I liked the whole experience.</p>

      <p>It is not completed due to the large amount of work that goes into a language runtime and me being contend with the knowledge I learned from this project.</p>

      <h3>Technology</h3>
      <p>
        Rust, and the ECMAScript documentation<br/>
        <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/joey-script">Link</a> to the project.
      </p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'J-Script', content, params});
}

export function ProjectAdventOfCode(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>In December of 2022 I decided to do the Advent of Code challenges. Due to having time available because I was having my vacation, and thinking this would be a great opportunity to improve my knowledge about Rust and the software engineering problems in general. I got to day 16 before I got a headache for a few days and lost the  motivation to continue AoC.</p>

      <h3>Technology</h3>
      <p>Rust</p>
    </>)
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Advent of Code', content, params});
}

export function ProjectPortfolio2021(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>At my university were required to do two internships, to make my applications stand out a bit more I decided to make a eye-catching portfolio.</p>

      <p>I was very concerned with bundle size back then, and I decided to roll my own WebGL context to render the beam the video is played on. Let’s say I learned a lot of this project, and why my current portfolio uses Three.</p>

      <h3>Technology</h3>
      <p>
        TypeScript, Angular and webgl<br/>
        You can see the site <a rel="noreferrer" target="_blank" href="https://old.joeyderuiter.me">here</a>.
      </p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2021', content, params});
}

export function ProjectTBot(params: SubViewParams) {
  /* TODO: Add video */

  function RenderEnglishContent() {
    return (<>
      <p>For the final project of the robotics minor (2020) the students had to come up with their own project, and build them. We stumbled onto the idea to build a robot that would collect tennis balls of the field. Because what is more annoying then fetching the balls on the ground after a good exercise.</p>

      <h3>Technology</h3>
      <p>The robot works as follows. The robot will drive around until it finds a tennis ball via image recognition. If the robot finds a tennis ball, he will drive towards it and collect it. After that it will calculate a route to the chosen collection point to drop off the tennisball.</p>

      <p>The technology used for this project is as follows. We used an already on the market Arduino shield, named the Zumo. This gave us a good fundamental to continue working on. The only change we made to the Zumo is adding a 3D printed fork, to move around the balls. For the rest of the Robot we used an Raspberry Pi and a Google Coral. This device is connected to the Zumo with a serial connection. And functions as the brain behind the robot. This means that the it runs the web GUI and does most of the calculations.</p>

      <p>To detect the current location of the robot, we used a few Bluetooth beacons. The robot knows the location of the beacons and uses RSSI to calculate the distance between each other.</p>

      <p>Almost all the software is written in C or in Python. All the software on the embedded devices (Arduino and Beacons) is written in C and the software on the Raspberry Pi is written in Python.</p>

      <h3>Team</h3>
      <p>
        <ul>
          <li>- Sergi Philipsens</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'T-Bot', content, params});
}

export function ProjectYoui(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>For the last group project of my second year of university (2019) I worked on a prototype Android dating app called Youi. One of the must-haves was that the app should contain the functionality to video call your dating partner. This functionality was eventually implemented with a from scratch peer-to-peer WebRTC solution.</p>

      <h3>Technology</h3>
      <p>
        Kotlin for the Android based on a MVVM structure.<br/>
        NodeJS for the Firebase cloud functions.<br/>
        WebRTC for the peer-to-peer videocall solution.
      </p>

      <h3>Team</h3>
      <p>
        <ul>
          <li>- Ewout Millink</li>
          <li>- Omid Wiar</li>
          <li>- Wim de Groot</li>
          <li>- Vincent Nuis</li>
          <li>- Rutger Uijtendaal</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Youi', content, params});
}

export function ProjectPCParts(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>PCParts is a webshop that I build in the third period of my second year of university (2019). In this period there was a class where you had to build your own webshop based on the technologies Angular 7 & Dropwizard.</p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'PCParts', content, params});
}

export function ProjectAlbert(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>Albert is a simple accouting program designed for small to medium-sized companies. Te idea was to update the old legacy project from the project owner to a new modern web based project.</p>

      <p>This project was made by a group of 5 students, of which I was mostly involved in setting up the CI & CD pipeline. For the rest of the project I build a table class (a bit ORM like) that had the possibility of lazy loading and inline editing of the data.</p>

      <h3>Technology</h3>
      <p>Angular 7, PostgresSQL, Dropwizard and TravisCI</p>

      <h3>Team</h3>
      <p>
        <ul>
          <li>- Alexander van Dam</li>
          <li>- Bashar Farah</li>
          <li>- Maarten Berden</li>
          <li>- Sander Frentz</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Albert', content, params});
}

export function ProjectPaintboy(params: SubViewParams) {
  function RenderEnglishContent() {
    return (<>
      <p>Paintboy is a game that was meant to promote my previous school the Grafisch Lyceum Rotterdam. (2016) This project was build by a team of 6. Whereof 2 programmers and 4 game artists. This game was build using Unity 5 and C#.</p>

      <p>My main work on this game was the movement of the player, the shooting mechanics and the camera shake implementation.</p>

      <h3>Technology</h3>
      <p>Unity 5 and C#</p>
    </>);
  }

  function RenderDutchContent() {
    return <>Dutch content</>
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Paintboy', content, params});
}
