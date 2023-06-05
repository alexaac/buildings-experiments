'use strict';

import * as dat from './libs/lil-gui.module.min.js';

// A set of utility functions for /common operations across our application
const utils = {
  /**
   * @description Fetch data
   * @param {string} url - file
   */
  async getData(url) {
    const response = fetch(url);

    const data = await (await response).json();

    return data;
  },

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
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  },

  hexToRgb(hex) {
    hex = hex.substring(1);

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

  // A simpler API on top of the dat.GUI API, specifically
  // designed for this book for a simpler codebase
  configureControls(settings, options = { width: 300 }) {
    // Check if a gui instance is passed in or create one by default
    const gui = options.gui || new dat.GUI(options);
    const state = {};

    const isAction = (v) => typeof v === 'function';

    const isFolder = (v) =>
      !isAction(v) &&
      typeof v === 'object' &&
      (v.value === null || v.value === undefined);

    const isColor = (v) =>
      (typeof v === 'string' && ~v.indexOf('#')) ||
      (Array.isArray(v) && v.length >= 3);

    Object.keys(settings).forEach((key) => {
      const settingValue = settings[key];

      if (isAction(settingValue)) {
        state[key] = settingValue;
        return gui.add(state, key);
      }
      if (isFolder(settingValue)) {
        // If it's a folder, recursively call with folder as root settings element
        return utils.configureControls(settingValue, {
          gui: gui.addFolder(key),
        });
      }

      const {
        value,
        min,
        max,
        step,
        options,
        onChange = () => null,
      } = settingValue;

      // set state
      state[key] = value;

      let controller;

      // There are many other values we can set on top of the dat.GUI
      // API, but we'll only need a few for our purposes
      if (options) {
        controller = gui.add(state, key, options);
      } else if (isColor(value)) {
        controller = gui.addColor(state, key);
      } else {
        controller = gui.add(state, key, min, max, step);
      }

      controller.onChange((v) => onChange(v, state));
    });
  },

  initLights(gl, program, parameters) {
    // Use this program instance
    program.useProgram();

    // Set the light position

    gl.uniform3fv(program.uLightDirection, [
      parameters.lightDirection.x,
      parameters.lightDirection.y,
      parameters.lightDirection.z,
    ]);

    // Set the light color to use
    gl.uniform3fv(
      program.uLightDiffuse,
      utils.normalizeColor(parameters.lightColor)
    );
    gl.uniform4fv(program.uLightAmbient, [
      parameters.ambientTerm,
      parameters.ambientTerm,
      parameters.ambientTerm,
      1,
    ]);
    gl.uniform4fv(program.uLightSpecular, [
      parameters.specularTerm,
      parameters.specularTerm,
      parameters.specularTerm,
      1,
    ]);

    // Set the color to use
    gl.uniform3fv(
      program.uMaterialDiffuse,
      utils.normalizeColor(parameters.materialColor)
    );
    gl.uniform4fv(program.uMaterialAmbient, [
      parameters.materialAmbientTerm,
      parameters.materialAmbientTerm,
      parameters.materialAmbientTerm,
      1,
    ]);
    gl.uniform4fv(program.uMaterialSpecular, [
      parameters.materialSpecularTerm,
      parameters.materialSpecularTerm,
      parameters.materialSpecularTerm,
      1,
    ]);
    gl.uniform1f(program.uShininess, parameters.materialShininess);

    gl.uniform1f(program.uOpacity, parameters.materialOpacity);

    gl.uniform1f(program.uTime, parameters.uTime);
  },

  updateDirectionalLight(parameters) {
    parameters.directionalLight.position
      .set(
        parameters.lightDirection.x,
        parameters.lightDirection.y,
        parameters.lightDirection.z
      )
      .normalize();
  },
};

export default utils;
