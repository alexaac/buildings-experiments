// http://web.archive.org/web/20170613114847/http://blog.2pha.com/demos/threejs/shaders/light.html
const lightVertexShader = `
  precision mediump float;

  uniform mat4 uModelViewlight;
  uniform mat4 uProjectionlight;
  uniform mat4 uNormallight;
  uniform vec3 uLightDirection;
  uniform vec3 uLightDiffuse;
  uniform vec3 uMaterialDiffuse;

  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;

  varying vec4 vVertexColor;

  void main(void) {
    // Calculate the normal vector
    vec3 N = normalize(vec3(uNormallight * vec4(aVertexNormal, 1.0)));

    // Normalized light direction
    vec3 L = normalize(uLightDirection);

    // Dot product of the normal product and negative light direction vector
    float lambertTerm = dot(N, -L);

    // Calculating the diffuse color based on the Lambertian reflection model
    vec3 Id = uMaterialDiffuse * uLightDiffuse * lambertTerm;

    // Set the varying to be used inside of the fragment shader
    vVertexColor = vec4(Id, 1.0);

    // Setting the vertex position
    gl_Position = uProjectionlight * uModelViewlight * vec4(aVertexPosition, 1.0);
  }
`;

export default lightVertexShader;
