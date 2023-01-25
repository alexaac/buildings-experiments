const sphereFragmentShader = `
  precision mediump float;

  uniform float u_opacity;
  uniform float u_shininess;
  uniform vec3 u_light_direction;
  uniform vec4 u_light_ambient;
  uniform vec3 u_light_diffuse;
  uniform vec4 u_light_specular;
  uniform vec4 u_material_ambient;
  uniform vec3 u_material_diffuse;
  uniform vec4 u_material_specular;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;

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

    // Final fragment color takes into account all light values that
    // were computed within the fragment shader
    gl_FragColor = vec4(vec3(Ia + Id + Is), 1.0);
    gl_FragColor *= u_opacity;
  }
`;

export default sphereFragmentShader;
