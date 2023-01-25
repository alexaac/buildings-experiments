// https://github.com/maplibre/maplibre-gl-js/blob/main/src/shaders/fill_extrusion.vertex.glsl
const extrudeVertexShader = `
  uniform mat4 u_matrix;
  uniform mat4 u_model_view_matrix;
  uniform mat4 u_model_matrix;
  uniform mat4 u_view_matrix;
  uniform mat4 u_projection_matrix;
  uniform mat4 u_normal_matrix;

  attribute vec2 a_vertex_position;
  attribute vec4 a_vertex_normal;
  attribute lowp vec2 a_vertex_base;
  attribute lowp vec2 a_vertex_height;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;
  varying vec4 v_vertex_color;
  varying vec4 v_pos;

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
    vec3 v_normal_0 = a_vertex_normal.xyz;
    // vec3 v_normal_0 = top_up_ny.xyz;
    vec3 normal2 = normalize(v_normal_0);
  
    v_normal = v_normal_0;
    v_eye_vector = -vec3(pos.xyz);
  }
`;

export default extrudeVertexShader;
