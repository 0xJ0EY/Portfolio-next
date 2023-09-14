import { useEffect, useState } from 'react';
import styles from './MenuBar.module.css';
import { ApplicationManager, ApplicationManagerEvent, MenuEntries, MenuItem } from '@/applications/ApplicationManager';
import { minimumDigits } from './util';
import { useTranslation, I18n, TFunction } from 'next-i18next';

function renderApplicationMenu(menuItems: MenuEntries | null) {
  if (!menuItems) { return <>Loading</> };

  return <>{menuItems.displayName}</>
}

function renderDate(date: Date, t: TFunction) {
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

function renderClock(date: Date) { 
  const hours = minimumDigits(date.getHours(), 2);
  const minutes = minimumDigits(date.getMinutes(), 2);
  
  const time = `${hours}:${minutes}`

  return <>{time}</>
}

function languageSelection(t: TFunction, i18n: I18n) {
  function changeLanguage(language: string) {
    i18n.changeLanguage(language);
  }

  return (
    <div className={styles.menu}>
      <div className={styles.menuEntry} tabIndex={0}>
        <span>{i18n.language.toLowerCase()}</span>
        <div className={styles.menuContent}>
          <button onClick={() => changeLanguage('en')}>{t('language.tags.en')} - {t('language.english')}</button>
          <button onClick={() => changeLanguage('nl')}>{t('language.tags.nl')} - {t('language.dutch')}</button>
        </div>
      </div>
    </div>
  );
}

type MenuBarProps = {
  manager: ApplicationManager
}

export const MenuBar = (props: MenuBarProps) => {
  const { t, i18n } = useTranslation('common');
  const { manager } = props;

  const [appMenuEntries, setAppMenuEntries] = useState<MenuEntries | null>(null);
  const [date, setDate] = useState(new Date());

  function handleApplicationManagerEvent(event: ApplicationManagerEvent) {
    if (event.kind !== 'focus') { return; }

    setAppMenuEntries(event.application.menuEntries());
  }

  function changeLang() {
    if (i18n.language === 'en') {
      i18n.changeLanguage('nl');
    } else {
      i18n.changeLanguage('en');
    }
  }

  useEffect(() => {
    const unsubscribe = manager.subscribe(handleApplicationManagerEvent);
    const interval = setInterval(() => setDate(new Date()), 1000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);  

  return <>
    <div className={styles.menuBar}>
      <div className={styles.appEntries}>
        { renderApplicationMenu(appMenuEntries) }
      </div>
      <div className={styles.utility}>
        {languageSelection(t, i18n)}
        <div className={styles.date} data-locale={i18n.language}>
          { renderDate(date, t) }
          &nbsp;
          { renderClock(date) }
        </div>
      </div>
    </div>
  </>
}
