uniform sampler2D sourceTexture;
uniform sampler2D sourceDepthMap;

uniform sampler2D cutoutDepthMap;

in vec2 texCoord;

void main() {
    float sourceDepth = 1.0 - texture2D(sourceDepthMap, texCoord).r;
    float cutoutDepth = 1.0 - texture2D(cutoutDepthMap, texCoord).r;

    if (sourceDepth <= cutoutDepth) {
        // gl_FragColor = texture2D(sourceTexture, texCoord);
        // gl_FragColor.a = 0.0;
    } else {
        gl_FragColor = texture2D(sourceTexture, texCoord);
    }
}
