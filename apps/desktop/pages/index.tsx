import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { OperatingSystem } from '@/components/OperatingSystem'

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(
        'en', 
        ['common'],
        null,
        ['nl']
      )),
      // Will be passed to the page component as props
    },
  }
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Desktop app</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <OperatingSystem/>
      </main>
    </>
  )
}
