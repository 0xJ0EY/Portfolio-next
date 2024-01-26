import { useEffect } from "react";
import { SystemAPIs } from "../OperatingSystem";

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

  useEffect(() => {
    document.addEventListener('keydown', onKeyboardPress);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyboardPress);
      document.removeEventListener('pointerdown', onPointerDown);
    }
  }, []);

  return <></>
}