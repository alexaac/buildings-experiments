'use strict';

// A set of utility functions for /common operations across our application
const utils = {
  // Find and return a DOM element given an ID
  getCanvas(id) {
    const canvas = document.getElementById(id);

    if (!canvas) {
      console.error(`There is no canvas with id ${id} on this page.`);
      return null;
    }
    console.log(canvas);
    return canvas;
  },

  // Given a canvas element, return the WebGL2 context
  getGLContext(canvas) {
    return (
      canvas.getContext('webgl') ||
      console.error('WebGL is not available in your browser.')
    );
  },

  // Given a WebGL context and an id for a shader script,
  // return a compiled shader
  getShader(gl, shaderString, type) {
    let shader;
    if (type === 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else if (type === 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, shaderString);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderSource(shader));
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  },

  hexToRgb(hex) {
    hex = hex.substring(1);

    // console.log(hex);
    const num = parseInt(hex, 16);

    const r = num >> 16;
    const g = (num >> 8) & 255;
    const b = num & 255;

    return [r, g, b];
  },

  //[jscastro] get the sun times for sunrise, sunset, etc.. from a given datetime, lng, lat and alt
  getSunTimes(date, coords) {
    return SunCalc.getTimes(
      date,
      coords[1],
      coords[0],
      coords[2] ? coords[2] : 0
    );
  },

  dateToTimezone(date = new Date(), timezone) {
    let tzTime = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(tzTime);
  },

  // De-normalize colors from 0-1 to 0-255
  denormalizeColor(color) {
    return color.map((c) => c * 255);
  },

  // Normalize colors from 0-255 to 0-1
  normalizeColor(color) {
    if (color === undefined) return;

    const rgbColor = this.hexToRgb(color);

    return rgbColor.map((c) => c / 255);
  },

  // Returns computed normals for provided vertices.
  // Note: Indices have to be completely defined--NO TRIANGLE_STRIP only TRIANGLES.
  calculateNormals(vs, ind) {
    const x = 0,
      y = 1,
      z = 2,
      ns = [];

    // For each vertex, initialize normal x, normal y, normal z
    for (let i = 0; i < vs.length; i += 3) {
      ns[i + x] = 0.0;
      ns[i + y] = 0.0;
      ns[i + z] = 0.0;
    }

    // We work on triads of vertices to calculate
    for (let i = 0; i < ind.length; i += 3) {
      // Normals so i = i+3 (i = indices index)
      const v1 = [],
        v2 = [],
        normal = [];

      // p2 - p1
      v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
      v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
      v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

      // p0 - p1
      v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
      v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
      v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

      // Cross product by Sarrus Rule
      normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
      normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
      normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

      // Update the normals of that triangle: sum of vectors
      for (let j = 0; j < 3; j++) {
        ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
        ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
        ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
      }
    }

    // Normalize the result.
    // The increment here is because each vertex occurs.
    for (let i = 0; i < vs.length; i += 3) {
      // With an offset of 3 in the array (due to x, y, z contiguous values)
      const nn = [];
      nn[x] = ns[i + x];
      nn[y] = ns[i + y];
      nn[z] = ns[i + z];

      let len = Math.sqrt(nn[x] * nn[x] + nn[y] * nn[y] + nn[z] * nn[z]);
      if (len === 0) len = 1.0;

      nn[x] = nn[x] / len;
      nn[y] = nn[y] / len;
      nn[z] = nn[z] / len;

      ns[i + x] = nn[x];
      ns[i + y] = nn[y];
      ns[i + z] = nn[z];
    }

    return ns;
  },
};

export default utils;
