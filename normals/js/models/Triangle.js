let triangleProgram;

export class Triangle {
  constructor(id) {
    this.id = id;
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(map) {
    this.map = map;

    const initTriangleProgram = () => {
      // create GLSL source for vertex shader
      var vertexSource = `
        uniform mat4 u_matrix;
        attribute vec2 a_vertex_position;
        
        void main() {
          gl_Position = u_matrix * vec4(a_vertex_position, 0.0, 1.0);
        }`;

      // create GLSL source for fragment shader
      var fragmentSource = `
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
        }`;

      // Create a program
      triangleProgram = new Program(gl, vertexSource, fragmentSource);

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      // Create a mapping between JavaScript variables and the program attributes and uniforms

      // Attributes to be loaded into program
      const attributes = ['aVertexPosition'];

      // Uniforms to be loaded into program
      const uniforms = ['uMatrix'];

      // Load attributes and uniforms
      triangleProgram.load(attributes, uniforms);
    };

    const loadTriangle = () => {
      initTriangleProgram();

      // Set up the buffers
      // define vertices of the triangle to be rendered in the custom style layer
      var helsinki = maplibregl.MercatorCoordinate.fromLngLat({
        lng: -74.01376,
        lat: 40.704988,
      });
      var berlin = maplibregl.MercatorCoordinate.fromLngLat({
        lng: 13.403,
        lat: 52.562,
      });
      var kyiv = maplibregl.MercatorCoordinate.fromLngLat({
        lng: 30.498,
        lat: 50.541,
      });

      // create and initialize a WebGLBuffer to store vertex and color data
      this.triangleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          helsinki.x,
          helsinki.y,
          berlin.x,
          berlin.y,
          kyiv.x,
          kyiv.y,
        ]),
        gl.STATIC_DRAW
      );

      // Clean
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    };

    loadTriangle();
  }

  render(gl, matrix) {
    const drawTriangle = () => {
      // Render to our canvas

      // Use this program instance
      triangleProgram.useProgram();

      gl.uniformMatrix4fv(triangleProgram.uMatrix, false, matrix);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleBuffer);
      gl.enableVertexAttribArray(triangleProgram.aVertexPosition);
      gl.vertexAttribPointer(
        triangleProgram.aVertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

      // Clean
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    };

    drawTriangle();
  }
}
