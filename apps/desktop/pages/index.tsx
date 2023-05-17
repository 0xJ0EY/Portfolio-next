import Head from 'next/head'
import styles from '@/styles/Home.module.css'

export default function Home() {
  return (
    <>
      <Head>
        <title>Desktop app</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <img src="http://localhost:8080/waifu"></img>
      </main>
    </>
  )
}
