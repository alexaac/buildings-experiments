const firefliesVertexShader = `
  uniform float uTime;
  uniform float uRotation;
  uniform float uPixelRatio;
  uniform float uSize;

  attribute float aScale;

  varying float hide;
  varying vec4 vColor;

  // hue-saturation-value to RBG color space converter
  vec3 hsv2rgb(vec3 c, bool coloured) {
    vec4 K = vec4(0.5, 0.5, 0.5, 3.0);
    if (coloured == true) {
      K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    }

    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec3 p = position.xyz;

    // modulate hue by z-position and time, then convert to RGB and set pixel color
    vec3 c = vec3(0.824,0.98,0.137);
    // bool coloured = false; // simple colors
    bool coloured = true;

    vColor.rgb *= hsv2rgb(c, coloured);
    vColor.a = 0.7;

    float new_x = p.x*cos(uTime) + p.y*sin(uTime);
    float new_y = p.y*cos(uTime) - p.x*sin(uTime);

    vec4 modelPosition = modelMatrix * vec4(new_x, new_y, p.z, 1.0);
    // vec4 modelPosition = modelMatrix * vec4(p.x, p.y, p.z, 1.0);
    // modelPosition.y -= sin(uTime + modelPosition.x * 100.0) * aScale * 10.0; 

    hide = 0.0;
    if (modelPosition.y < 0.0) {
      modelPosition.y = abs(modelPosition.y);
      hide = 1.0;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    

    gl_PointSize = uSize * aScale * uPixelRatio;
    // gl_PointSize *= (1.0/ - viewPosition.z);
  }
`;

export default firefliesVertexShader;
