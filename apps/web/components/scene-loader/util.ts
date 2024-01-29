export function detectWebGL() {
  var canvas = document.createElement('canvas');

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  return gl && gl instanceof WebGLRenderingContext;
}
