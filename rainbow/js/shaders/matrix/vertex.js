// http://web.archive.org/web/20170613114847/http://blog.2pha.com/demos/threejs/shaders/matrix.html
const matrixVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);

  }
`;

export default matrixVertexShader;
