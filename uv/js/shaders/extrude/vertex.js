// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `
  uniform mat4 u_matrix;
  uniform mat4 u_model_view_matrix;
  uniform mat4 u_model_matrix;
  uniform mat4 u_view_matrix;
  uniform mat4 u_projection_matrix;
  uniform mat4 u_normal_matrix;
  // uniform float u_time;
  uniform vec3 u_color_a;
  uniform vec3 u_color_b;

  attribute vec2 a_vertex_position;
  attribute vec4 a_vertex_normal;
  attribute lowp vec2 a_vertex_base;
  attribute lowp vec2 a_vertex_height;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;
  varying vec3 v_vertex_color;
  varying vec4 v_pos;
  varying vec2 vUv;


  void main() {
    vec3 normal = a_vertex_normal.xyz;
    float t = mod(normal.x, 2.0);
    
    float base = max(0.0, a_vertex_base.x);
    float height = max(0.0, a_vertex_height.x);

    vec4 pos = vec4(a_vertex_position, t > 0.0 ? height : base, 1);
    v_pos = pos;

    // gl_Position = u_projection_matrix * u_model_matrix * u_view_matrix * pos;
    // gl_Position = u_projection_matrix * u_model_view_matrix * pos;
    gl_Position = u_matrix * pos;

    // Colors
    // unit vector
    v_normal = normalize(normal);
    /// Object to world normal? ///
    // v_normal =  mat3(u_model_view_matrix) * normal; 
    
    v_eye_vector = -vec3(pos.xyz);
    vUv = 0.02 * (pos.xz + vec2(250, pos.y));

    float pct = 0.5; //abs(sin(u_time* 0.0008)) ;

    // Mix uses pct (a value from 0-1) to
    // mix the two colors

    vec3 colorA = u_color_a; //vec3(0.149, 0.141, 0.912);
    vec3 colorB = u_color_b; //vec3(1.000, 0.833, 0.224);
    vec3 color = mix(colorA, colorB, pct);

    v_vertex_color = color;
   
  }
`;

export default extrudeVertexShader;
