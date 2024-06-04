import { SubViewNavigation, SubViewParams } from "./AboutView";
import styles from './AboutView.module.css';
import Image from 'next/image';


function ProjectImage(props: { src: string, alt: string, label?: string, labelNumber?: number }) {
  const { src, alt, label, labelNumber } = props;

  return (<>
      <div className={styles['project-image-container']}>
        <Image
          src={src}
          alt={alt}
          fill
          quality={90}
          style={{ objectFit: 'contain' }}
          sizes="400px, 800px, 1024px"
        />
      </div>
      {label && <span className={styles['project-image-label']}><b>Label {labelNumber ?? 1}: </b>{label}</span>}
    </>
  );
}

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
      <p>Als je opmerkingen of vragen hebt, neem contact met mij op via de <a onClick={() => openContactApp()} href='#contact'>contact applicatie</a> of schiet een mailtje naar met via <a href='mailto:contact@joeyderuiter.me'>contact@joeyderuiter.me</a></p>
    </>);

    return { contact };
  }

  const content = params.language === 'nl' ? dutchContent() : englishContent();
  const backToProjects = params.language === 'nl' ? 'Terug naar projecten' : 'Back to projects';

  return (<>
    <div data-subpage className={styles['subpage']}>
      { SubViewNavigation(params) }
      <div data-subpage-content className={styles['subpage-content']}>
        <h1>{props.title}</h1>
        <button onClick={() => params.changeParent('projects')} className={styles['button-link']}>{backToProjects}</button>
        { props.content }

        <h3>Contact</h3>
        { content.contact }

        <button onClick={() => params.changeParent('projects')} className={styles['button-link']}>{backToProjects}</button>
      </div>
    </div>
  </>);
}

export function ProjectRedisClone(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>In 2024 I came across a website (<a href="https://codecrafters.io" target="blank" rel="noreferrer">codecrafters.io</a>) where you could create programming challenges, these challenges consist of rebuilding applications that are used in the read world.</p>

        <p>While creating these applications you will learn about different concepts and how to apply these concepts in your own application.</p>

        <p>One of the reasons I decided to build a coderafters challenge was to demonstrate my familiarity with building more complex applications, in system level programming languages.</p>

        <p>The application I chose to recreate was a Redis server. Redis is a distributed key-value database. This meant that I had to build the database logic but also the logic needed to synchronize different instances of the database.</p>

        <p>After working on the Redis server for about two weeks, I had a version that passed all of the codecrafters' test cases.</p>
        
        <h3>Technology</h3>
        <p>
          Only Rust<br/> 
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/codecrafters-redis-rust">Link</a> to the code of the project.
        </p>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>In 2024 kwam ik achter een website (<a href="https://codecrafters.io" target="blank" rel="noreferrer">codecrafters.io</a>) waar je programmeer uitdagingen kan maken. Deze uitdagingen bestaan uit het opnieuw bouwen van applicaties die in de werkelijkheid worden gebruikt.</p>

        <p>Tijdens het maken van deze applicaties leer je van verschillende concepten af, en hoe je deze concepten toe moet passen in je eigen applicatie.</p>

        <p>Een van de redenen waarom ik besloot om een coderafters uitdaging te bouwen, was om te aan te tonen dat ik bekend ben met het bouwen van complexere applicaties, in system level programmeer talen.</p>

        <p>De applicatie waar ik voor koos om na te bouwen was een Redis server. Redis is een distributed key-value database. Dit betekende dat ik de database logica moest bouwen maar ook de logica benodigd om verschillende instanties van de database te synchroniseren.</p>

        <p>Na een ongeveer twee weken aan de Redis server hebben gewerkt, had ik een versie die door alle test cases van codecrafters heen kwam.</p>

        <h3>Technologie</h3>
        <p>
          Enkel Rust<br/> 
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/codecrafters-redis-rust">Link</a> naar de code van het project.
        </p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Redis clone', content, params});
}

export function ProjectPortfolio2024(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>Somewhere in 2023 I decided it might be time to replace my portfolio website. As it was a long time ago that build my original one.</p>

        <p>After looking at some portfolio showcases of some other developers, I was very impressed by Henry Heffernan’s showcase (<a rel="noreferrer" target="_blank" href="https://henryheffernan.com/">https://henryheffernan.com/</a>). And decided to build something similar to it. Although I wanted to build a more Unix like operating system.</p>

        <p>So I started to work on my first prototype. My prototype was an attempt to render the scene with a “cutout” shader, so it would display the content of the monitor through the 3D scene. After a successful attempt, I decided to work on the real thing.</p>

        <ProjectImage src="/images/project-portfolio.png" alt="Portfolio image" label="Portfolio at the end of the development cycle" />

        <p>Now building a portfolio website is a great opportunity to try out some new technologies, so for this project I decided to try out React within the NextJS framework. And now after I finished it, I would say that the choice is good. I had some troubles at first with the way React has to handle its data and the rules of hooks, but at the end I was quite comfortable with it.</p>

        <p>One of the things I really wanted to build was a virtual file system, where the user would be able to actually drag and drop files like a real operating system. This file system would also be the corner stone on how the user would interact with the website, just like many other operating systems.</p>

        <p>Another thing I really wanted to get right, was browser support and mobile support. Due to the weird nature of the how this portfolio website works, it landed itself in many not well supported use cases of a browser. This led to many browser specific ways of handling certain features. Mobile support was a bit hard to do, as I needed a custom implementation for zooming in and out of the website. Due to some technical difficulties zooming has a delayed effect.</p>

        <p>This project was very fun to build, but it took way longer than originally expected. Funny enough, this wasn’t due to the programming. This was mainly due to me under estimating how hard graphic design and 3D modelling would be, and me wanting to deliver a high quality product and not just some ”programmer art”.</p>

        <h3>Technology</h3>
        <p>
          React, NextJS, TypeScript and webgl<br/>
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/Portfolio-next">Link</a> to the code of the project.
        </p>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Ergens in 2023 besloot ik dat het tijd was voor een nieuwe portfolio website, aangezien het een lange tijd gelden was dat ik mijn originele had gebouwd.</p>

        <p>Na een tijdje rond te zoeken naar portfolio’s van andere developers was ik erg geïnspireerd door Henry Heffernan’s showcase (<a rel="noreferrer" target="_blank" href="https://henryheffernan.com/">https://henryheffernan.com/</a>). En besloot iets vergelijkbaars te bouwen, enkel wouw ik meer een Unix geïnspireerd systeem ontwikkelen.</p>

        <p>Dus besloot ik te werken aan een eerste prototype, het doel van dit prototype was om te testen of het mogelijk zou zijn om de scene te renderen doormiddel van een “cutout" shader. Zodat het de content op de monitor zou tonen in de 3D scene. Na een succesvolle prototype ging ik te werk aan de uiteindelijke versie.</p>

        <ProjectImage src="/images/project-portfolio.png" alt="Portfolio afbeelding" label="Portfolio aan het einde van de ontwikkel cyclus" />

        <p>Nu kwam ik aan bij het bouwen van de portfolio website, dit is altijd een goeie mogelijkheid om nieuwe technologieën uit te proberen. Dus voor dit project besloot ik om React uit te proberen binnen het NextJS framework. En nu dat het project is afgerond, ben ik blij met de keuze die ik heb gemaakt. Aan het begin had ik wat kleine problemen met hoe React omgaat met data en hooks, maar aan het einde was ik er erg comfortabel mee.</p>

        <p>Een ding die ik erg graag wouw bouwen was een virtuele file system, waarbij de gebruikers ook daadwerkelijk bestanden kunnen drag en droppen net zoals een operating systeem.</p>

        <p>Een ander ding waar ik erg veel tijd aan heb besteed was browser support en mobiele support. Doordat mijn portfolio website een beetje buiten de scope valt van een normale website was niet iedere browser even blij met de implementatie. Dit leidde tot enkele browser specifieke implementaties voor het afhandelen van enkele features. Mobiele support was ook lastig om te doen, aangezien ik een eigen implementatie voor het in en uit zoemen van de website moest maken. Door enkele technische problemen heeft het zoomen een uitgesteld effect.</p>

        <p>Dit project was erg leuk om te bouwen, alleen nam veel meer tijd in dat origineel geanticipeerd. Grappig genoeg kwam dit niet door het programmeren, maar voornamelijk doordat ik niet had verwacht dat het grafisch ontwerp en 3D modelling zo tijd intensief zou zijn.</p>

        <h3>Technologie</h3>
        <p>
          React, NextJS, TypeScript en webgl<br/>
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/Portfolio-next">Link</a> naar de code van het project.
        </p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2024', content, params});
}

export function ProjectJScript(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>J(oey)-Script is a small half complete runtime I wrote at the end of 2022 in Rust. The reason why I build this, was to get a better grasp on how programs are actually parsed and executed, I also used this program as an opportunity to improve my Rust skills. The runtime is based on my own interpretation of the JavaScript standard without focusing too much on the details. It uses an Esprima inspired abstract syntax tree as an internal data structure to parse the program.</p>

        <ProjectImage src="/images/project-joey-script.png" alt="Joey-script's test cases" label="J(oey)-script's test cases being run" />

        <p>Within this project, I decided to write a lot of unit tests. To capture as much unexpected behavior changes as possible, and I must say. I liked the whole experience.</p>

        <p>It is not completed due to the large amount of work that goes into a language runtime and me being contend with the knowledge I learned from this project.</p>

        <h3>Technology</h3>
        <p>
          Rust and the ECMAScript documentation<br/>
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/joey-script">Link</a> to the code of the project.
        </p>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>J(oey)-Script is een klein half afgemaakte runtime die ik heb gemaakt aan het einde van 2022. De redenen waarom ik dit project heb gemaakt was omdat ik een betere greep wouw krijgen op hoe programma’s daadwerkelijk worden geparset en uitgevoerd. Dit project was ook een goeie mogelijkheid om mijn Rust skills te verbeteren. De runtime is debaser dop mijn eigen interpretatie van de JavaScript standaard zonder een grote focus op de details. Intern wordt er een Esprima geïnspireerde abstract syntax tree gebruikt om het programma te parsen.</p>

        <ProjectImage src="/images/project-joey-script.png" alt="Joey-script's test cases" label="J(oey)-script's test cases die worden uitgevoerd" />

        <p>Binnen dit project besloot ik veel unit testen te schrijven, om zoveel mogelijk unexpected behaviour af te vangen. En ik moet zeggen, deze workflow was erg fijn om mee te werken.</p>

        <p>Dit project is niet compleet door de grote hoeveelheid werk die daadwerkelijk in een programmeertaal gaat zitten, en ik die content ben met de kennis die ik bij dit project heb opgedaan.</p>

        <h3>Technologie</h3>
        <p>
          Rust en de ECMAScript documentatie<br/>
          <a target="blank" rel="noreferrer" href="https://github.com/0xJ0EY/joey-script">Link</a> naar de code van het project.
        </p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'J-Script', content, params});
}

export function ProjectAdventOfCode(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>In December of 2022 I decided to do the Advent of Code challenges. Due to having time available because I was having my vacation, and thinking this would be a great opportunity to improve my knowledge about Rust and the software engineering problems in general. I got to day 16 before I got a headache for a few days and lost the  motivation to continue AoC.</p>

        <ProjectImage src="/images/project-advent-of-code.png" alt="Advent of Code process" label="Advent of Code progress" />

        <h3>Technology</h3>
        <p>Rust</p>
    </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>In December van 2022 besloot ik mee te doen aan de Advent of Code challenges, doordat ik tijd vrij had vanwege mijn vakantie. En ik dacht dat dit een goede mogelijkheid was om mijn kennis over Rust en software engineering problemen in het algemeen te vergroten. Ik kwam bij dag 16 tot dat ik een dag hoofdpijn kreeg en de motivatie verloor om AoC af te maken.</p>

        <ProjectImage src="/images/project-advent-of-code.png" alt="Advent of Code process" label="Advent of Code progressie" />

        <h3>Technologie</h3>
        <p>Rust</p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Advent of Code', content, params});
}

export function ProjectPortfolio2021(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>At my university were required to do two internships, to make my applications stand out a bit more I decided to make a eye-catching portfolio.</p>

        <ProjectImage src="/images/project-portfolio-2021.png" alt="Portfolio website 2021" label="A look at the portfolio website" />

        <p>I was very concerned with bundle size back then, and I decided to roll my own WebGL context to render the beam the video is played on. Let’s say I learned a lot of this project, and why my current portfolio uses Three.</p>

        <h3>Technology</h3>
        <p>
          TypeScript, Angular and webgl<br/>
          You can see the site <a rel="noreferrer" target="_blank" href="https://old.joeyderuiter.me">here</a>.
        </p>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Voor mijn opleiding moest ik twee stage plekken regelen om mijn CV uit te laten blinken besloot ik om een eye-catching portfolio te maken.</p>

        <ProjectImage src="/images/project-portfolio-2021.png" alt="Portfolio website 2021" label="Een kijkje naar de portfolio website" />

        <p>Toen der tijd was ik erg bezorgd over de bundle grote van een webgl library, dus besloot ik mijn eigen webgl implementatie te maken om de video op de balk te renderen. Van dit project heb ik veel geleerd en waarom mijn huidige portfolio Three gebruikt.</p>

        <h3>Technologie</h3>
        <p>
          TypeScript, Angular en webgl<br/>
          De website is hier te zien <a rel="noreferrer" target="_blank" href="https://old.joeyderuiter.me">here</a>.
        </p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Portfolio 2021', content, params});
}

export function ProjectTBot(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>For the final project of the robotics minor (2020) the students had to come up with their own project, and build them. We stumbled onto the idea to build a robot that would collect tennis balls of the field. Because what is more annoying then fetching the balls on the ground after a good exercise.</p>

        <h3>Technology</h3>
        <p>The robot works as follows. The robot will drive around until it finds a tennis ball via image recognition. If the robot finds a tennis ball, he will drive towards it and collect it. After that it will calculate a route to the chosen collection point to drop off the tennisball.</p>

        <video className={styles['project-video']} src="/videos/tennisbot.mp4" autoPlay muted loop disablePictureInPicture></video>

        <p>We used an already on the market Arduino shield, named the Zumo. This gave us a good fundamental to continue working on. The only change we made to the Zumo is adding a 3D printed fork, to move around the balls. For the rest of the Robot we used an Raspberry Pi and a Google Coral. This device is connected to the Zumo with a serial connection. And functions as the brain behind the robot. This means that the it runs the web GUI and does most of the calculations.</p>

        <p>To detect the current location of the robot, we used a few Bluetooth beacons. The robot knows the location of the beacons and uses RSSI to calculate the distance between each other.</p>

        <p>Almost all the software is written in C or in Python. All the software on the embedded devices (Arduino and Beacons) is written in C and the software on the Raspberry Pi is written in Python.</p>

        <h3>Team</h3>
        <ul>
          <li>- Sergi Philipsens</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Tijdens het eindproject van de minor Robotica (2020) was het de bedoeling om zelf een project te verzinnen en deze uit te werken. Wij kwamen op het idee om samen een robot te maken om tennisballen op te ruimen. Want wat is er nou vervelender dan al de ronddwalende ballen op te ruimen na een fijn uurtje tennis.</p>

        <h3>Technologie</h3>
        <p>De werking is als volgt. De robot rijdt rondjes totdat hij een tennisbal detecteert doormiddel van een machine learning algoritme. Zodra hij er eentje heeft gevonden, rijdt hij er op af en neem hem mee. Vervolgens wordt het pad naar de gekozen verzamelhoek berekend en rijdt de robot er op af met de tennisbal.</p>

        <video className={styles['project-video']} src="/videos/tennisbot.mp4" autoPlay muted loop disablePictureInPicture></video>

        <p>De technologie die hier voor is toegepast is als volgt. We hebben gebruik gemaakt van al een bestaand Arduino shield, genaamd de Zumo. Dit gaf ons een goed carrosserie om op verder te bouwen. De enigste aanpassing die wij aan de Zumo hebben toegepast is het toevoegen van een vork, om de tennisballen in mee te slepen. Voor de rest van de robot hebben we gebruik gemaakt van een Raspberry Pi met een Google Coral. Deze is gekoppeld aan de Arduino doormiddel van een seriële verbinding. En dient als het brein achter de robot, hier draait onder andere de web gui en worden de meeste berekening uitgevoerd.</p>

        <p>Voor het detecteren van de huidige locatie wordt er gebruik gemaakt van een stel Bluetooth beacons. De robot weet de locatie van de beacons, en gebruikt de RSSI naar de beacon om de afstand te gokken.</p>

        <p>Bijna alle software is geschreven in C of in Python. Alle software op de embedded devices (de Arduino en Beacons) zijn geschreven in C, en het de software die op de Raspberry Pi draait is volledig geschreven in Python.</p>

        <h3>Team</h3>
        <ul>
          <li>- Sergi Philipsens</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'T-Bot', content, params});
}

export function ProjectYoui(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>For the last group project of my second year of university (2019) I worked on a prototype Android dating app called Youi. One of the must-haves was that the app should contain the functionality to video call your dating partner. This functionality was eventually implemented with a from scratch peer-to-peer WebRTC solution.</p>

        <video className={styles['project-video']} src="/videos/youi.mp4" autoPlay muted loop disablePictureInPicture></video>

        <h3>Technology</h3>
        <p>
          Kotlin for the Android based on a MVVM structure.<br/>
          NodeJS for the Firebase cloud functions.<br/>
          WebRTC for the peer-to-peer videocall solution.
        </p>

        <h3>Team</h3>
        <ul>
          <li>- Ewout Millink</li>
          <li>- Omid Wiar</li>
          <li>- Wim de Groot</li>
          <li>- Vincent Nuis</li>
          <li>- Rutger Uijtendaal</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Tijdens het laatste groepsproject van het tweede jaar (2019) heb ik gewerkt binnen een team om een prototypen van een Android dating app te ontwikkelen. Deze app moest de functionaliteit bezitten om met je dating partner te kunnen videobellen. Om dit mogelijk te maken heb ik er voor gekozen voor een peer-to-peer oplossing doormiddel van WebRTC.</p>

        <video className={styles['project-video']} src="/videos/youi.mp4" autoPlay muted loop disablePictureInPicture></video>

        <h3>Technologie</h3>
        <p>
          Kotlin voor de Android app met een MVVM structuur.<br/>
          NodeJS voor de Firebase cloud functions.<br/>
          WebRTC het peer to peer videobellen.
        </p>

        <h3>Team</h3>
        <ul>
          <li>- Ewout Millink</li>
          <li>- Omid Wiar</li>
          <li>- Wim de Groot</li>
          <li>- Vincent Nuis</li>
          <li>- Rutger Uijtendaal</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Youi', content, params});
}

export function ProjectPCParts(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>PCParts is a webshop that I build in the third period of my second year of university (2019). In this period there was a class where you had to build your own webshop based on the technologies Angular 7 & Dropwizard.</p>

        <video className={styles['project-video']} src="/videos/pcparts.mp4" autoPlay muted loop disablePictureInPicture></video>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>PCParts is een webshop die ik heb gemaakt tijdens de derde periode van het tweede jaar (2019). Tijdens deze periode werd er een module gegeven waarbij je een webshop moest realiseren doormiddel Angular 7 en Dropwizard.</p>

        <video className={styles['project-video']} src="/videos/pcparts.mp4" autoPlay muted loop disablePictureInPicture></video>
      </div>
    )
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'PCParts', content, params});
}

export function ProjectAlbert(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>Albert is a simple accouting program designed for small to medium-sized companies. Te idea was to update the old legacy project from the project owner to a new modern web based project.</p>

        <p>This project was made by a group of 5 students, of which I was mostly involved in setting up the CI & CD pipeline. For the rest of the project I build a table class (a bit ORM like) that had the possibility of lazy loading and inline editing of the data.</p>

        <video className={styles['project-video']} src="/videos/albert.mp4" autoPlay muted loop disablePictureInPicture></video>

        <h3>Technology</h3>
        <p>Angular 7, PostgresSQL, Dropwizard and TravisCI</p>

        <h3>Team</h3>
        <ul>
          <li>- Alexander van Dam</li>
          <li>- Bashar Farah</li>
          <li>- Maarten Berden</li>
          <li>- Sander Frentz</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Albert is een simpel boekhoud programma gericht op MKB bedrijven. Het doel van dit project was om een legacy programma van de opdrachtgever om te zetten naar een modern web gebaseerd project.</p>

        <p>Dit project is gemaakt door een groep van 5 studenten, waarvan ik voornamelijk betrokken was met het opzetten van een CI & CD straat. Verder heb ik tijdens dit project gewerkt aan een tabel opzet structuur waarmee het mogelijk was om data via lazy loading in te laden.</p>

        <video className={styles['project-video']} src="/videos/albert.mp4" autoPlay muted loop disablePictureInPicture></video>

        <h3>Technologie</h3>
        <p>Angular 7, PostgresSQL, Dropwizard en TravisCI</p>

        <h3>Team</h3>
        <ul>
          <li>- Alexander van Dam</li>
          <li>- Bashar Farah</li>
          <li>- Maarten Berden</li>
          <li>- Sander Frentz</li>
          <li>- Joey de Ruiter</li>
        </ul>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Albert', content, params});
}

export function ProjectPaintboy(params: SubViewParams) {
  function RenderEnglishContent() {
    return (
      <div>
        <p>Paintboy is a game that was meant to promote my previous school the Grafisch Lyceum Rotterdam. (2016) This project was build by a team of 6. Whereof 2 programmers and 4 game artists. This game was build using Unity 5 and C#.</p>

        <video src="/videos/paintboy.mp4" autoPlay muted loop disablePictureInPicture></video>

        <p>My main work on this game was the movement of the player, the shooting mechanics and the camera shake implementation.</p>

        <h3>Technology</h3>
        <p>Unity 5 and C#</p>
      </div>
    );
  }

  function RenderDutchContent() {
    return (
      <div>
        <p>Paintboy is een game die was bedoeld om het Grafisch Lyceum Rotterdam te promoten. (2016) Dit project is gemaakt met een team van 6 personen waaronder 2 programmeurs & 4 game artists. De game is gemaakt in Unity 5 en de code is geschreven in C#.</p>

        <video src="/videos/paintboy.mp4" autoPlay muted loop disablePictureInPicture></video>

        <p>Het meeste van mijn tijd ging in de movement van de speler zitten, de schiet mechanics en de camera shake implementatie.</p>

        <h3>Technologie</h3>
        <p>Unity 5 en C#</p>
      </div>
    );
  }

  let content = params.language === 'nl' ? RenderDutchContent() : RenderEnglishContent();

  return ProjectPage({title: 'Paintboy', content, params});
}
