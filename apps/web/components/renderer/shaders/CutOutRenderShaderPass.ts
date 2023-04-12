
import {
	Camera,
	DepthTexture,
	IUniform,
	Scene,
	ShaderMaterial,
	UniformsUtils,
	UnsignedShortType,
	WebGLRenderTarget
} from 'three';
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";
import { CutOutShader } from "./CutOutRenderShader";

export class CutOutRenderShaderPass extends Pass {
  private uniforms: {[uniform: string]: IUniform};
  private material: ShaderMaterial;
  private fsQuad: FullScreenQuad;

	private sourceScene: Scene;
	private cutoutScene: Scene;

	private sourceTarget: WebGLRenderTarget;
	private cutoutTarget: WebGLRenderTarget;

	private camera: Camera;

	private sourceDepthTexture: DepthTexture;
	private cutoutDepthTexture: DepthTexture;

	constructor(sourceScene: Scene, cutoutScene: Scene, camera: Camera, width: number, height: number) {
		super();

		const shader = CutOutShader;

		this.sourceScene = sourceScene;
		this.cutoutScene = cutoutScene;
		this.camera = camera;

		this.sourceDepthTexture = new DepthTexture(width, height, UnsignedShortType);
		this.sourceTarget = new WebGLRenderTarget(width, height, {depthBuffer: true, depthTexture: this.sourceDepthTexture});

		this.cutoutDepthTexture = new DepthTexture(width, height, UnsignedShortType);
		this.cutoutTarget = new WebGLRenderTarget(width, height, {depthBuffer: true, depthTexture: this.cutoutDepthTexture});

		this.uniforms = UniformsUtils.clone(shader.uniforms);

		this.material = new ShaderMaterial( {
			defines: {},
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
		});

		this.fsQuad = new FullScreenQuad(this.material);
	}

	render(renderer: any, writeBuffer: any, readBuffer: any /*, deltaTime, maskActive */ ) {
    // Render the source output to the sourceTarget buffer
		renderer.setRenderTarget(this.sourceTarget);
		renderer.render(this.sourceScene, this.camera);
		

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