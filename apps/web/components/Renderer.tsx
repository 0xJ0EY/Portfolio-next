import { RefObject, useEffect, useRef } from "react";
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";

export const Renderer = () => {
  const mountRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);

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
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);
    animate();

    return () => { mountRef.current?.removeChild(renderer.domElement) };
  }, []);
  return <div ref={mountRef}></div>;
};
