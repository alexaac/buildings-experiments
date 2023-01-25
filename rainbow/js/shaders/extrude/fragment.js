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
  uniform vec3 u_map_position;
  uniform float u_material_opacity;
  uniform float u_opacity;
  uniform float u_time;
  uniform vec2 u_resolution; // = (window-width, window-height)

  uniform float h_wave;
  uniform float pre_wave;
  uniform float post_wave;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;
  varying vec4 v_vertex_color;
  varying vec4 v_pos;

  varying vec2 point_pos;

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
    
    
    // // float f = ss(h_wave - post_wave, h_wave, v_pos) - ss(h_wave, h_wave + pre_wave, v_pos);
    // float f = ss(v_pos, h_wave, h_wave - post_wave  ) - ss(v_pos, h_wave + pre_wave, h_wave  );
    

    // f = clamp(f, 0., 1.);
    // // f *= (1. - gl_FragColor.b);
    // // f *= (1. - u_opacity);
    // vec3 wave_color = vec3(0, 1, 1);
    // // vec4 final_color = vec4( gl_FragColor.r,gl_FragColor.g,gl_FragColor.b+f, u_opacity);
    // vec3 final_color = mix(gl_FragColor.rgb, wave_color, f);
    // // vec4 final_color = vec4(gl_FragColor.rgb, u_opacity + f);

    // // gl_FragColor = vec4(final_color, 1.0);
    // // gl_FragColor *= u_opacity;
    
    // gl_FragColor = vec4(final_color, u_opacity + f * ( f - 1.) + 0.1);
    // // gl_FragColor = vec4(final_color, u_opacity - f * (1. - f) - 0.1);
    // // gl_FragColor = final_color;

    



    float distanceX = abs( u_map_position.x - (gl_FragCoord.x - u_resolution.x) );
    float distanceY = abs( u_map_position.y - (gl_FragCoord.y - u_resolution.y) );

    // if(sqrt(distanceX * distanceX + distanceY * distanceY) > 400.0) {

    //   // discard;
    // }
    // else if(sqrt(distanceX * distanceX + distanceY * distanceY) <= 400.0 &&
    //         sqrt(distanceX * distanceX + distanceY * distanceY) >= 400.0-200.0) {
              
    //           // Shade by building height
    //           gl_FragColor *= vec4(vec3((-v_pos.z * .003 + .9)), 1.0);
    //           gl_FragColor.a = clamp(mix(1., 0., (u_map_position.z - 15.) * .25), .5, 1.);

    //           // vec3 c = vec3(-v_pos.z * .003 + u_time / 5000., 1.0, 1.0);
    //           // bool coloured = false;
        
    //           // gl_FragColor.rgb *= hsv2rgb(c, coloured);
    //           // gl_FragColor.a = 0.7;

    //         }

    // else {

      // modulate hue by z-position and time, then convert to RGB and set pixel color
      vec3 c = vec3(-v_pos.z * .003 + u_time / 5000., 1.0, 1.0);
      // bool coloured = false; // simple colors
      bool coloured = true;

      gl_FragColor.rgb *= hsv2rgb(c, coloured);
      gl_FragColor.a = 0.7;
    // }


    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    // // float dist = distance(point_pos, gl_FragCoord.xy - vec2(698.5, 484.0));
    // float dist = distance(point_pos, gl_FragCoord.xy - vec2(u_resolution.x, u_resolution.y));
    // if (dist > 200.0)
    //     discard;

    // float d = dist / 200.0;
    // vec3 color = mix(gl_FragColor.rgb, vec3(0.0), step(0.5, d));

    // gl_FragColor = vec4(color, 1.0);

  }
`;

export default extrudeFragmentShader;
