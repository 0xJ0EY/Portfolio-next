uniform sampler2D sourceTexture;
uniform sampler2D sourceDepthMap;

uniform sampler2D cutoutDepthMap;

in vec2 texCoord;

layout(location = 0) out vec4 diffuseColor;

void main() {
    float sourceDepth = 1.0 - texture2D(sourceDepthMap, texCoord).r;
    float cutoutDepth = 1.0 - texture2D(cutoutDepthMap, texCoord).r;

    bool isCutout = sourceDepth >= cutoutDepth;

    if (isCutout) {
        diffuseColor = texture2D(sourceTexture, texCoord);
    } else {
        diffuseColor = vec4(.0, .0, .0, .0);
    }
}
