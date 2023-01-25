import * as THREE from '../build/three.module.js';

import { GLTFLoader } from '../libs/GLTFLoader.js';
import { OrbitControls } from '../libs/OrbitControls.js';

import utils from '../utils.js';

import sphereVertexShader from '../shaders/sphere/vertex.js';
import sphereFragmentShader from '../shaders/sphere/fragment.js';

export class LightSphere_Three {
  type = 'custom';
  renderingMode = '3d';

  constructor(id, coordinates, gltfUrl, scaleFactor, parameters) {
    this.id = id;
    this.coordinates = coordinates;
    this.gltfUrl = gltfUrl;
    this.scaleFactor = scaleFactor;
    this.parameters = parameters;
  }

  onAdd(map, gl) {
    const modelOrigin = [this.coordinates.lng, this.coordinates.lat];
    const modelAltitude = 0;

    var modelRotate = [Math.PI / 2, 0, 0];

    var modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    // transformation parameters to position, rotate and scale the 3D model onto the map
    this.modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      /* Since our 3D model is in real world meters, a scale transform needs to be
       * applied since the CustomLayerInterface expects units in MercatorCoordinates.
       */
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    this.camera = new THREE.Camera();
    this.map = map;
    this.scene = this.makeScene();

    // Controls
    this.controls = new OrbitControls(this.camera, map.getCanvas());
    this.controls.enableDamping = true;

    console.log(this.controls);

    // use the Mapbox GL JS map canvas for three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });

    this.renderer.autoClear = false;
  }

  makeScene() {
    const scene = new THREE.Scene();
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    scene.add(new THREE.HemisphereLight(skyColor, groundColor, 0.25));

    this.parameters.directionalLight.position
      .set(
        this.parameters.lightDirection.x,
        this.parameters.lightDirection.y,
        this.parameters.lightDirection.z
      )
      .normalize();

    // Directional lights implicitly point at (0, 0, 0).
    scene.add(this.parameters.directionalLight);

    var that = this;

    // use the three.js GLTF loader to add the 3D model to the three.js scene
    var loader = new GLTFLoader();
    loader.load(this.gltfUrl, function (gltf) {
      console.log(gltf.scene);
      scene.add(gltf.scene);

      fetch('../assets/models/geometries/sphere3.json')
        .then((res) => res.json())
        .then((data) => {
          // let geometry = new THREE.BufferGeometry();
          let geometry = new THREE.SphereGeometry(50, 32, 16);

          geometry.setAttribute(
            'a_vertex_position',
            new THREE.Float32BufferAttribute(data.vertices, 3)
          );

          // geometry.setAttribute(
          //   'a_vertex_normal',
          //   new THREE.Float32BufferAttribute(
          //     utils.calculateNormals(data.vertices, data.indices),
          //     3
          //   )
          // );

          let material = new THREE.RawShaderMaterial({
            uniforms: {
              u_opacity: { value: that.parameters.materialOpacity },
              u_shininess: { value: that.parameters.materialShininess },
              u_light_direction: {
                value: new THREE.Vector3(
                  that.parameters.lightDirection.x,
                  that.parameters.lightDirection.y,
                  that.parameters.lightDirection.z
                ),
              },
              u_light_ambient: {
                value: new THREE.Vector4(
                  that.parameters.ambientTerm,
                  that.parameters.ambientTerm,
                  that.parameters.ambientTerm,
                  1
                ),
              },
              u_light_diffuse: {
                value: new THREE.Vector3(
                  utils.normalizeColor(that.parameters.lightColor)[0],
                  utils.normalizeColor(that.parameters.lightColor)[1],
                  utils.normalizeColor(that.parameters.lightColor)[2]
                ),
              },
              u_light_specular: {
                value: new THREE.Vector4(
                  that.parameters.specularTerm,
                  that.parameters.specularTerm,
                  that.parameters.specularTerm,
                  1
                ),
              },
              u_material_ambient: {
                value: new THREE.Vector4(
                  that.parameters.materialAmbientTerm,
                  that.parameters.materialAmbientTerm,
                  that.parameters.materialAmbientTerm,
                  1
                ),
              },
              u_material_diffuse: {
                value: new THREE.Vector3(
                  utils.normalizeColor(that.parameters.materialColor)[0],
                  utils.normalizeColor(that.parameters.materialColor)[1],
                  utils.normalizeColor(that.parameters.materialColor)[2]
                ),
              },
              u_material_specular: {
                value: new THREE.Vector4(
                  that.parameters.materialSpecularTerm,
                  that.parameters.materialSpecularTerm,
                  that.parameters.materialSpecularTerm,
                  1
                ),
              },
            },
            transparent: true,
            vertexShader: sphereVertexShader,
            fragmentShader: sphereFragmentShader,
            opacity: 0.9,
            transparent: true,
            depthWrite: false,
          });

          let sphere = new THREE.Mesh(geometry, material);

          sphere.scale.set(120, 120, 120);
          scene.add(sphere);
        });
    });

    return scene;
  }

  render(gl, matrix) {
    var rotationX = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(1, 0, 0),
      this.modelTransform.rotateX
    );
    var rotationY = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 1, 0),
      this.modelTransform.rotateY
    );
    var rotationZ = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 0, 1),
      this.modelTransform.rotateZ
    );

    var m = new THREE.Matrix4().fromArray(matrix);
    var l = new THREE.Matrix4()
      .makeTranslation(
        this.modelTransform.translateX,
        this.modelTransform.translateY,
        this.modelTransform.translateZ
      )
      .scale(
        new THREE.Vector3(
          this.modelTransform.scale * this.scaleFactor,
          -this.modelTransform.scale * this.scaleFactor,
          this.modelTransform.scale * this.scaleFactor
        )
      )
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this.camera.projectionMatrix = m.multiply(l);
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}
