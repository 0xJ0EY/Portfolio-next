import { useEffect } from "react";
import { SystemAPIs } from "../OperatingSystem";

export function PeripheralSounds(props: { apis: SystemAPIs }) {
  const soundService = props.apis.sound;

  function onKeyboardPress(evt: KeyboardEvent) {
    const audioFragments = [
      '/sounds/keyboard1.mp3',
      '/sounds/keyboard2.mp3',
      '/sounds/keyboard3.mp3',
    ];

    const randomAudioFragment = audioFragments[Math.floor(Math.random() * audioFragments.length)];

    soundService.play(randomAudioFragment, 1);
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyboardPress);

    return () => {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  }, []);


  return <></>
}