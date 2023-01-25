'use strict';

import utils from '../utils.js';

// Program constructor that takes a WebGL context and script tag IDs
// to extract vertex and fragment shader source code from the page
export class Program {
  constructor(gl, vertexShader, fragmentShader) {
    this.gl = gl;
    // Create a program
    this.program = gl.createProgram();

    if (!(vertexShader && fragmentShader)) {
      return console.error('No shaders were provided');
    }

    // Attach the shaders to this program
    gl.attachShader(
      this.program,
      utils.getShader(gl, vertexShader, 'x-shader/x-vertex')
    );
    gl.attachShader(
      this.program,
      utils.getShader(gl, fragmentShader, 'x-shader/x-fragment')
    );

    // Create executable versions of the vertex and fragment shaders that are passed to the GPU
    gl.linkProgram(this.program);

    // This is part of the WebGL state-machine query mechanism. It allows you to query the program parameters. We use this function to verify whether the program has been successfully linked.
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      return console.error('Could not initialize shaders.');
    }

    // It will load the program onto the GPU if the program contains valid code (that is, it has been successfully linked)
    this.useProgram();
  }

  // Sets the WebGL context to use current program
  useProgram() {
    this.gl.useProgram(this.program);
  }

  // Load up the given attributes and uniforms from the given values
  load(attributes, uniforms) {
    this.useProgram();
    this.setAttributeLocations(attributes);
    this.setUniformLocations(uniforms);
  }

  // Set references to attributes onto the program instance
  setAttributeLocations(attributes) {
    attributes.forEach((attribute) => {
      this[attribute] = this.gl.getAttribLocation(
        this.program,
        this.unCamelCase(attribute)
      );
    });
  }

  // Set references to uniforms onto the program instance
  setUniformLocations(uniforms) {
    uniforms.forEach((uniform) => {
      this[uniform] = this.gl.getUniformLocation(
        this.program,
        this.unCamelCase(uniform)
      );
    });
  }

  // Get the uniform location from the program
  getUniform(uniformLocation) {
    return this.gl.getUniform(this.program, uniformLocation);
  }

  unCamelCase(string) {
    return string
      .split(/(?=[A-Z])/)
      .map((word) => word.toLowerCase().trim())
      .join('_');
  }
}
