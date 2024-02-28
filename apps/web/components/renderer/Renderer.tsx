import styles from './Renderer.module.css'
import { MutableRefObject, RefObject, useEffect, useRef, useState } from "react";
import { DepthTexture, LinearFilter, PerspectiveCamera, RGBAFormat, Scene, VSMShadowMap, WebGLRenderer, WebGLRenderTarget } from "three";
import { calculateAspectRatio, disableTouchInteraction, enableTouchInteraction } from './util';
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";
import { CutOutRenderShaderPass } from './shaders/CutOutRenderShaderPass';
import { FXAAShaderPass } from './shaders/FXAAShaderPass';
import { CameraController } from './camera/Camera';
import { MouseInputHandler } from './camera/MouseInputHandler';
import { CameraHandler, CameraHandlerState } from './camera/CameraHandler';
import { TouchInputHandler } from './camera/TouchInputHandler';
import { createUIEventBus } from '@/events/UserInteractionEvents';
import { HandleMouseProgressCircle, HandleTouchProgressCircle } from './RendererTouchUserInterface';
import { parseRequestFromChild, sendMessageToChild } from "rpc";
import { RendererUI } from './RendererUI';
import { SoundService } from './sound/SoundService';
import { BackgroundSounds } from './BackgroundSounds';
import { UpdateAction } from '../scene-loader/AssetManager';
import { getBrowserDimensions, isDebug } from '../scene-loader/util';
import Stats from "three/examples/jsm/libs/stats.module";

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

function createRenderers(width: number, height: number): [WebGLRenderer, CSS3DRenderer] {
  const webglRenderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });

  webglRenderer.shadowMap.enabled = true;
  webglRenderer.shadowMap.type = VSMShadowMap;

  const cssRenderer = new CSS3DRenderer();

  webglRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);

  return [webglRenderer, cssRenderer];
}

const resizeCamera = (camera: PerspectiveCamera, aspectRatio: number): void => {
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
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
  loading: boolean,
  showMessage: boolean, 
  scenes: RendererScenes,
  actions: UpdateAction[],
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

  const { loading, showMessage, scenes, actions } = props;

  const cssOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const webglOutputRef: RefObject<HTMLDivElement> = useRef(null);

  const cameraHandlerRef = useRef<CameraHandler | null>(null);

  const allowUserInput = useRef<boolean>(false);
  const [showUI, setShowUI] = useState(false);

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

    const debug = isDebug();
    
    if (cssRenderNode == null || webglRenderNode == null) { return; }

    let animationFrameId: number | null = null;

    const stats = new Stats();
    const [width, height] = getBrowserDimensions();

    const [scene, cutoutScene, cssScene] = [scenes.sourceScene, scenes.cutoutScene, scenes.cssScene];
    const camera = createCamera(75, calculateAspectRatio(width, height));
    const [renderer, cssRenderer] = createRenderers(width, height);

    renderer.setPixelRatio(window.devicePixelRatio);
    
    disableTouchInteraction(cssRenderNode);
    disableTouchInteraction(webglRenderNode);

    const cameraController  = new CameraController(camera, scene, cutoutScene);
    const cameraHandler     = new CameraHandler(cameraController, webglRenderNode, touchEvents, handleCameraHandlerStateChange);
    const mouseInputHandler = new MouseInputHandler(allowUserInput, cameraHandler);
    const touchInputHandler = new TouchInputHandler(allowUserInput, cameraHandler);

    cameraHandlerRef.current = cameraHandler;

    const handleDesktopEvent = handleDesktopRequestsClosure(cameraHandler);

    const composer = createComposer(renderer, width, height);

    const cutoutShaderPass = new CutOutRenderShaderPass(scene, cutoutScene, camera, width, height);
    composer.addPass(cutoutShaderPass);

    const saoPass = new SAOPass(scene, camera);
    saoPass.resolution.set(128, 128);
    saoPass.params.saoBias = 100;
    saoPass.params.saoIntensity = 0.0003;
    saoPass.params.saoBlur = false;
    composer.addPass(saoPass);

    const fxaaPass = new FXAAShaderPass(width, height);
    composer.addPass(fxaaPass);

    cssRenderNode.appendChild(cssRenderer.domElement);
    webglRenderNode.appendChild(renderer.domElement);

    if (debug) {
      webglRenderNode.appendChild(stats.dom);
    }
    
    const animate = function(now: number) {
      if (then.current == null) { then.current = now; }
      const deltaTime = (now - then.current) * 0.001; // Get delta time in seconds
      then.current = now;

      animationFrameId = requestAnimationFrame(animate);
      
      if (debug) { stats.begin(); }

      for (const action of actions) {
        action(deltaTime);
      }
      
      renderWebglContext(composer);
      renderCssContext(cssScene, cssRenderer, camera);

      cameraController.update(deltaTime);
      cameraHandler.update(deltaTime);

      if (debug) { stats.end(); }
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

  useEffect(() => {
    if (!showMessage) {
      allowUserInput.current = true;
      setShowUI(true);
    }
  }, [showMessage])

  useEffect(() => {
    if (!loading) {
      cameraHandlerRef.current!.changeState(CameraHandlerState.Cinematic);
    }
  }, [loading]);

  return (
    <div className={styles.renderer}>
      { showUI && <RendererUI cameraHandlerState={cameraHandlerState} soundService={soundService.current} /> }

      <div className={styles['css-output']} ref={cssOutputRef}></div>
      <div className={styles['webgl-output']} ref={webglOutputRef}></div>
      {mouseProgressCircle}
      {touchProgressCircle}

      <BackgroundSounds cameraHandlerState={cameraHandlerState} soundService={soundService.current} />
    </div>
  );
};
