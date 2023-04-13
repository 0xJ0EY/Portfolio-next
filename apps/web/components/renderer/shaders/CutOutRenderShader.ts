import VertexShader from './CutOutRenderShader.vert'
import FragmentShader from './CutOutRenderShader.frag';

export const CutOutShader = {
  uniforms: {
    'sourceTexture': { value: null },
    'sourceDepthMap': { value: null },
    'cutoutDepthMap': { value: null }
	},
  vertexShader: VertexShader,
  fragmentShader: FragmentShader
}
