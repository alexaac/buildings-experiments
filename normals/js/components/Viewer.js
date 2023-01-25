import {
  AmbientLight,
  AnimationMixer,
  AxesHelper,
  Box3,
  Cache,
  CubeTextureLoader,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  LinearEncoding,
  LinearToneMapping,
  LoadingManager,
  PMREMGenerator,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  SkeletonHelper,
  HalfFloatType,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
} from '../build/three.module.js';

import * as dat from '../libs/lil-gui.module.min.js';

import { environments } from '../../assets/environment/index.js';
import utils from '../utils.js';

const DEFAULT_CAMERA = '[default]';

export class Viewer {
  constructor(el, map, parameters) {
    this.el = el;
    this.map = map;

    this.lights = [];
    this.gui = null;

    this.state = parameters || {
      // materialColor: '#409ebf',
      materialColor: '#409ebf',

      materialOpacity: 1,
      materialAmbientTerm: 1,
      materialSpecularTerm: 0,
      materialShininess: 2.8,

      lightColor: '#ffffff',
      ambientTerm: 0.3,
      specularTerm: 1,

      lightPosition: {
        x: 0,
        y: 0,
        z: 0,
      },

      lightDirection: {
        x: 1,
        y: -0.5,
        z: 0.3,
      },
      // time: timeNow,

      wireframe: false,
      fixedLight: false,
      uTime: null,
      date: date,
      initialTime: null,
      directionalLight: new THREE.DirectionalLight(0xffffff, 0.5),
      spherePosition: -2,
      dxSphere: 0.01,
      frequency: 5,
      elapsedTime: null,
      longitude: longitude,
      latitude: latitude,

      environment: environments[5].name,
    };

    this.addGUI();
  }

  addGUI() {
    const gui = (this.gui = new dat.GUI({
      autoPlace: false,
      width: 260,
      hideable: true,
    }));

    // Display controls.
    const dispFolder = gui.addFolder('Display');

    dispFolder
      .add(this.state, 'wireframe')
      .name('Wireframe')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    dispFolder
      .add(this.state, 'fixedLight')
      .name('Fixed Light')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    // Lighting controls.
    const lightFolder = gui.addFolder('Lighting');

    lightFolder
      .addColor(this.state, 'lightColor')
      .name('Light Color')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state, 'ambientTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Light Ambient Term')
      .onChange((v) => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state, 'specularTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Light Specular Term')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    lightFolder
      .add(this.state.lightPosition, 'x')
      .min(-1)
      .max(1)
      .step(0.01)
      .name('Light pos x')
      .onChange(() => {
        console.log('-----------');
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightPosition, 'y')
      .min(-1)
      .max(1)
      .step(0.01)
      .name('Light pos y')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightPosition, 'z')
      .min(-1)
      .max(1)
      .step(0.01)
      .name('Light pos z')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();

    lightFolder
      .add(this.state.lightDirection, 'x')
      .min(-1)
      .max(1)
      .step(0.01)
      .name('Light dir x')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightDirection, 'y')
      .min(-4)
      .max(4)
      .step(0.01)
      .name('Light dir y')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();
    lightFolder
      .add(this.state.lightDirection, 'z')
      .min(-1)
      .max(1)
      .step(0.01)
      .name('Light dir z')
      .onChange(() => {
        utils.updateDirectionalLight(this.state);

        this.map.triggerRepaint();
      })
      .listen();

    // Material controls.
    const materialFolder = gui.addFolder('Material');

    materialFolder
      .addColor(this.state, 'materialColor')
      .name('Material Color')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialAmbientTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Ambient')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialSpecularTerm')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Specular')
      .onChange(() => {
        this.map.triggerRepaint();
      })
      .listen();
    materialFolder
      .add(this.state, 'materialShininess')
      .min(0)
      .max(20)
      .step(0.1)
      .name('Material Shininess')
      .onChange((v) => {
        this.map.triggerRepaint();
      });
    materialFolder
      .add(this.state, 'materialOpacity')
      .min(0)
      .max(1)
      .step(0.01)
      .name('Material Opacity')
      .onChange(() => {
        this.map.triggerRepaint();
      });

    const guiWrap = document.createElement('div');
    this.el.appendChild(guiWrap);
    guiWrap.classList.add('gui-wrap');
    guiWrap.appendChild(gui.domElement);
    gui.open();
  }
}
