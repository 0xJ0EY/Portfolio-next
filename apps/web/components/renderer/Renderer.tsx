import styles from './Renderer.module.css'
import { MutableRefObject, RefObject, useEffect, useRef } from "react";
import { DepthTexture, LinearFilter, PerspectiveCamera, RGBAFormat, Scene, WebGLRenderer, WebGLRenderTarget } from "three";
import { calculateAspectRatio, disableTouchInteraction, enableTouchInteraction } from './util';
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { CutOutRenderShaderPass } from './shaders/CutOutRenderShaderPass';
import { UpdateActions } from '../asset-loader/Loaders';
import { FXAAShaderPass } from './shaders/FXAAShaderPass';
import { CameraController } from './camera/Camera';
import { MouseInputHandler } from './camera/MouseInputHandler';
import { CameraHandler } from './camera/CameraHandler';
import { TouchInputHandler } from './camera/TouchInputHandler';
import { createUIEventBus } from '@/events/UserInteractionEvents';
import { RendererTouchUserInterface } from './RendererTouchUserInterface';

export interface RendererScenes {
  sourceScene: Scene,
  cutoutScene: Scene,
  cssScene: Scene
};

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

const resizeRenderers = (composer: EffectComposer, webGlRenderer: WebGLRenderer, cssRenderer: CSS3DRenderer, width: number, height: number): void => {
  composer.setSize(width, height);
  webGlRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);
};

const createComposerTarget = (renderer: WebGLRenderer, width: number, height: number): WebGLRenderTarget => {
  const target = new WebGLRenderTarget(
    width,
    height, 
    { 
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthTexture: new DepthTexture(width, height)
    }
  );

  return target;
}

const createComposer = (renderer: WebGLRenderer, width: number, height: number): EffectComposer => {
  const composer = new EffectComposer(renderer, createComposerTarget(renderer, width, height));

  return composer;
}

const renderWebglContext = (composer: EffectComposer): void => {
  composer.render();
}

const renderCssContext = (scene: Scene, renderer: CSS3DRenderer, camera: PerspectiveCamera): void => {
  // The CSS renderer does something special to fix the rendering for Safari
  // We manually update the world matrix and inverse the transformations of the css elements.
  // This is due to safari rendering it incorrect when it is at 1, it now renders it correct, like all the other major browsers.
  camera.matrixWorldAutoUpdate = false;
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.elements[15] = -1;

  renderer.render(scene, camera);

  camera.matrixWorldAutoUpdate = true;
}

interface RendererProps {
  scenes: RendererScenes,
  actions: UpdateActions
}

export const Renderer = (props: RendererProps) => {
  const cssOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const webglOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const touchEvents = createUIEventBus();

  const touchUserInterface = RendererTouchUserInterface(touchEvents);

  let then: MutableRefObject<number | null> = useRef(null);

  useEffect(() => {
    const cssRenderNode = cssOutputRef.current;
    const webglRenderNode = webglOutputRef.current;

    if (cssRenderNode == null || webglRenderNode == null) { return; }

    let animationFrameId: number | null = null;
    const [width, height] = [window.innerWidth, window.innerHeight];

    const [scene, cutoutScene, cssScene] = [props.scenes.sourceScene, props.scenes.cutoutScene, props.scenes.cssScene];
    const camera = createCamera(75, calculateAspectRatio(width, height));
    const [renderer, cssRenderer] = createRenderers(width, height);

    renderer.setPixelRatio(window.devicePixelRatio);
    
    disableTouchInteraction(cssRenderNode);
    disableTouchInteraction(webglRenderNode);

    const cameraController  = new CameraController(camera, scene);
    const cameraHandler     = new CameraHandler(cameraController, webglRenderNode, touchEvents);
    const mouseInputHandler = new MouseInputHandler(cameraHandler);
    const touchInputHandler = new TouchInputHandler(cameraHandler);

    const composer = createComposer(renderer, width, height);

    const cutoutShaderPass = new CutOutRenderShaderPass(scene, cutoutScene, camera, width, height);
    composer.addPass(cutoutShaderPass);

    const fxaaPass = new FXAAShaderPass(width, height);
    composer.addPass(fxaaPass);

    cssRenderNode.appendChild(cssRenderer.domElement);
    webglRenderNode.appendChild(renderer.domElement);

    const animate = function(now: number) {
      if (then.current == null) { then.current = now; }
      const deltaTime = (now - then.current) * 0.001; // Get delta time in seconds
      then.current = now;

      animationFrameId = requestAnimationFrame(animate);

      for (const action of props.actions) {
        action(deltaTime);
      }
      
      renderWebglContext(composer);
      renderCssContext(cssScene, cssRenderer, camera);

      cameraController.update(deltaTime);
    }
    
    const onWindowResize = function() {
      const [width, height] = [window.innerWidth, window.innerHeight];

      resizeRenderers(composer, renderer, cssRenderer, width, height);
      resizeCamera(camera, calculateAspectRatio(width, height));
    }

    const onDestroy = function() {
      if (animationFrameId) { cancelAnimationFrame(animationFrameId); }

      enableTouchInteraction(cssRenderNode);
      enableTouchInteraction(webglRenderNode);

      renderer.dispose();
      renderer.forceContextLoss();

      mouseInputHandler.destroy();
      touchInputHandler.destroy();

      cameraHandler.destroy();

      cssRenderNode.removeChild(cssRenderer.domElement);
      webglRenderNode.removeChild(renderer.domElement);
    }

    window.addEventListener('resize', onWindowResize, false);
    animate(performance.now());

    return () => onDestroy();
  }, []);
  return (
    <div className={styles.renderer}>
      <div className={styles.cssOutput} ref={cssOutputRef}></div>
      <div className={styles.webglOutput} ref={webglOutputRef}></div>
      {touchUserInterface}
    </div>
  );
};
