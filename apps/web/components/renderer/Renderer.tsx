import styles from './Renderer.module.css'
import { RefObject, useEffect, useRef } from "react";
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { calculateAspectRatio } from './util';

export const Renderer = () => {
  const mountRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    const domNode = mountRef.current;
    if (!domNode) { return; }

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, calculateAspectRatio(domNode), 0.1, 1000);
    const renderer = new WebGLRenderer();

    renderer.setSize(domNode.clientWidth, domNode.clientHeight);

    mountRef.current?.appendChild(renderer.domElement);

    const geo = new BoxGeometry(1, 1, 1);
    const mat = new MeshBasicMaterial({ color: 0x00FF00 });
    const mesh = new Mesh(geo, mat);

    scene.add(mesh);
    camera.position.z = 5;

    const animate = function() {
      requestAnimationFrame(animate);

      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;

      renderer.render(scene, camera);
    }

    const onWindowResize = function() {
      camera.aspect = calculateAspectRatio(domNode);
      camera.updateProjectionMatrix();
      renderer.setSize(domNode.clientWidth, domNode.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);
    animate();

    return () => { domNode?.removeChild(renderer.domElement) };
  }, []);
  return <div className={styles.renderer} ref={mountRef}></div>;
};
