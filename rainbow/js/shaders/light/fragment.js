const lightFragmentShader = `
  precision mediump float;

  // Expect the interpolated value from the vertex shader
  varying vec4 vVertexColor;

  void main(void)  {
    // Simply set the value passed in from the vertex shader
    gl_FragColor = vVertexColor;
  }
`;

export default lightFragmentShader;
