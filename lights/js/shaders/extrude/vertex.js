// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `
  uniform mat4 u_matrix;

  attribute vec2 a_vertex_position;
  attribute vec4 a_vertex_normal;
  attribute lowp vec2 a_vertex_base;
  attribute lowp vec2 a_vertex_height;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;
  varying vec4 v_vertex_color;

  void main() {
    
    vec3 normal = a_vertex_normal.xyz;
    float t = mod(normal.x, 2.0);
    
    float base = max(0.0, a_vertex_base.x);
    float height = max(0.0, a_vertex_height.x);

    // vec3 pos_nx = floor(a_vertex_normal.xyz * 0.5);
    // mediump vec3 top_up_ny = a_vertex_normal.xyz - 2.0 * pos_nx;
    // float t = top_up_ny.x;

    vec4 pos = vec4(a_vertex_position, t > 0.0 ? height : base, 1);
    
    gl_Position = u_matrix * pos ;
    
    // Colors

    // unit vector
    vec3 v_normal_0 = a_vertex_normal.xyz;
    // vec3 v_normal_0 = top_up_ny.xyz;
    vec3 normal2 = normalize(v_normal_0);
  
    v_normal = v_normal_0;
    v_eye_vector = -vec3(pos.xyz);


    // // Normalized light direction
    // vec3 L = normalize(u_light_direction);

    // // Dot product of the normal product and negative light direction vector
    // float lambertTerm = dot(normal2, L);
  
    // // Ambient
    // vec4 Ia = u_light_ambient * u_material_ambient;
    // // Diffuse
    // vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);
    // // Specular
    // vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);

    // if (lambertTerm > 0.0) {
    //   Id = vec4(u_light_diffuse, 1.0) * vec4(u_material_diffuse, 1.0) * lambertTerm;
    //   vec3 E = normalize(v_eye_vector);
    //   vec3 R = reflect(L, normal2);
    //   float specular = pow(max(dot(R, E), 0.0), u_shininess);
    //   Is = u_light_specular * u_material_specular * specular;
    // }

    // // Set varying to be used in fragment shader
    // v_vertex_color = vec4(vec3(Ia + Id + Is), 1.0);

    // v_vertex_color *= u_opacity;
    // // v_vertex_color += 0.3;   

    

  //   float pct = 0.5; 
  //   // float pct = abs(sin(u_time* 0.0008)) ;

  //   // Mix uses pct (a value from 0-1) to
  //   // mix the two colors
  //   vec4 colorA = vec4(0.149, 0.141, 0.912, 1.0);
  //   vec4 colorB = vec4(1.000, 0.833, 0.224, 1.0);
  //   vec4 color = mix(colorA, colorB, pct);

  //   v_vertex_color = color;
  
  //   // Add slight ambient lighting so no extrusions are totally black
  //   vec4 ambientlight = vec4(0.03, 0.03, 0.03, 1.0);
  //   v_vertex_color += ambientlight;

  //   // Adjust directional so that
  //   // the range of values for highlight/shading is narrower
  //   // with lower light intensity
  //   // and with lighter/brighter surface colors
  // lowp float u_lightintensity = 1.0;
  //   // Relative luminance (how dark/bright is the surface color?)
  //   float colorvalue = u_material_diffuse.r * 0.2126 + u_material_diffuse.g * 0.7152 + u_material_diffuse.b * 0.0722;
  //   lambertTerm = mix((1.0 - u_lightintensity), max((1.0 - colorvalue + u_lightintensity), 1.0), lambertTerm);

  //   // Add gradient along z axis of side surfaces
  //   float u_vertical_gradient = 1.0;
  //   if (normal.y != 0.0) {
  //       // This avoids another branching statement, but multiplies by a constant of 0.84 if no vertical gradient,
  //       // and otherwise calculates the gradient based on base + height
  //       lambertTerm *= (
  //           (1.0 - u_vertical_gradient) +
  //           (u_vertical_gradient * clamp((t + base) * pow(height / 150.0, 0.5), mix(0.7, 0.98, 1.0 - u_lightintensity), 1.0)));
  //   }

  //   // // Lets multiply just the color portion (not the alpha)
  //   // // by the light
  //   // v_vertex_color.r *= clamp(u_material_diffuse.r * lambertTerm * u_light_diffuse.r, mix(0.0, 0.3, 1.0 - u_light_diffuse.r), 1.0);
  //   // v_vertex_color.g *= clamp(u_material_diffuse.g * lambertTerm * u_light_diffuse.g, mix(0.0, 0.3, 1.0 - u_light_diffuse.g), 1.0);
  //   // v_vertex_color.b *= clamp(u_material_diffuse.b * lambertTerm * u_light_diffuse.b, mix(0.0, 0.3, 1.0 - u_light_diffuse.b), 1.0);

  //   // // Calculating the diffuse color based on the Lambertian reflection model
  //   // vec3 Ia = u_material_diffuse * u_light_ambient;
  //   // vec3 Id =  u_material_diffuse * u_light_diffuse * lambertTerm;
  //   // v_vertex_color = vec4(vec3(Ia + Id), 1.0);

  //   // vec3 Id = u_material_diffuse * u_light_diffuse * lambertTerm;
  //   // // vec3 Id = color.rgb * u_light_diffuse.rgb * lambertTerm;
  //   // // Set the varying to be used inside of the fragment shader
  //   // v_vertex_color = vec4(Id, 1.0);

 

  }
`;

export default extrudeVertexShader;
