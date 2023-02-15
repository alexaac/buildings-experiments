import { Program } from '../components/Program.js';

import utils from '../utils.js';

import extrudeVertexShader from '../shaders/extrude/vertex.js';
import extrudeFragmentShader from '../shaders/extrude/fragment.js';

let buildingsProgram;
let running = false;

export class Buildings {
  constructor(id, buildingsLayerId, buildingType, parameters) {
    // console.log(id);
    this.id = id;
    this.parameters = parameters;
    this.buildingsLayerId = buildingsLayerId;
    this.buildingType = buildingType;
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(map, gl) {
    this.map = map;

    // find layer source
    const sourceName = this.map.getLayer(this.buildingsLayerId).source;
    this.source = (this.map.style.sourceCaches ||
      this.map.style._otherSourceCaches)[sourceName];
    if (!this.source) {
      console.warn(`Can't find layer ${this.buildingsLayerId}'s source.`);
    }

    gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
    const color = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    console.log(`clearColor = (
      ${color[0].toFixed(1)},
      ${color[1].toFixed(1)},
      ${color[2].toFixed(1)}
    )`);

    // Create a program with the appropriate vertex and fragment shaders
    const initBuildingsProgram = () => {
      // Create a program
      buildingsProgram = new Program(
        gl,
        ` 
          ${extrudeVertexShader}
        `,
        ` 
          ${extrudeFragmentShader} 
        `
      );

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      // Create a mapping between JavaScript variables and the program attributes and uniforms

      // Attributes to be loaded into program
      const attributes = ['aVertexPosition', 'aVertexBase', 'aVertexHeight'];

      // Uniforms to be loaded into program
      const uniforms = [
        'uMatrix',
        'uHeightFactor',
        'uAltitude',
        'uAzimuth',
        'uReverseLightDirection',
        'uTime',
        'uLightDiffuse',
        'uMaterialDiffuse',
        'uColorA',
        'uColorB',
        'uInterpolatedColor',
        'uOpacity',
        'uWireframe',
      ];

      // Load attributes and uniforms
      buildingsProgram.load(attributes, uniforms);
    };

    initBuildingsProgram();
  }

  render(gl) {
    gl.uniform1i(buildingsProgram.uWireframe, this.parameters.wireframe);
    gl.uniform1f(buildingsProgram.uOpacity, this.parameters.opacity);
    // Set the color to use
    gl.uniform3fv(
      buildingsProgram.uMaterialDiffuse,
      utils.normalizeColor(this.parameters.materialColor)
    );

    // Set the light color to use
    gl.uniform3fv(
      buildingsProgram.uLightDiffuse,
      utils.normalizeColor(this.parameters.lightColor)
    );

    const drawBuildings = () => {
      if (!this.source) return;

      // Use this program instance
      buildingsProgram.useProgram();

      const coords = this.source.getVisibleCoordinates().reverse();

      const buildingsLayer = this.map.getLayer(this.buildingsLayerId);
      const context = this.map.painter.context;

      let { lng, lat } = this.map.getCenter();
      const pos = SunCalc.getPosition(this.parameters.date, lat, lng);

      gl.uniform1f(buildingsProgram.uAltitude, pos.altitude);
      gl.uniform1f(buildingsProgram.uAzimuth, pos.azimuth + (3 * Math.PI) / 2);

      // Set the light direction.
      gl.uniform3fv(
        buildingsProgram.uReverseLightDirection,
        m4.normalize([
          Math.cos(pos.azimuth + (3 * Math.PI) / 2),
          Math.sin(pos.azimuth + (3 * Math.PI) / 2),
          2.5,
        ])
      );
      gl.uniform3fv(
        buildingsProgram.uColorA,
        utils.normalizeColor(this.parameters.colorA)
      );
      gl.uniform3fv(
        buildingsProgram.uColorB,
        utils.normalizeColor(this.parameters.colorB)
      );

      gl.uniform3fv(
        buildingsProgram.uInterpolatedColor,
        utils.normalizeColor(this.parameters.interpolatedColor)
      );

      // console.log(this.parameters.interpolatedColor);
      gl.uniform1f(buildingsProgram.uTime, this.parameters.uTime);

      // Turn on culling. By default backfacing triangles
      // will be culled.
      gl.enable(gl.CULL_FACE);
      // Enable the depth buffer
      gl.enable(gl.DEPTH_TEST);

      this.map.setLight(
        {
          anchor: 'map',
          position: [
            1.5,
            180 + (pos.azimuth * 180) / Math.PI,
            90 - (pos.altitude * 180) / Math.PI,
          ],
          'position-transition': { duration: 0 },
          color: '#fdb',
          // color: `hsl(20, ${50 * Math.cos(pos.altitude)}%, ${ 200 * Math.sin(pos.altitude) }%)`
        },
        { duration: 0 }
      );

      for (const coord of coords) {
        // console.log(transform.customLayerMatrix());
        const tile = this.source.getTile(coord);
        const bucket = tile.getBucket(buildingsLayer);
        if (!bucket) continue;

        const [heightBuffer, baseBuffer] =
          bucket.programConfigurations.programConfigurations[
            this.buildingsLayerId
          ]._buffers;

        gl.uniformMatrix4fv(
          buildingsProgram.uMatrix,
          false,
          coord.posMatrix || coord.projMatrix
        );

        gl.uniform1f(
          buildingsProgram.uHeightFactor,
          Math.pow(2, coord.overscaledZ) / tile.tileSize / 8
        );

        for (const segment of bucket.segments.get()) {
          const numPrevAttrib = context.currentNumAttributes || 0;
          const numNextAttrib = 2;

          for (let i = numNextAttrib; i < numPrevAttrib; i++)
            gl.disableVertexAttribArray(i);

          const vertexOffset = segment.vertexOffset || 0;
          gl.enableVertexAttribArray(buildingsProgram.aVertexPosition);
          gl.enableVertexAttribArray(buildingsProgram.aVertexHeight);
          gl.enableVertexAttribArray(buildingsProgram.aVertexBase);

          bucket.layoutVertexBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexPosition,
            4,
            gl.SHORT,
            false,
            8,
            8 * vertexOffset
          );

          heightBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexHeight,
            1,
            gl.FLOAT,
            false,
            4,
            4 * vertexOffset
          );

          baseBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexBase,
            1,
            gl.FLOAT,
            false,
            4,
            4 * vertexOffset
          );
          bucket.indexBuffer.bind(); // Set up the buffer
          context.currentNumAttributes = numNextAttrib;

          // Render to our canvas

          // If wireframe is truthy, we draw using `LINES`
          const type = this.parameters.wireframe ? gl.LINES : gl.TRIANGLES;

          gl.drawElements(
            type,
            segment.primitiveLength * 3,
            gl.UNSIGNED_SHORT,
            segment.primitiveOffset * 3 * 2
          );
        }
      }
    };

    drawBuildings();
  }
}
