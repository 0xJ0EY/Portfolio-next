import styles from './Renderer.module.css'
import { RefObject, useEffect, useRef } from "react";
import { BoxGeometry, Camera, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { calculateAspectRatio } from './util';
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";

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
  const webglRenderer = new WebGLRenderer();
  const cssRenderer = new CSS3DRenderer();

  webglRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);

  return [webglRenderer,  cssRenderer];
}

const resizeRenderers = (webGlRenderer: WebGLRenderer, cssRenderer: CSS3DRenderer, width: number, height: number): void => {
  webGlRenderer.setSize(width, height);
  cssRenderer.setSize(width, height);
};

export const Renderer = () => {
  const mountRef: RefObject<HTMLDivElement> = useRef(null);
  const cssOutputRef: RefObject<HTMLDivElement> = useRef(null);
  const webglOutputRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    const domNode = mountRef.current;
    const cssRendererNode = cssOutputRef.current;
    const webglRenderNode = webglOutputRef.current;

    if (!domNode) { return; }

    let animationFrameId: number | null = null;

    const [scene, cutoutScene, cssScene] = createRenderScenes();
    const camera = createCamera(75, calculateAspectRatio(domNode));
    const [renderer, cssRenderer] = createRenderers(domNode.clientWidth, domNode.clientHeight);

    cssRendererNode?.appendChild(cssRenderer.domElement);
    webglRenderNode?.appendChild(renderer.domElement);

    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshBasicMaterial({ color: 0x00FF00 });
    const mesh = new Mesh(geo, mat);

    scene.add(mesh);

    const animate = function() {
      animationFrameId = requestAnimationFrame(animate);

      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;

      renderer.render(scene, camera);
    }
    
    const onWindowResize = function() {
      resizeCamera(camera, calculateAspectRatio(domNode));
      resizeRenderers(renderer, cssRenderer, domNode.clientWidth, domNode.clientHeight);
    }

    const onDestroy = function() {
      if (animationFrameId) { cancelAnimationFrame(animationFrameId); }

      renderer.dispose();
      renderer.forceContextLoss();

      cssRendererNode?.removeChild(cssRenderer.domElement);
      webglRenderNode?.removeChild(renderer.domElement);
    }

    window.addEventListener('resize', onWindowResize, false);
    animate();

    return () => onDestroy();
  }, []);
  return (
    <div className={styles.renderer} ref={mountRef}>
      <div className={styles.cssOutput} ref={cssOutputRef}></div>
      <div className={styles.webglOutput} ref={webglOutputRef}></div>
    </div>
  );
};
