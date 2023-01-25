const sphereVertexShader = `
  precision mediump float;

  uniform mat4 u_model_view_matrix;
  uniform mat4 u_projection_matrix;
  uniform mat4 u_normal_matrix;

  attribute vec3 a_vertex_position;
  attribute vec3 a_vertex_normal;

  varying vec3 v_normal;
  varying vec3 v_eye_vector;

  void main(void) {
    v_normal = a_vertex_normal.xyz;
    v_eye_vector = -a_vertex_position;

    // Setting the vertex position
    gl_Position = u_projection_matrix * u_model_view_matrix * vec4(a_vertex_position, 1.0);
    
  }
`;

export default sphereVertexShader;
