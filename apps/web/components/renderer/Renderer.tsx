import styles from './Renderer.module.css'
import { MutableRefObject, RefObject, useEffect, useRef, useState } from "react";
import { DepthTexture, LinearFilter, PerspectiveCamera, RGBAFormat, Scene, WebGLRenderer, WebGLRenderTarget } from "three";
import { calculateAspectRatio, disableTouchInteraction, enableTouchInteraction, isSafari } from './util';
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { CutOutRenderShaderPass } from './shaders/CutOutRenderShaderPass';
import { UpdateActions } from '../asset-loader/Loaders';
import { FXAAShaderPass } from './shaders/FXAAShaderPass';
import { CameraController } from './camera/Camera';
import { MouseInputHandler } from './camera/MouseInputHandler';
import { CameraHandler, CameraHandlerState } from './camera/CameraHandler';
import { TouchInputHandler } from './camera/TouchInputHandler';
import { TouchData, createUIEventBus, toUserInteractionTouchEvent } from '@/events/UserInteractionEvents';
import { HandleMouseProgressCircle, HandleTouchProgressCircle } from './RendererTouchUserInterface';
import { parseRequestFromChild, sendMessageToChild } from "rpc";
import { RendererUI } from './RendererUI';
import { SoundService } from './sound/SoundService';
import { BackgroundSounds } from './BackgroundSounds';

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

function getBrowserDimensions(): [number, number] {
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

function handleDesktopRequestsClosure(cameraHandler: CameraHandler) {
  return function(event: MessageEvent) {
    const request = parseRequestFromChild(event);
    if (!request.ok) { return; }
    const value = request.value;

    const context = cameraHandler.getContext();
    const controller = context.cameraController;

    switch (value.method) {
      case 'set_possible_camera_parameters_request': {

        const minZoom = controller.getMinZoom();
        const maxZoom = controller.getMaxZoom();
        const distance = value.currentZoom;

        const distanceDelta = distance - minZoom;
        const zoomDelta = maxZoom - minZoom;

        const zoomInPercentage = distanceDelta / zoomDelta;

        // TODO: Implement zoom in percentage view
      } break;
      case 'camera_zoom_distance_request': {

        const minZoom = controller.getMinZoom();
        const maxZoom = controller.getMaxZoom();
        const currentZoom = controller.getZoom();

        sendMessageToChild(event.source as Window, {
          method: 'camera_zoom_distance_response',
          max_distance: maxZoom,
          min_distance: minZoom,
          current_distance: currentZoom,
          max_horizontal_offset: 10,
          horizontal_offset: 0,
          max_vertical_offset: 10,
          vertical_offset: 0
        });

      } break;
      case 'set_camera_parameters_request': {
        const distance = value.currentZoom;

        controller.setZoom(distance);
        controller.setPanOffsetX(value.horizontalOffset);
        controller.setPanOffsetY(value.verticalOffset);

      } break;
    }
  }
}


export const Renderer = (props: RendererProps) => {
  const [cameraHandlerState, setCameraHandlerState] = useState<CameraHandlerState>(CameraHandlerState.Cinematic);
  const soundService = useRef(new SoundService());

  const cssOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const webglOutputRef: RefObject<HTMLDivElement> = useRef(null);

  const touchEvents = createUIEventBus();

  const mouseProgressCircle = HandleMouseProgressCircle(touchEvents);
  const touchProgressCircle = HandleTouchProgressCircle(touchEvents);

  let then: MutableRefObject<number | null> = useRef(null);

  function handleCameraHandlerStateChange(state: CameraHandlerState): void {
    setCameraHandlerState(state);
  }

  useEffect(() => {
    const cssRenderNode = cssOutputRef.current;
    const webglRenderNode = webglOutputRef.current;
    
    if (cssRenderNode == null || webglRenderNode == null) { return; }

    let animationFrameId: number | null = null;

    const [width, height] = getBrowserDimensions();

    const [scene, cutoutScene, cssScene] = [props.scenes.sourceScene, props.scenes.cutoutScene, props.scenes.cssScene];
    const camera = createCamera(75, calculateAspectRatio(width, height));
    const [renderer, cssRenderer] = createRenderers(width, height);

    renderer.setPixelRatio(window.devicePixelRatio);
    
    disableTouchInteraction(cssRenderNode);
    disableTouchInteraction(webglRenderNode);

    const cameraController  = new CameraController(camera, scene);
    const cameraHandler     = new CameraHandler(cameraController, webglRenderNode, touchEvents, handleCameraHandlerStateChange);
    const mouseInputHandler = new MouseInputHandler(cameraHandler);
    const touchInputHandler = new TouchInputHandler(cameraHandler);

    const handleDesktopEvent = handleDesktopRequestsClosure(cameraHandler);

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
      cameraHandler.update(deltaTime);
    }
    
    const onWindowResize = function() {
      const [width, height] = getBrowserDimensions();

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

      window.removeEventListener('resize', onWindowResize, false);
      window.removeEventListener('message', handleDesktopEvent, false);
    }

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('message', handleDesktopEvent, false);

    animate(performance.now());

    return () => onDestroy();
  }, []);
  return (
    <div className={styles.renderer}>
      <RendererUI cameraHandlerState={cameraHandlerState} soundService={soundService.current} />

      <div className={styles['css-output']} ref={cssOutputRef}></div>
      <div className={styles['webgl-output']} ref={webglOutputRef}></div>
      {mouseProgressCircle}
      {touchProgressCircle}

      <BackgroundSounds cameraHandlerState={cameraHandlerState} soundService={soundService.current} />
    </div>
  );
};
