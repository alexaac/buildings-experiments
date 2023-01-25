import { Camera } from '../components/Camera.js';
import { Controls } from '../components/Controls.js';
import { Program } from '../components/Program.js';
import { Scene } from '../components/Scene.js';
import { Floor } from '../components/Floor.js';
import { Axis } from '../components/Axis.js';
import { Transforms } from '../components/Transforms.js';

import utils from '../utils.js';

import sphereVertexShader from '../shaders/sphere/vertex.js';
import sphereFragmentShader from '../shaders/sphere/fragment.js';

let sphereProgram,
  scene,
  camera,
  controls,
  transforms,
  objects = [],
  modelViewMatrix = mat4.create(),
  projectionMatrix = mat4.create(),
  normalMatrix = mat4.create(),
  fov = 45,
  PERSPECTIVE_PROJECTION = 'Perspective Projection',
  ORTHOGRAPHIC_PROJECTION = 'Orthographic Projection',
  projectionMode = PERSPECTIVE_PROJECTION,
  angle = 0;

export class LightSphere {
  constructor(id, parameters) {
    this.id = id;

    this.parameters = parameters;
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(map, gl) {
    this.map = map;

    console.log(
      'uniforms ',
      gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      '-',
      gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
    );
    // Configure VAO
    if (gl.createVertexArray == null) {
      this.extVAO = gl.getExtension('OES_vertex_array_object');

      if (!this.extVAO) {
        throw new Error('OES_vertex_array_object extension not supported');
      }

      gl.createVertexArray = this.extVAO.createVertexArrayOES.bind(this.extVAO);
      gl.bindVertexArray = this.extVAO.bindVertexArrayOES.bind(this.extVAO);
    }

    const initSphereProgram = () => {
      // Create a program
      sphereProgram = new Program(gl, sphereVertexShader, sphereFragmentShader);

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      // Create a mapping between JavaScript variables and the program attributes and uniforms

      // Attributes to be loaded into program
      const attributes = ['aVertexPosition', 'aVertexNormal'];

      // Uniforms to be loaded into program
      const uniforms = [
        'uProjectionMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uOpacity',
        'uLightDiffuse',
        'uLightAmbient',
        'uLightSpecular',
        'uLightDirection',
        'uLightPosition',
        'uMaterialAmbient',
        'uMaterialDiffuse',
        'uMaterialSpecular',
        'uShininess',
      ];

      // Load attributes and uniforms
      sphereProgram.load(attributes, uniforms);
    };

    const configureSphereProgram = () => {
      // Configure `scene`. We will discuss this in a later chapter, but
      // this is a simple way to add objects into our scene, rather than
      // maintaining sets of global arrays as we've done in previous chapters.
      scene = new Scene(gl, sphereProgram);

      // Configure `camera` and set it to be in orbiting mode
      camera = new Camera(Camera.ORBITING_TYPE);
      camera.goHome([0, 20, 120]);

      // Configure controls by allowing user driven events to move camera around
      controls = new Controls(camera, gl.canvas);

      // // Configure `transforms`
      // transforms = new Transforms(gl, sphereProgram, camera, canvas);

      this.initTransforms(gl);
    };

    // Load objects into our `scene`
    function loadSphereObjects() {
      scene.add(new Floor(2000, 100));
      scene.add(new Axis(2000));
      scene.load('../assets/models/geometries/sphere3.json', 'light');
    }

    const loadSphere = () => {
      fetch('../assets/models/geometries/sphere3.json')
        .then((res) => res.json())
        .then((data) => {
          data.alias = 'light';

          const vao = gl.createVertexArray();
          gl.bindVertexArray(vao);

          // Vertices
          const vertexBufferObject = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(data.vertices),
            gl.STATIC_DRAW
          );
          // Configure instructions for VAO
          gl.enableVertexAttribArray(sphereProgram.aVertexPosition);
          gl.vertexAttribPointer(
            sphereProgram.aVertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0
          );

          // Normals
          const normalBufferObject = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObject);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(
              utils.calculateNormals(data.vertices, data.indices)
            ),
            gl.STATIC_DRAW
          );
          // Configure instructions for VAO
          gl.enableVertexAttribArray(sphereProgram.aVertexNormal);
          gl.vertexAttribPointer(
            sphereProgram.aVertexNormal,
            3,
            gl.FLOAT,
            false,
            0,
            0
          );

          // Indices
          const indexBufferObject = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
          gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(data.indices),
            gl.STATIC_DRAW
          );

          // Attach values to be able to reference later for drawing
          data.vao = vao;
          data.ibo = indexBufferObject;

          // Push onto objects for later reference
          objects.push(data);

          // Clean
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        });
    };

    initSphereProgram();
    configureSphereProgram();
    loadSphere();
    // loadSphereObjects();
  }

  // Initialize the necessary transforms
  initTransforms(gl) {
    modelViewMatrix = camera.getViewTransform();

    mat4.identity(projectionMatrix);

    this.updateTransforms(gl);
    mat4.identity(normalMatrix);
    mat4.copy(normalMatrix, modelViewMatrix);
    mat4.invert(normalMatrix, normalMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    console.log(modelViewMatrix);
    console.log(projectionMatrix);
    console.log(normalMatrix);
  }

  // Update transforms
  updateTransforms(gl) {
    const { width, height } = gl.canvas;
    if (projectionMode === PERSPECTIVE_PROJECTION) {
      mat4.perspective(projectionMatrix, fov, width / height, 1, 100);
    } else {
      mat4.ortho(
        projectionMatrix,
        -width / fov,
        width / fov,
        -height / fov,
        height / fov,
        -1000,
        1000
      );
    }
  }

  // Set the matrix uniforms
  setMatrixUniforms(gl) {
    gl.uniformMatrix4fv(
      sphereProgram.uModelViewMatrix,
      false,
      camera.getViewTransform()
    );
    gl.uniformMatrix4fv(
      sphereProgram.uProjectionMatrix,
      false,
      projectionMatrix
    );
    mat4.transpose(normalMatrix, camera.matrix);
    gl.uniformMatrix4fv(sphereProgram.uNormalMatrix, false, normalMatrix);
  }

  render(gl, matrix) {
    utils.initLights(gl, sphereProgram, this.parameters);

    const drawSphere = () => {
      // Use this program instance
      sphereProgram.useProgram();

      this.updateTransforms(gl);
      this.setMatrixUniforms(gl);

      mat4.perspective(
        projectionMatrix,
        45,
        gl.canvas.width / gl.canvas.height,
        0.1,
        100
      );
      mat4.identity(modelViewMatrix);
      mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -2.5]);

      mat4.copy(normalMatrix, modelViewMatrix);
      mat4.invert(normalMatrix, normalMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      // mat4.rotate(
      //   modelViewMatrix,
      //   modelViewMatrix,
      //   (30 * Math.PI) / 180,
      //   [1, 0, 0]
      // );
      // mat4.rotate(
      //   modelViewMatrix,
      //   modelViewMatrix,
      //   (angle * Math.PI) / 180,
      //   [0, 1, 0]
      // );

      try {
        // Iterate over every object
        objects.forEach((object) => {
          // If object is the light, we update its position
          if (object.alias === 'light') {
            const lightDirection = [
              -this.parameters.lightDirection.x,
              this.parameters.lightDirection.y,
              this.parameters.lightDirection.z,
            ];

            mat4.translate(modelViewMatrix, modelViewMatrix, [-2, -0.5, 0]);

            // mat4.translate(modelViewMatrix, modelViewMatrix, [
            //   this.parameters.spherePosition,
            //   0,
            //   0,
            // ]);
            // mat4.translate(modelViewMatrix, modelViewMatrix, [
            //   lightDirection[0],
            //   lightDirection[1],
            //   lightDirection[2],
            // ]);
            const centerLngLat = [
              this.parameters.longitude,
              this.parameters.latitude,
            ];
            const modelAltitude = 0;
            const center = maplibregl.MercatorCoordinate.fromLngLat(
              centerLngLat,
              modelAltitude
            );

            // mat4.scale(projectionMatrix, projectionMatrix, [
            //   lightDirection[0] * 0.5,
            //   lightDirection[1] * 0.5,
            //   lightDirection[2] * 0.5,
            // ]);

            mat4.scale(modelViewMatrix, modelViewMatrix, [0.2, 0.2, 0.2]);
          }

          gl.uniformMatrix4fv(
            sphereProgram.uModelViewMatrix,
            false,
            modelViewMatrix
          );
          gl.uniformMatrix4fv(
            sphereProgram.uProjectionMatrix,
            false,
            projectionMatrix
          );
          gl.uniformMatrix4fv(sphereProgram.uNormalMatrix, false, normalMatrix);

          // Set lighting data
          gl.uniform4fv(sphereProgram.uMaterialAmbient, object.ambient);
          gl.uniform4fv(sphereProgram.uMaterialDiffuse, object.diffuse);
          gl.uniform4fv(sphereProgram.uMaterialSpecular, object.specular);

          // Bind
          gl.bindVertexArray(object.vao);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);

          // Draw
          gl.drawElements(
            gl.TRIANGLES,
            object.indices.length,
            gl.UNSIGNED_SHORT,
            0
          );

          // Clean
          gl.bindVertexArray(null);
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        });
      } catch (error) {
        // We catch the `error` and simply output to the screen for testing/debugging purposes
        console.error(error);
      }
    };

    drawSphere();
  }
}
