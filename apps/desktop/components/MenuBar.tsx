import { useEffect, useRef, useState } from 'react';
import styles from './MenuBar.module.css';
import { ApplicationManager, ApplicationManagerEvent, MenuEntry, MenuItem } from '@/applications/ApplicationManager';
import { minimumDigits } from './util';
import { useTranslation, I18n, TFunction } from 'next-i18next';
import React from 'react';

function renderApplicationMenu(menuItems: MenuEntry[]) {  
  let items = menuItems;

  if (items.length === 0) {
    items.push({
      displayOptions: {},
      name: 'Loading',
      items: []
    });
  }

  return items.map((x, i) => <React.Fragment key={i}>{RenderMenu(x)}</React.Fragment>);
}

function RenderMenu(menuEntries: MenuEntry) {
  const ref = useRef(null);
  const [isOpen, setOpen] = useState<boolean>(false);

  function renderMenuItem(item: MenuItem) {
    switch (item.kind) {
      case 'action':
        const menuAction = () => {
          item.action();
          setOpen(false);
        }

        return <button className='system-button' onClick={menuAction}>{item.value}</button>
      case 'spacer':
        return <hr/>
    }
  }

  function onClickMenuTitle() {
    if (!ref.current) { return; }
    if (isOpen) { return; }

    const head = ref.current;
    const handleClickAfterOpeningMenu = (evt: PointerEvent)  => onClickAfterOpeningMenu(evt, head);

    function onClickAfterOpeningMenu(evt: PointerEvent, head: HTMLElement) { 
      function isClickInMenu(evt: PointerEvent, head: HTMLElement): boolean {
        let current: HTMLElement | null = evt.target as HTMLElement;
  
        while (current !== null) {
          if (current === head) { return true; }
  
          current = current.parentElement;
        }
  
        return false;
      }
      
      if (isClickInMenu(evt, head)) { return; }
  
      setOpen(false);
      window.removeEventListener('pointerdown', handleClickAfterOpeningMenu);
    }

    setOpen(true);
    window.addEventListener('pointerdown', handleClickAfterOpeningMenu);
  }
  
  const menuItems = menuEntries.items.map((x, i) => <React.Fragment key={i}>{renderMenuItem(x)}</React.Fragment>)
  const menuItemsContainer = menuItems.length > 0 ? <div className={styles.menuContent}>{menuItems}</div> : <></>;

  return (
    <div ref={ref} className={styles.menuEntry}>
      <button className='system-button' onClick={onClickMenuTitle}>{menuEntries.displayOptions.boldText ? <b>{menuEntries.name}</b> : <span>{menuEntries.name}</span>}</button>
      {isOpen && menuItemsContainer}
    </div>
  )
}

function renderDate(date: Date | undefined, t: TFunction) {
  if (date === undefined) { return <></>};

  const weekday = t(`date.weekdays_short.${date.getDay()}`);
  const day     = date.getDate().toString();
  const month   = t(`date.months_short.${date.getMonth()}`);

  return (
    <>
      <span className={styles.weekday}>{weekday}</span>
      &nbsp;
      <span className={styles.day}>{day}</span>
      &nbsp;
      <span className={styles.month}>{month}</span>
    </>
  )
}

function renderClock(date: Date | undefined) {
  if (date === undefined) { return <></>};

  const hours = minimumDigits(date.getHours(), 2);
  const minutes = minimumDigits(date.getMinutes(), 2);
  
  const time = `${hours}:${minutes}`

  return <>{time}</>
}

function languageSelection(t: TFunction, i18n: I18n) {
  function changeLanguage(language: string) {
    i18n.changeLanguage(language);
  }

  const englishEntry  = `${t('language.tags.en')} - ${t('language.english')}`;
  const dutchEntry    = `${t('language.tags.nl')} - ${t('language.dutch')}`;

  let entry: MenuEntry = {
    displayOptions: {},
    name: i18n.language.toLowerCase(),
    items: [
      { kind: 'action', value: englishEntry, action: () => changeLanguage('en')},
      { kind: 'action', value: dutchEntry, action: () => changeLanguage('nl')}
    ]
  }

  return RenderMenu(entry);
}

type MenuBarProps = {
  manager: ApplicationManager
}

const DateAndTime = () => {
  const { t, i18n } = useTranslation('common');
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    setDate(new Date());
    const interval = setInterval(() => setDate(new Date()), 1000);

    return () => {
      clearInterval(interval);
    }
  }, []);

  return (
    <div className={styles.date} data-locale={i18n.language}>
      { renderDate(date, t) }
      &nbsp;
      { renderClock(date) }
    </div>
  )
}

export const MenuBar = (props: MenuBarProps) => {
  const { t, i18n } = useTranslation('common');
  const { manager } = props;

  const [appMenuEntries, setAppMenuEntries] = useState<MenuEntry[]>([]);

  function handleApplicationManagerEvent(event: ApplicationManagerEvent) {
    if (event.kind !== 'focus') { return; }

    setAppMenuEntries(event.application.menuEntries());
  }

  useEffect(() => {
    const unsubscribe = manager.subscribe(handleApplicationManagerEvent);
    
    return () => {
      setAppMenuEntries([]);
      unsubscribe();
    };
  }, []);

  return <>
    <div className={styles.menuBar}>
      <div className={styles.appEntries}>
        { renderApplicationMenu(appMenuEntries) }
      </div>
      <div className={styles.spacer}></div>
      <div className={styles.utility}>
        {languageSelection(t, i18n)}
        <DateAndTime/>
      </div>
    </div>
  </>
}
