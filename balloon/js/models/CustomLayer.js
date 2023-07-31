import * as THREE from '../../../js/build/three.module.js';

import { OrbitControls } from '../../../js/libs/OrbitControls.js';
import { GLTFLoader } from '../../../js/libs/GLTFLoader.js';

let myrandom = function (x, y) {
  return x + (y - x) * Math.random();
};
let cube, gltfBalloon;
let balloons = [];
let ADD = 1;
let i = 1;
const gltfUrl = './assets/hotairballon.glb';
// const gltfUrl = './assets/balloons.glb';

/**
 * Loading manager
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

const sprite1 = textureLoader.load('../assets/textures/snowflake1.png');
const sprite2 = textureLoader.load('../assets/textures/snowflake2.png');
const sprite3 = textureLoader.load('../assets/textures/snowflake2.png');
const sprite4 = textureLoader.load('../assets/textures/snowflake4.png');
const sprite5 = textureLoader.load('../assets/textures/snowflake5.png');

const snowParams = [
  [[186, 0.9, 0.85], sprite2, 20],
  [[184, 0.82, 0.5], sprite1, 10],
  [[262, 0.11, 0.8], sprite3, 10],
  [[196, 0.74, 0.51], sprite5, 8],
  [[225, 0.79, 0.84], sprite4, 5],
];

const GLOBE_RADIUS = 250;

let renderer, scene, camera, firefliesMaterial;

const clock = new THREE.Clock();
let time = 0,
  unit = 0.5;

export class CustomLayer {
  type = 'custom';
  renderingMode = '3d';

  constructor(id, coordinates, gltfUrl, scaleFactor, parameters) {
    this.id = id;
    this.coordinates = coordinates;
    this.gltfUrl = gltfUrl;
    this.scaleFactor = scaleFactor;
    this.parameters = parameters;
    this.meshGroup = new THREE.Group();
  }

  onAdd(map, gl) {
    const modelOrigin = [this.coordinates.lng, this.coordinates.lat];
    const modelAltitude = 0;

    var modelRotate = [Math.PI / 2, 0, 0];

    var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
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
      alpha: true,
    });

    renderer.autoClear = false;

    /**
     * Environment map
     */
    //  http://www.humus.name/index.php?page=Textures&ID=32
    const path = '../assets/environment/Park2/';
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

    // scene.background = this.environmentMap;
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

    this.meshGroup.position.set(0, 0, 0);
    scene.add(this.meshGroup);

    this.createGeometry();
    // scene.fog = new THREE.FogExp2(0x000000, 0.06);

    let material = new THREE.MeshPhongMaterial({
      color: Math.random() * 0xaf62ff,
      shininess: 20,
      side: THREE.DoubleSide,
      opacity: 0.8,
      transparent: true,
    });

    // use the three.js GLTF loader to add the 3D model to the three.js scene
    var loader = new GLTFLoader();
    loader.load(gltfUrl, function (gltf) {
      // console.log(gltf.scene.children);
      // Get each object
      gltfBalloon = gltf.scene.children.find(
        (child) => child.name === 'hotairballon2'
        // (child) => child.name === 'Sphere006'
      );
      console.log(gltfBalloon);
      // gltfBalloon.scale.set(10, 10, 10);
      gltfBalloon.scale.set(1, 1, 1);
    });

    // var fparams = {
    //   fogNearColor: 0xfc4848,
    //   fogHorizonColor: 0xe4dcff,
    //   fogDensity: 0.000025,
    //   fogNoiseSpeed: 100,
    //   fogNoiseFreq: 0.0012,
    //   fogNoiseImpact: 0.5,
    // };
    // scene.background = new THREE.Color(fparams.fogHorizonColor);
    // scene.fog = new THREE.FogExp2(fparams.fogHorizonColor, fparams.fogDensity);

    // const color = 0xffffff; // white
    // const near = 2;
    // const far = 5;
    // scene.fog = new THREE.Fog(color, near, far);

    return scene;
  }

  createGeometry() {
    let material = new THREE.MeshPhongMaterial({
      color: Math.random() * 0xaf62ff,
      shininess: 20,
      side: THREE.DoubleSide,
      opacity: 0.8,
      transparent: true,
    });

    if (gltfBalloon) {
      cube = gltfBalloon.clone();

      // Apply materials
      cube.material = material;
      // let geometry = new THREE.SphereGeometry(5, 60, 100);
      // cube = new THREE.Mesh(geometry, material);
      cube.position.x = myrandom(-200, 1500);
      cube.position.z = myrandom(-3000, 200);
      cube.position.y = -20;

      balloons.push(cube);
      this.meshGroup.add(cube);
    }
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

    time += 0.005;

    // Update materials

    if (firefliesMaterial) {
      firefliesMaterial.uniforms.uTime.value = time;
      firefliesMaterial.uniforms.uSize.value += unit;
      unit = -unit;
    }

    balloons.forEach((ballon) => {
      ballon.position.y += ADD;
      // ballon.position.x += 10 * i;
      i = -i;
      if (ballon.position.y > 10) {
        scene.remove(ballon);
      }
    });
    this.createGeometry();
    // if (Math.random() < 100) this.createGeometry();

    renderer.render(scene, camera);
    this.map.triggerRepaint();
  }
}
