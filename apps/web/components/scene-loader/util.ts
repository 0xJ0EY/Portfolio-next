import { isSafari } from "../renderer/util";

export function detectWebGL() {
  var canvas = document.createElement('canvas');

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  return gl && gl instanceof WebGLRenderingContext;
}

export function isDebug(): boolean {
  const query = window.location.search;
  const searchParams = new URLSearchParams(query);

  return searchParams.has('debug');
}

export function isMobileDevice(): boolean {
  return window.innerWidth < 500;
}

export function getBrowserDimensions(): [number, number] {
  let width = window.innerWidth;
  let height = window.innerHeight;

  if (isSafari()) {
    // Safari on iOS (tested on only the physical iPhone 11 pro, and 14 pro in the simulator) renders off-center when a width/height is given that is not even.
    // Desktop Safari & iPad OS seems fine
    if (width & 0x01) { width++; }
    if (height & 0x01) { height++; }
  }

  return [width, height];
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
