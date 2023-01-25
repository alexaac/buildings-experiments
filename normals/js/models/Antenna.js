import * as THREE from '../build/three.module.js';

import { GLTFLoader } from '../libs/GLTFLoader.js';
import { OrbitControls } from '../libs/OrbitControls.js';

import firefliesVertexShader from '../shaders/fireflies/vertex.js';
import firefliesFragmentShader from '../shaders/fireflies/fragment.js';

/**
 * Textures
 */
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = () => {
  console.log('onStart');
};
loadingManager.onLoaded = () => {
  console.log('onLoaded');
};
loadingManager.onProgress = () => {
  console.log('onProgress');
};
loadingManager.onError = (err) => {
  console.error('onError: ', err);
};

/**
 * Textures
 */

const textureLoader = new THREE.TextureLoader(loadingManager);

const params = {
  color: 0xffffff,
  transparency: 0.9,
  envMapIntensity: 1,
  lightIntensity: 1,
  exposure: 1,
};

const sprite1 = textureLoader.load('assets/textures/snowflake1.png');
const sprite2 = textureLoader.load('assets/textures/snowflake2.png');
const sprite3 = textureLoader.load('assets/textures/snowflake2.png');
const sprite4 = textureLoader.load('assets/textures/snowflake4.png');
const sprite5 = textureLoader.load('assets/textures/snowflake5.png');

const snowParams = [
  [[186, 0.9, 0.85], sprite2, 20],
  [[184, 0.82, 0.5], sprite1, 10],
  [[262, 0.11, 0.8], sprite3, 10],
  [[196, 0.74, 0.51], sprite5, 8],
  [[225, 0.79, 0.84], sprite4, 5],
];

const GLOBE_RADIUS = 500;

let renderer, scene, camera, firefliesMaterial;

const clock = new THREE.Clock();
let time = 0,
  unit = 0.5;

export class Antenna {
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

    camera = new THREE.Camera();
    this.map = map;
    scene = this.makeScene();
    camera.lookAt(scene);

    // Controls
    this.controls = new OrbitControls(camera, map.getCanvas());
    this.controls.enableDamping = true;

    console.log(this.controls);

    // use the Mapbox GL JS map canvas for three.js
    renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });

    renderer.autoClear = false;

    /**
     * Environment map
     */
    //  http://www.humus.name/index.php?page=Textures&ID=32
    const path = './assets/environment/Park2/';
    const format = '.jpg';
    const urls = [
      path + 'posx' + format,
      path + 'negx' + format,
      path + 'posy' + format,
      path + 'negy' + format,
      path + 'posz' + format,
      path + 'negz' + format,
    ];

    this.environmentMap = new THREE.CubeTextureLoader().load(urls);
  }

  makeScene() {
    const scene = new THREE.Scene();
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange

    // scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    scene.add(new THREE.HemisphereLight(skyColor, groundColor, 0.5));

    /**
     * Lights
     */

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    // const spotLight1 = new THREE.SpotLight(0xffffff, params.lightIntensity);
    // spotLight1.position.set(0, 400, 0);
    // spotLight1.angle = Math.PI / 6;
    // scene.add(spotLight1);

    // const spotLight2 = new THREE.SpotLight(0xffffff, params.lightIntensity);
    // spotLight2.position.set(200, 600, 0);
    // spotLight2.angle = Math.PI / 6;
    // scene.add(spotLight2);

    scene.background = this.environmentMap;
    scene.environment = this.environmentMap;

    this.parameters.directionalLight.position
      .set(
        this.parameters.lightDirection.x,
        this.parameters.lightDirection.y,
        this.parameters.lightDirection.z
      )
      .normalize();

    // Directional lights implicitly point at (0, 0, 0).
    scene.add(this.parameters.directionalLight);

    // // use the three.js GLTF loader to add the 3D model to the three.js scene
    // var loader = new GLTFLoader();
    // loader.load(this.gltfUrl, function (gltf) {
    //   console.log(gltf.scene);
    //   scene.add(gltf.scene);
    // });

    const meshGroup = new THREE.Group();
    meshGroup.position.set(0, 0, 0);
    scene.add(meshGroup);

    /**
     * Globe
     */

    // https://github.com/RalucaNicola/learn-threejs
    const doorAlphaTexture = new THREE.TextureLoader().load(
      './assets/textures/alpha.png'
    );

    // add a shiny, transparent globe around the scene
    const globeGeom = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      64,
      64,
      0,
      2 * Math.PI,
      0,
      Math.PI / 2
    );
    const globeMat = new THREE.MeshPhysicalMaterial({
      color: params.color,
      metalness: 0,
      roughness: 0,
      alphaMap: doorAlphaTexture,
      alphaTest: 0.5,
      envMap: this.environmentMap,
      envMapIntensity: params.envMapIntensity,
      depthTest: false,
      transmission: params.transparency,
      transparent: true,
    });

    const material = new THREE.MeshPhysicalMaterial().copy(globeMat);
    const materialb = new THREE.MeshPhysicalMaterial().copy(globeMat);
    materialb.side = THREE.BackSide;

    const globeMesh = new THREE.Mesh(globeGeom, material);
    meshGroup.add(globeMesh);

    // add a base of snow to the bottom part of the globe

    var snowBase = new THREE.Mesh(
      new THREE.SphereGeometry(
        GLOBE_RADIUS + 10,
        64,
        64,
        0,
        2 * Math.PI,
        Math.PI / 2,
        0.01
      ),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    snowBase.rotation.x = Math.PI;
    snowBase.position.set(0, 0, 0);
    meshGroup.add(snowBase);

    // let icshdrn = new THREE.Mesh(
    //   new THREE.SphereGeometry(250, 32, 16, 0, 2 * Math.PI, 0, 1.8),
    //   new THREE.MeshBasicMaterial({
    //     color: '#ffffff',
    //     opacity: 0.9,
    //     transparent: true,
    //     depthWrite: false,
    //   })
    // );
    // icshdrn.position.set(0, 100, 0);
    // scene.add(icshdrn);

    /**
     * Fireflies
     */

    // Geometry
    const firefliesGeometry = new THREE.BufferGeometry();
    const firefliesCount = 30000;
    const positionArray = new Float32Array(firefliesCount * 3);
    const scaleArray = new Float32Array(firefliesCount);

    let x, y, z, keepgoing;
    const scale = GLOBE_RADIUS / 0.52; // adjust coordinates to size of sphere
    const yshift = 0;

    for (let i = 0; i < firefliesCount; i++) {
      keepgoing = true;
      while (keepgoing) {
        x = Math.random() - 0.5;
        y = Math.random() - 0.5;
        z = Math.random() - 0.5;
        if (x * x + y * y + z * z < 0.25) {
          keepgoing = false;

          positionArray[i * 3 + 0] = scale * x;
          positionArray[i * 3 + 1] = scale * y + yshift;
          positionArray[i * 3 + 2] = scale * z;

          scaleArray[i] = Math.random() * 0.5;
        }
      }
    }

    firefliesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positionArray, 3)
    );
    firefliesGeometry.setAttribute(
      'aScale',
      new THREE.BufferAttribute(scaleArray, 1)
    );

    // Material
    firefliesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRotation: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 10 },
      },
      vertexShader: firefliesVertexShader,
      fragmentShader: firefliesFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Points
    const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
    meshGroup.add(fireflies);

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

    camera.projectionMatrix = m.multiply(l);
    renderer.state.reset();

    /**
     * Animate
     */

    const elapsedTime = clock.getElapsedTime();

    time += 0.0005;

    // Update materials

    if (firefliesMaterial) {
      firefliesMaterial.uniforms.uTime.value = time;
      // firefliesMaterial.uniforms.uSize.value += unit;
      // unit = -unit;
    }

    renderer.render(scene, camera);
    this.map.triggerRepaint();
  }
}
