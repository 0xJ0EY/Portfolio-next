import { useEffect, useRef } from "react";
import { SystemAPIs } from "../OperatingSystem";

type AudioFragment = {
  onDown?: string,
  onUp?: string,
}

const PointerPrimaryKey = "pointer_primary";
const PointerSecondaryKey = "pointer_secondary";

const PrimaryMouseButton = 0x00;

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

export function PeripheralSounds(props: { apis: SystemAPIs }) {
  const soundService = props.apis.sound;
  const activeSounds = useRef<Record<string, AudioFragment>>({});

  function onPointerDown(evt: PointerEvent) {
    const key = evt.button === PrimaryMouseButton ? PointerPrimaryKey : PointerSecondaryKey;
    const fragments = evt.button === PrimaryMouseButton ? LeftMouseButtonAudioFragments : RightMouseButtonAudioFragments;

    activeSounds.current[key] = chooseRandomAudioFragment(fragments);
    const audioFragment = activeSounds.current[key].onDown;
    

    if (audioFragment) { soundService.play(audioFragment, 1.0); }
  }

  function onPointerUp(evt: PointerEvent) {
    const key = evt.button === PrimaryMouseButton ? PointerPrimaryKey : PointerSecondaryKey;

    const audioFragment = activeSounds.current[key].onUp;
    if (audioFragment) { soundService.play(audioFragment, 1.0); }
  }

  useEffect(() => {
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    }
  }, []);

  return <></>
}

/*
export function PeripheralSounds(props: { apis: SystemAPIs }) {
  const soundService = props.apis.sound;

  function onBackspaceOrEnterKeyboardPress(): string {
    const audioFragments = [
      '/sounds/keyboard_long_key_1.mp3',
      '/sounds/keyboard_long_key_2.mp3',
    ];

    return audioFragments[Math.floor(Math.random() * audioFragments.length)];
  }

  function onSpaceBarKeyboardPress(): string {
    const audioFragments = [
      '/sounds/keyboard_space_bar_1.mp3',
      '/sounds/keyboard_space_bar_2.mp3',
      '/sounds/keyboard_space_bar_3.mp3',
    ];

    return audioFragments[Math.floor(Math.random() * audioFragments.length)];
  }

  function onNormalKeyboardPress(): string {
    const audioFragments = [
      '/sounds/keyboard_1.mp3',
      '/sounds/keyboard_2.mp3',
      '/sounds/keyboard_3.mp3',
    ];

    return audioFragments[Math.floor(Math.random() * audioFragments.length)];
  }

  function onKeyboardPress(evt: KeyboardEvent) {
    let audioFragment: string | null = null;

    switch (evt.code) {
      case "Enter":
      case "Backspace":
      case "ShiftLeft":
      case "ShiftRight":
        audioFragment = onBackspaceOrEnterKeyboardPress();
        break;
      case "Space":
        audioFragment = onSpaceBarKeyboardPress();
        break;
      default:
        audioFragment = onNormalKeyboardPress();
    }

    soundService.play(audioFragment, 0.6);
  }

  function playLeftMouseClickSound() {
    const audioFragments = [
      '/sounds/left_mouse_1.mp3',
      '/sounds/left_mouse_2.mp3',
      '/sounds/left_mouse_3.mp3',
    ];

    const audioFragment = audioFragments[Math.floor(Math.random() * audioFragments.length)];
    soundService.play(audioFragment, 1);
  }

  function playRightMouseClickSound() {
    const audioFragments = [
      '/sounds/right_mouse_1.mp3',
      '/sounds/right_mouse_2.mp3',
    ];

    const audioFragment = audioFragments[Math.floor(Math.random() * audioFragments.length)];
    soundService.play(audioFragment, 1);
  }

  function onPointerDown(evt: PointerEvent) {
    if (evt.isPrimary) {
      playLeftMouseClickSound();
    } else {
      playRightMouseClickSound();
    }
  }

  function onPointerUp(evt: PointerEvent) {

  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyboardPress);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      document.removeEventListener('keydown', onKeyboardPress);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    }
  }, []);

  return <></>
}
*/