import { Program } from '../../../js/components/Program.js';

import utils from '../../../js/utils.js';

import extrudeVertexShader from '../shaders/extrude/vertex.js';
import extrudeFragmentShader from '../shaders/extrude/fragment.js';

let buildingsProgram;
let running = false;

export class Buildings {
  constructor(id, buildingsLayerId, parameters) {
    // console.log(id);
    this.id = id;
    this.parameters = parameters;
    this.buildingsLayerId = buildingsLayerId;
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

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.ALWAYS);
    gl.hint(gl.PERSPECTIVE_CORRECTION_HINT, gl.NICEST);

    gl.depthMask(true);
    gl.enable(gl.BLEND);

    // Create a program with the appropriate vertex and fragment shaders
    const initBuildingsProgram = () => {
      // Create a program
      buildingsProgram = new Program(
        gl,
        extrudeVertexShader,
        extrudeFragmentShader
      );

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      // Create a mapping between JavaScript variables and the program attributes and uniforms

      // Attributes to be loaded into program
      const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexBase',
        'aVertexHeight',
      ];

      // Uniforms to be loaded into program
      const uniforms = [
        'uMatrix',
        'uModelMatrix',
        'uViewMatrix',
        'uModelViewMatrix',
        'uProjectionMatrix',
        'uNormalMatrix',
        'materialOpacity',
        'uTime',
        'uLightDiffuse',
        'uLightAmbient',
        'uLightSpecular',
        'uLightDirection',
        'uLightPosition',
        'uMaterialAmbient',
        'uMaterialDiffuse',
        'uMaterialSpecular',
        'uShininess',
        'preWave',
        'postWave',
        'hWave',
        'uMaterialOpacity',
        'uOpacity',
        'uMapPosition',
        'uResolution',
        'uColorA',
        'uColorB',
        'uSpacing',
      ];

      // Load attributes and uniforms
      buildingsProgram.load(attributes, uniforms);
    };

    initBuildingsProgram();
  }

  render(gl, viewProjectionMatrix) {
    const currentCenter = this.map.getCenter();

    utils.initLights(gl, buildingsProgram, this.parameters);

    gl.uniform1f(buildingsProgram.uCutOff, 0.75);
    gl.uniform1f(buildingsProgram.uExponentFactor, 10);
    // console.log(this.parameters.center.meters);
    gl.uniform3fv(buildingsProgram.uMapPosition, [
      maplibregl.MercatorCoordinate.fromLngLat(
        [currentCenter.lng, currentCenter.lat],
        0
      ),
      this.parameters.zoom,
    ]);

    gl.uniform1f(buildingsProgram.uTime, this.parameters.uTime);
    gl.uniform3fv(
      buildingsProgram.uColorA,
      utils.normalizeColor(this.parameters.uColorA)
    );
    gl.uniform3fv(
      buildingsProgram.uColorB,
      utils.normalizeColor(this.parameters.uColorB)
    );
    gl.uniform1f(buildingsProgram.uSpacing, this.parameters.uSpacing);

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

      gl.uniform1f(buildingsProgram.preWave, this.parameters.preWave);
      gl.uniform1f(buildingsProgram.postWave, this.parameters.postWave);
      gl.uniform1f(buildingsProgram.postWave, this.parameters.hWave);
      gl.uniform2fv(buildingsProgram.uResolution, this.parameters.resolution);
      // console.log('this.parameters.resolution ', this.parameters.resolution);

      gl.uniform1f(
        buildingsProgram.uMaterialOpacity,
        this.parameters.materialOpacity
      );
      gl.uniform1f(buildingsProgram.uOpacity, this.parameters.opacity);

      // Turn on culling. By default backfacing triangles
      // will be culled.
      gl.enable(gl.CULL_FACE);

      // Enable the depth buffer
      gl.enable(gl.DEPTH_TEST);

      const transform = this.map.transform;
      const camera = this.camera;

      // console.log(transform);
      // console.log(coords[0]);

      const projectionMatrix = new Float64Array(16),
        projectionMatrixI = new Float64Array(16),
        normalMatrix = new Float64Array(16),
        modelViewMatrix = new Float64Array(16),
        modelMatrix = new Float64Array(16),
        viewMatrix = new Float64Array(16),
        viewMatrixI = new Float64Array(16),
        testMatrix = new Float64Array(16);

      // from https://github.com/mapbox/mapbox-gl-js/blob/master/src/geo/transform.js#L556-L568
      const halfFov = transform._fov / 2;
      const groundAngle = Math.PI / 2 + transform._pitch;
      const topHalfSurfaceDistance =
        (Math.sin(halfFov) * transform.cameraToCenterDistance) /
        Math.sin(Math.PI - groundAngle - halfFov);
      const furthestDistance =
        Math.cos(Math.PI / 2 - transform._pitch) * topHalfSurfaceDistance +
        transform.cameraToCenterDistance;
      const farZ = furthestDistance * 1.01;

      // mat4.perspective(
      //   projectionMatrix,
      //   transform._fov,
      //   transform.width / transform.height,
      //   1,
      //   farZ
      // );
      mat4.copy(projectionMatrix, transform.projMatrix);
      mat4.invert(projectionMatrixI, projectionMatrix);

      for (const coord of coords) {
        // Model view matrix - transform tile space into view space (meters, relative to camera)
        const viewProjectionMatrix = coord.posMatrix;

        mat4.multiply(modelViewMatrix, projectionMatrixI, viewProjectionMatrix);

        // viewMatrix = transform._camera.getWorldToCamera(transform.worldSize, 1);

        mat4.copy(viewMatrix, transform.pixelMatrix);
        mat4.invert(viewMatrixI, viewMatrix);
        mat4.multiply(modelMatrix, viewMatrixI, modelViewMatrix);

        mat4.multiply(testMatrix, modelMatrix, viewMatrix);

        // Normal matrices - transforms surface normals into view space
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);

        // mat4.copy(normalMatrix, modelViewMatrix);
        // mat4.invert(normalMatrix, normalMatrix);
        // mat4.transpose(normalMatrix, normalMatrix);

        // console.log('testMatrix ', testMatrix);
        // console.log('modelViewMatrix ', modelViewMatrix);
        // console.log('viewMatrix ', viewMatrix);
        // console.log('modelMatrix ', modelMatrix);
        // console.log('viewProjectionMatrix ', viewProjectionMatrix);
        // console.log('projectionMatrix ', projectionMatrix);
        // console.log('transform.projMatrix ', transform.projMatrix);
        // console.log('normalMatrix ', normalMatrix);

        // console.log(transform.customLayerMatrix());
        const tile = this.source.getTile(coord);
        const bucket = tile.getBucket(buildingsLayer);

        if (!bucket) continue;

        const buffers =
          bucket.programConfigurations.programConfigurations['building-3d']
            ._buffers;

        // const pattern =
        //   bucket.programConfigurations.programConfigurations['building-3d']
        //     .binders['fill-extrusion-pattern'];

        // console.log(pattern);
        // return;
        let colorBuffer, heightBuffer, baseBuffer;

        if (buffers.length === 2) {
          [baseBuffer, heightBuffer] = buffers;
        } else {
          [baseBuffer, colorBuffer, heightBuffer] = buffers;
        }

        gl.uniformMatrix4fv(
          buildingsProgram.uModelViewMatrix,
          false,
          modelViewMatrix
        );
        gl.uniformMatrix4fv(
          buildingsProgram.uProjectionMatrix,
          false,
          projectionMatrix
        );
        gl.uniformMatrix4fv(
          buildingsProgram.uNormalMatrix,
          false,
          normalMatrix
        );

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
          gl.enableVertexAttribArray(buildingsProgram.aVertexNormal);
          gl.enableVertexAttribArray(buildingsProgram.aVertexHeight);
          gl.enableVertexAttribArray(buildingsProgram.aVertexBase);

          bucket.layoutVertexBuffer.bind(); // Set up the buffer
          gl.vertexAttribPointer(
            buildingsProgram.aVertexPosition,
            2,
            gl.SHORT,
            false,
            12,
            12 * vertexOffset
          );
          gl.vertexAttribPointer(
            buildingsProgram.aVertexNormal,
            4,
            gl.SHORT,
            false,
            12,
            4 + 12 * vertexOffset
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
