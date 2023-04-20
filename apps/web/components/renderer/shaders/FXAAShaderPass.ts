import { Pass } from "three/examples/jsm/postprocessing/Pass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

export class FXAAShaderPass extends ShaderPass {


  private updateUniformResolution(width: number, height: number) {
    const pixelRatio = window.devicePixelRatio;
    
    this.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
    this.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
  }

  constructor(width: number, height: number) {
    super(FXAAShader);

    this.updateUniformResolution(width, height);
  }

  setSize(width: number, height: number) {
    this.updateUniformResolution(width, height);
  }
}