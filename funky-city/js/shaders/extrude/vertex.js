// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `
uniform mat4 u_matrix;

uniform vec3 u_reverse_light_direction;
uniform vec3 u_material_diffuse;
uniform vec3 u_light_diffuse;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_interpolated_color;
uniform float u_opacity;
uniform float u_time;

attribute vec4 a_vertex_position;
attribute lowp vec2 a_vertex_base;
attribute lowp vec2 a_vertex_height;

varying vec3 v_color;

void main() {
     
  vec3 pos_nx = floor(a_vertex_position.xyz * 0.5);
  mediump vec3 top_up_ny = a_vertex_position.xyz - 2.0 * pos_nx;
  float t = top_up_ny.x;
  vec3 normal = top_up_ny.xyz;
  
  float base = max(0.0, a_vertex_base.x);
  float height = max(0.0, a_vertex_height.x);
  float z = t > 0.0 ? height : base;
  vec4 pos = vec4(pos_nx.xy, z, 1.0);

  gl_Position = u_matrix * pos;
  
  // Colors

  // unit vector
  vec3 normal2 = normalize(normal);

  // float light = clamp(dot(normal2 / 16384.0, u_reverse_light_direction), 0.0, 1.0); 

  // vec3 u_reverse_light_direction2 = mix(u_reverse_light_direction, vec3(-1.0, 0.0, 1.0), 0.5);

  float light = dot(normal2, u_reverse_light_direction);

  // float pct = 0.7;
  float pct = abs(sin(u_time* 0.0008)) ;

  // Mix uses pct (a value from 0-1) to
  // mix the two colors

  // vec3 colorA = vec3(0.149, 0.141, 0.912);
  // vec3 colorB = vec3(1.000, 0.833, 0.224);
  vec3 color = mix(u_color_a, u_color_b, pct);
  // vec3 color = vec3(0.149, 0.141, 0.912);
  // color = u_interpolated_color;

  v_color = color;

  // // Add slight ambient lighting so no extrusions are totally black
  // vec4 ambientlight = vec4(0.03, 0.03, 0.03);
  // v_color += ambientlight;

  // Adjust directional so that
  // the range of values for highlight/shading is narrower
  // with lower light intensity
  // and with lighter/brighter surface colors
lowp float u_lightintensity = 1.0;
  // Relative luminance (how dark/bright is the surface color?)
  float colorvalue = u_material_diffuse.r * 0.2126 + u_material_diffuse.g * 0.7152 + u_material_diffuse.b * 0.0722;
  light = mix((1.0 - u_lightintensity), max((1.0 - colorvalue + u_lightintensity), 1.0), light);

  // // Add gradient along z axis of side surfaces
  // float u_vertical_gradient = 1.0;
  // if (normal.y != 0.0) {
  //     // This avoids another branching statement, but multiplies by a constant of 0.84 if no vertical gradient,
  //     // and otherwise calculates the gradient based on base + height
  //     light *= (
  //         (1.0 - u_vertical_gradient) +
  //         (u_vertical_gradient * clamp((t + base) * pow(height / 150.0, 0.5), mix(0.7, 0.98, 1.0 - u_lightintensity))));
  // }

  // Lets multiply just the color portion (not the alpha)
  // by the light
  v_color.r *= clamp(u_material_diffuse.r * light * u_light_diffuse.r, mix(0.0, 0.3, 1.0 - u_light_diffuse.r), 1.0);
  v_color.g *= clamp(u_material_diffuse.g * light * u_light_diffuse.g, mix(0.0, 0.3, 1.0 - u_light_diffuse.g), 1.0);
  v_color.b *= clamp(u_material_diffuse.b * light * u_light_diffuse.b, mix(0.0, 0.3, 1.0 - u_light_diffuse.b), 1.0);

  // v_color *= u_opacity;

  // v_color += 0.4;   

  }

`;

export default extrudeVertexShader;
