
import {
  Camera,
  DepthTexture,
  GLSL3,
  IUniform,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  UnsignedByteType,
  UnsignedShortType,
  WebGLRenderTarget
} from 'three';
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";
import { isFirefox } from '../util';
import { CutOutShader } from "./CutOutRenderShader";

const RENDER_SAMPLES: number = 8;

export class CutOutRenderShaderPass extends Pass {
  private uniforms: {[uniform: string]: IUniform};
  private material: ShaderMaterial;
  private fsQuad: FullScreenQuad;

  private sourceScene: Scene;
  private cutoutScene: Scene;

  private sourceTarget: WebGLRenderTarget;
  private cutoutTarget: WebGLRenderTarget;
  private firefoxTarget: WebGLRenderTarget | null = null;

  private camera: Camera;

  private sourceDepthTexture: DepthTexture;
  private cutoutDepthTexture: DepthTexture;

  constructor(sourceScene: Scene, cutoutScene: Scene, camera: Camera, width: number, height: number) {
    super();

    const shader = CutOutShader;

    this.sourceScene = sourceScene;
    this.cutoutScene = cutoutScene;
    this.camera = camera;

    if (isFirefox()) {
      // Firefox or Three js has a bug within the webgl2 that makes it impossible to render to a target with multiple samples and a depthTexture attached.
      // So now for Firefox we do the following:
      // 1. Render the scene to a target with multiple samples without a depth buffer attached for MSAA
      // 2. Render the scene once to a target with a depth buffer attached (so we have the depth information)
      // 3. Render the cutout shader, without multiple samples
      // 4. Do normal composition
      this.sourceDepthTexture = new DepthTexture(width, height, UnsignedByteType);
      this.sourceTarget = new WebGLRenderTarget(width, height, {
        depthBuffer: true, 
        samples: RENDER_SAMPLES
      });

      this.firefoxTarget = new WebGLRenderTarget(width, height, {
        depthBuffer: true, 
        depthTexture: this.sourceDepthTexture,
        samples: 0
      });

      this.cutoutDepthTexture = new DepthTexture(width, height, UnsignedShortType);
      this.cutoutTarget = new WebGLRenderTarget(width, height, {
        depthBuffer: true,
        depthTexture: this.cutoutDepthTexture,
        samples: 0
      });

    } else {
      // For Chrome, Safari, etc we can use the following:
      // 1. Render the scene to a target with multiple samples with a depth buffer attached for MSAA
      // 2. Render the cutout shader with multiple samples
      // 3. Do normal composition
      this.sourceDepthTexture = new DepthTexture(width, height, UnsignedByteType);
      this.sourceTarget = new WebGLRenderTarget(width, height, {
        depthBuffer: true,
        depthTexture: this.sourceDepthTexture, 
        samples: RENDER_SAMPLES
      });

      this.cutoutDepthTexture = new DepthTexture(width, height, UnsignedShortType);
      this.cutoutTarget = new WebGLRenderTarget(width, height, {
        depthBuffer: true,
        depthTexture: this.cutoutDepthTexture,
        samples: RENDER_SAMPLES
      });
    }
    
    this.uniforms = UniformsUtils.clone(shader.uniforms);

    this.material = new ShaderMaterial( {
      defines: {},
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      glslVersion: GLSL3
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer: any, writeBuffer: any, readBuffer: any /*, deltaTime, maskActive */ ) {
    // Render the source output to the sourceTarget buffer
    renderer.setRenderTarget(this.sourceTarget);
    renderer.render(this.sourceScene, this.camera);

    if (isFirefox()) {
      renderer.setRenderTarget(this.firefoxTarget);
      renderer.render(this.sourceScene, this.camera);
    }

    // Render the cutout output to the cutoutTarget buffer
    renderer.setRenderTarget(this.cutoutTarget);
    renderer.render(this.cutoutScene, this.camera);
    
    // Bind the render outputs to each other
    this.uniforms['sourceTexture'].value  = this.sourceTarget.texture;
    this.uniforms['sourceDepthMap'].value = this.sourceDepthTexture;
    this.uniforms['cutoutDepthMap'].value = this.cutoutDepthTexture;

    this.fsQuad.material = this.material;
    
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);

    } else {
      renderer.setRenderTarget(writeBuffer);

      // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    }

    // Render the fullscreen quad with a composition of the sourceTexture and cutout
    this.fsQuad.render(renderer);
  }

  setSize(width: number, height: number) {
    // TODO: Check if we need to recreate the depth buffers with the correct size, or if this is fine.
    this.sourceTarget.setSize(width, height);
    this.cutoutTarget.setSize(width, height);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}