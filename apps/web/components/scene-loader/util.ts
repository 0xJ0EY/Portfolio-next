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
