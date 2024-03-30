import { useEffect, useRef } from "react";
import { SystemAPIs } from "../OperatingSystem";
import { isSafari } from "../util";

type AudioFragment = {
  onDown?: string,
  onUp?: string,
}

const PointerPrimaryKey = "pointer_primary";
const PointerSecondaryKey = "pointer_secondary";

const PrimaryMouseButton = 0x00;

const SpaceBarKeyAudioFragments: AudioFragment[] = [
  { onDown: '/sounds/space_down_1.mp3', onUp: '/sounds/space_up_1.mp3' },
  { onDown: '/sounds/space_down_2.mp3', onUp: '/sounds/space_up_2.mp3' },
  { onDown: '/sounds/space_down_3.mp3', onUp: '/sounds/space_up_3.mp3' },
];

const ShiftKeyAudioFragments: AudioFragment[] = [
  { onDown: '/sounds/shift_down.mp3', onUp: '/sounds/shift_up.mp3' },
];

const RegularKeyAudioFragments: AudioFragment[] = [
  { onDown: '/sounds/key_down_1.mp3' },
  { onDown: '/sounds/key_down_2.mp3' },
];

const LeftMouseButtonAudioFragments: AudioFragment[] = [
  { onDown: '/sounds/left_mouse_down_1.mp3', onUp: '/sounds/left_mouse_up_1.mp3' },
  { onDown: '/sounds/left_mouse_down_2.mp3', onUp: '/sounds/left_mouse_up_2.mp3' },
  { onDown: '/sounds/left_mouse_down_3.mp3', onUp: '/sounds/left_mouse_up_3.mp3' },
];

const RightMouseButtonAudioFragments: AudioFragment[] = [
  { onDown: '/sounds/right_mouse_down_1.mp3', onUp: '/sounds/right_mouse_up_1.mp3' },
  { onDown: '/sounds/right_mouse_down_2.mp3', onUp: '/sounds/right_mouse_up_2.mp3' },
  { onDown: '/sounds/right_mouse_down_3.mp3', onUp: '/sounds/right_mouse_up_3.mp3' },
];

function chooseRandomAudioFragment(fragments: AudioFragment[]): AudioFragment {
  return fragments[Math.floor(Math.random() * fragments.length)];
}

function chooseRandomKeyboardAudioFragment(code: string): AudioFragment {
  switch (code) {
    case "Space": return chooseRandomAudioFragment(SpaceBarKeyAudioFragments);
    case "ShiftLeft":
    case "ShiftRight":
      return chooseRandomAudioFragment(ShiftKeyAudioFragments);
    default: return chooseRandomAudioFragment(RegularKeyAudioFragments);
  }
}

export function PeripheralSounds(props: { apis: SystemAPIs }) {
  const soundService = props.apis.sound;

  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const activeSounds = useRef<Record<string, AudioFragment>>({});

  function fetchAudioFragmentFromCacheOrCreate(source: string): HTMLAudioElement {
    const cacheEntry = audioCache.current[source];
    if (cacheEntry) { return cacheEntry; }

    const audioFragment = new Audio(source);
    audioCache.current[source] = audioFragment;

    return audioFragment;
  }

  function onKeyDown(evt: KeyboardEvent) {
    if (evt.repeat) { return; }

    const code = evt.code;

    if (['VolumeUp', 'VolumeDown'].includes(code)) { return; }

    activeSounds.current[code] = chooseRandomKeyboardAudioFragment(code);

    const audioSource = activeSounds.current[code].onDown;

    if (audioSource) {
      const audioFragment = fetchAudioFragmentFromCacheOrCreate(audioSource);
      soundService.playAudioFragment(audioFragment, 0.6);
    }
  }

  function onKeyUp(evt: KeyboardEvent) {
    if (evt.repeat) { return; }
    
    const code = evt.code;

    if (!activeSounds.current[code]) { return; }

    const audioSource = activeSounds.current[code].onUp;

    if (audioSource) {
      const audioFragment = fetchAudioFragmentFromCacheOrCreate(audioSource);
      soundService.playAudioFragment(audioFragment, 0.6);
    }
  }

  function onPointerDown(evt: PointerEvent) {
    const key = evt.button === PrimaryMouseButton ? PointerPrimaryKey : PointerSecondaryKey;
    const fragments = evt.button === PrimaryMouseButton ? LeftMouseButtonAudioFragments : RightMouseButtonAudioFragments;

    activeSounds.current[key] = chooseRandomAudioFragment(fragments);
    const audioSource = activeSounds.current[key].onDown;

    if (audioSource) {
      const audioFragment = fetchAudioFragmentFromCacheOrCreate(audioSource);
      soundService.playAudioFragment(audioFragment, 1.0);
    }
  }

  function onPointerUp(evt: PointerEvent) {
    const key = evt.button === PrimaryMouseButton ? PointerPrimaryKey : PointerSecondaryKey;

    if (!activeSounds.current[key]) { return; }

    const audioSource = activeSounds.current[key].onUp;
    if (audioSource) {
      const audioFragment = fetchAudioFragmentFromCacheOrCreate(audioSource);
      soundService.playAudioFragment(audioFragment, 1.0);
    }
  }

  useEffect(() => {
    // Safari audio is very delayed compared to other browsers, I don't know why (possibly a browser implementation)
    // So for this reason I will disable it by default
    if (isSafari()) { return; }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    }
  }, []);

  return <></>
}
