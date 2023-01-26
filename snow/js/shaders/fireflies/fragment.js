const firefliesFragmentShader = `
  varying float hide;
  varying vec4 vColor;
  
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.05 * 2.0;

    // gl_FragColor = vec4(gl_PointCoord, 1.0, 1.0);
    // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    // gl_FragColor = vec4(vec3(0.824,0.98,0.137), strength);
    gl_FragColor = vec4(vec3(1.0, 1.0, 1.0), strength);

    // gl_FragColor = vColor;

    // if (hide == 1.0) {
    //   gl_FragColor = vec4(vec3(0.1,0.0,0.0), 1.0);
    //   discard;
    // }

    


  }
`;

export default firefliesFragmentShader;
