import styles from './Renderer.module.css'
import { RefObject, useEffect, useRef } from "react";
import { BoxGeometry, Camera, DepthTexture, LinearFilter, Mesh, MeshBasicMaterial, PerspectiveCamera, RGBAFormat, Scene, WebGLRenderer, WebGLRenderTarget } from "three";
import { calculateAspectRatio } from './util';
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";

const createRenderScenes = (): [Scene, Scene, Scene] => {
  return [new Scene(), new Scene(), new Scene()];
}

const createCamera = (fov: number, aspectRatio: number): PerspectiveCamera => {
  const camera = new PerspectiveCamera(fov, aspectRatio, 0.1, 1000);

  camera.position.z = 5;

  return camera;
}

const resizeCamera = (camera: PerspectiveCamera, aspectRatio: number): void => {
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
}

const createRenderers = (width: number, height: number): [WebGLRenderer, CSS3DRenderer] => {
  const webglRenderer = new WebGLRenderer({ antialias: true, alpha: true });
  const cssRenderer = new CSS3DRenderer();

  webglRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);

  return [webglRenderer,  cssRenderer];
}

const resizeRenderers = (webGlRenderer: WebGLRenderer, cssRenderer: CSS3DRenderer, width: number, height: number): void => {
  webGlRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);
};

const createComposer = (renderer: WebGLRenderer, width: number, height: number): EffectComposer => {
  const composer = new EffectComposer(renderer, new WebGLRenderTarget(
    width,
    height, 
    { 
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthTexture: new DepthTexture(width, height)
    }));

  return composer;
}

const renderWebglContext = (composer: EffectComposer): void => {
  composer.render();
}

const renderCssContext = (scene: Scene, renderer: CSS3DRenderer, camera: PerspectiveCamera): void => {
  // The CSS renderer does 2 special things
  // 1. We scale up the scene, this is so that the dom element of the css scene will be rendered at a higher quality
  // 2. We manually update the world matrix and inverse the transformations of the css elements.
  //    This is due to safari rendering it incorrect when it is at 1, it now renders it correct, like all the other major browsers.
  camera.position.multiplyScalar(10);
  camera.matrixWorldAutoUpdate = false;
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.elements[15] = -1;

  renderer.render(scene, camera);

  camera.matrixWorldAutoUpdate = true;
  camera.position.divideScalar(10);
}

export const Renderer = () => {
  const cssOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const webglOutputRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    const cssRendererNode = cssOutputRef.current;
    const webglRenderNode = webglOutputRef.current;

    if (cssRendererNode == null || webglRenderNode == null) { return; }

    let animationFrameId: number | null = null;
    const [width, height] = [window.innerWidth, window.innerHeight]

    const [scene, cutoutScene, cssScene] = createRenderScenes();
    const camera = createCamera(75, calculateAspectRatio(width, height));
    const [renderer, cssRenderer] = createRenderers(width, height);

    const composer = createComposer(renderer, width, height);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    cssRendererNode.appendChild(cssRenderer.domElement);
    webglRenderNode.appendChild(renderer.domElement);

    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshBasicMaterial({ color: 0x00FF00 });
    const mesh = new Mesh(geo, mat);

    scene.add(mesh);

    const animate = function() {
      animationFrameId = requestAnimationFrame(animate);

      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      
      renderWebglContext(composer);
      renderCssContext(cssScene, cssRenderer, camera);
    }
    
    const onWindowResize = function() {
      const [width, height] = [window.innerWidth, window.innerHeight]

      resizeRenderers(renderer, cssRenderer, width, height);
      resizeCamera(camera, calculateAspectRatio(width, height));
    }

    const onDestroy = function() {
      if (animationFrameId) { cancelAnimationFrame(animationFrameId); }

      renderer.dispose();
      renderer.forceContextLoss();

      cssRendererNode.removeChild(cssRenderer.domElement);
      webglRenderNode.removeChild(renderer.domElement);
    }

    window.addEventListener('resize', onWindowResize, false);
    animate();

    return () => onDestroy();
  }, []);
  return (
    <div className={styles.renderer}>
      <div className={styles.cssOutput} ref={cssOutputRef}></div>
      <div className={styles.webglOutput} ref={webglOutputRef}></div>
    </div>
  );
};
