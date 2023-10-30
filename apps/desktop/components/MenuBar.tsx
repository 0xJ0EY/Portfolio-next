import { useEffect, useState } from 'react';
import styles from './MenuBar.module.css';
import { ApplicationManager, ApplicationManagerEvent, MenuEntry, MenuItem } from '@/applications/ApplicationManager';
import { minimumDigits } from './util';
import { useTranslation, I18n, TFunction } from 'next-i18next';
import React from 'react';

function renderApplicationMenu(menuItems: MenuEntry[]) {
  if (menuItems.length === 0) { return <>Loading</> };

  return menuItems.map((x, i) => <React.Fragment key={i}>{renderMenu(x)}</React.Fragment>);
}

function renderMenu(menuEntries: MenuEntry) {
  function renderMenuItem(item: MenuItem) {
    switch (item.kind) {
      case 'action':
        return <button onPointerDown={() => item.action()}>{item.value}</button>
      case 'spacer':
        return <hr/>
    }
  }

  const menuItems = menuEntries.items.map((x, i) => <React.Fragment key={i}>{renderMenuItem(x)}</React.Fragment>)
  const menuItemsContainer = menuItems.length > 0 ? <div className={styles.menuContent}>{menuItems}</div> : <></>;

  return (
    <div className={styles.menu}>
      <div className={styles.menuEntry} tabIndex={0}>
        {menuEntries.displayOptions.boldText ? <b>{menuEntries.name}</b> : <span>{menuEntries.name}</span>}
        {menuItemsContainer}
      </div>
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

  return renderMenu(entry);
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
