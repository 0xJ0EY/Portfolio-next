import { useEffect } from "react";
import { SystemAPIs } from "../OperatingSystem";

export function PeripheralSounds(props: { apis: SystemAPIs }) {
  const soundService = props.apis.sound;

  function onKeyboardPress() {
    soundService.play('/sounds/meow.mp3', 0.5 * Math.random());
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyboardPress);

    return () => {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  }, []);


  return <></>
}