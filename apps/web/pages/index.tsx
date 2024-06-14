import Head from "next/head";
import { SceneLoader } from "../components";
import { useEffect, useState } from "react";
import { NoScriptWarning } from "@/components/noscript/NoScript";
import { Analytics } from "@vercel/analytics/react"

const focusedTitle = "Joey de Ruiter - Portfolio";
const blurredTitle = "👀 Joey de Ruiter - Portfolio";

export default function Web() {
  const [title, setTitle] = useState("Joey de Ruiter - Portfolio");

  function onVisibilityChange() {
    const title = document.visibilityState === 'visible' ? focusedTitle : blurredTitle;

    setTitle(title);
  }

  useEffect(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }

  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>

        <meta name="description" content="Portfolio website of Joey de Ruiter" />

        <meta property="og:title" content="Joey de Ruiter - Portfolio" />
        <meta property="og:description" content="Portfolio website of Joey de Ruiter" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joeyderuiter.me/assets/thumbnail.png" />
        <meta property="og:url" content="https://joeyderuiter.me/" />
        
        <meta property="twitter:image" content="https://joeyderuiter.me/assets/thumbnail.png"/>
        <meta property="twitter:card" content="summary_large_image"/>
        <meta property="twitter:title" content="Joey de Ruiter's portfolio"/>
        <meta property="twitter:description" content="Portfolio website of Joey de Ruiter"/>
        <meta property="og:site_name" content="Joey de Ruiter's portfolio"></meta>

        <link rel="icon" type="image/x-icon" href="favicon.ico" />
      </Head>
      <NoScriptWarning />
      <SceneLoader />
      <Analytics />
    </>
  );
}
