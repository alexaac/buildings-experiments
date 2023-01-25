const extrudeFragmentShader = `
  precision mediump float;

  #define ss(a,b,c) smoothstep(a,b,c)

  uniform float u_shininess;
  uniform vec3 u_light_direction;
  uniform vec4 u_light_ambient;
  uniform vec3 u_light_diffuse;
  uniform vec4 u_light_specular;
  uniform vec4 u_material_ambient;
  uniform vec3 u_material_diffuse;
  uniform vec4 u_material_specular;
  uniform float u_time;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;
  varying vec4 v_vertex_color;
  varying vec4 v_pos;

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
   
    // Normalized light direction
    vec3 L = normalize(u_light_direction);

    // Normalized normal
    vec3 N = normalize(v_normal);

    float lambertTerm = dot(N, L);

    // Ambient
    vec4 Ia = u_light_ambient * u_material_ambient;
    // Diffuse
    vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
    // Specular
    vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);

    if (lambertTerm > 0.0) {
      Id = vec4(u_light_diffuse, 1.0) * vec4(u_material_diffuse, 1.0) * lambertTerm;
      vec3 E = normalize(v_eye_vector);
      vec3 R = reflect(L, N);
      float specular = pow( max(dot(R, E), 0.0), u_shininess);
      Is = u_light_specular * u_material_specular * specular;
    }

    // Final fargment color takes into account all light values that
    // were computed within the fragment shader
    gl_FragColor = vec4(vec3(Ia + Id + Is), 1.0);
    
    // modulate hue by z-position and time, then convert to RGB and set pixel color
    vec3 c = vec3(-v_pos.z * .003 + u_time / 5000., 1.0, 1.0);
    // bool coloured = false; // simple colors
    bool coloured = true;

    // gl_FragColor.rgb *= hsv2rgb(c, coloured);
    // gl_FragColor.a = 0.7;
    

    gl_FragColor.rgb *= v_normal;
    gl_FragColor.a = 0.7;

  }
`;

export default extrudeFragmentShader;
