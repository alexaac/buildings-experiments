import utils from './utils.js';

import { Antenna } from './models/Antenna.js';
import { Buildings } from './models/Buildings.js';
import { LightSphere_Three } from './models/LightSphere_Three.js';
import { LightSphere } from './models/LightSphere.js';
import { Triangle } from './models/Triangle.js';

import { Viewer } from './components/Viewer.js';

import * as THREE from './build/three.module.js';

const longitude = -74.01376,
  latitude = 40.704988;

// const longitude = -74.0077006,
//   latitude = 40.7089788;

// const longitude = 4.8959624,
//   latitude = 52.3711013;

// const longitude = -73.9980722,
//   latitude = 40.7385579;

const apiKey = 'wSVUkjoWKTD8fUSyzJd5';

const point = { longitude: -74.0153125, latitude: 40.7026615 };
var assetArr = [];
assetArr.push({
  id: 'sphere',
  cord: {
    lng: point.longitude,
    lat: point.latitude,
  },
  url: 'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
  scaleFactor: 3,
  rad: 0.02,
  origCoord: {
    lng: longitude,
    lat: latitude,
  },
});

let styles = {
  day: './styles/maptiler3d.json',
  night: './styles/dark.json',
};
let selectedStyle = styles.day;

const map = (window.map = new maplibregl.Map({
  container: 'map',
  style: selectedStyle,
  // style:
  //   'https://api.maptiler.com/maps/streets/style.json?key=wSVUkjoWKTD8fUSyzJd5',
  center: [longitude, latitude],
  zoom: 16,
  pitch: 75,
  bearing: 0,
  antialias: true,
}));

map.addControl(new maplibregl.NavigationControl());

class searchControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl';
    const _input = document.createElement('input');
    this._container.appendChild(_input);
    const geocoder = new maptiler.Geocoder({
      input: _input,
      key: apiKey,
    });
    geocoder.on('select', function (item) {
      map.fitBounds(item.bbox);
    });
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
// map.addControl(new searchControl(), 'top-right');

/**
 * Debug
 */

const parameters = {
  // materialColor: '#409ebf',
  materialColor: '#ffffff',
  materialOpacity: 1,
  materialAmbientTerm: 1,
  materialSpecularTerm: 0,
  materialShininess: 2.8,

  lightColor: '#ffffff',
  ambientTerm: 0.3,
  specularTerm: 1,
  lightPosition: {
    x: -1,
    y: 1,
    z: 0,
  },
  lightDirection: {
    x: -0.6,
    y: -0.1,
    z: 1,
  },
  // lightDirection: {
  //   x: 1,
  //   y: -0.5,
  //   z: 0.3,
  // },
  wireframe: false,
  fixedLight: false,
  uTime: null,
  date: new Date(),
  initialTime: null,
  directionalLight: new THREE.DirectionalLight(0xffffff, 0.5),
  spherePosition: -2,
  dxSphere: 0.01,
  frequency: 5,
  elapsedTime: null,
  longitude: longitude,
  latitude: latitude,

  preWave: 200.1,
  hWave: 300,
  postWave: 400.1,
  opacity: 1,

  center: {
    meters: maplibregl.MercatorCoordinate.fromLngLat([longitude, latitude], 0),
  },
  zoom: map.getZoom(),

  resolution: [window.innerWidth / 2, window.innerHeight / 2],
};

const viewerEl = document.createElement('div');
viewerEl.classList.add('viewer');
document.body.appendChild(viewerEl);
// const viewer = new Viewer(viewerEl, map, parameters);

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', function () {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;

  if (map.getSource('openmaptiles')) {
    map.addLayer(
      new Buildings('building-shadows', 'building-3d', parameters),
      'building-3d'
    );
    // map.addLayer(new LightSphere('light-sphere', parameters), 'building-3d');

    // map.addLayer(new Triangle('triangle'), 'building-3d');

    // map.addLayer(
    //   new Antenna(
    //     assetArr[0].id,
    //     assetArr[0].cord,
    //     assetArr[0].url,
    //     assetArr[0].scaleFactor,
    //     parameters
    //   )
    // );

    // map.addLayer(
    //   new LightSphere_Three(
    //     'light-sphere',
    //     assetArr[0].cord,
    //     assetArr[0].url,
    //     assetArr[0].scaleFactor,

    //     parameters
    //   ),
    //   'building-3d'
    // );

    // Start the animation.
    animate(0);

    parameters.initialTime = new Date().getTime();
    // setInterval(onFrame, parameters.frequency / 1000);

    console.log(map.getStyle().layers);
  }
});

// Time
let time = Date.now();

function onFrame() {
  parameters.elapsedTime = new Date().getTime() - parameters.initialTime;
  if (parameters.elapsedTime < parameters.frequency) return;

  let steps = Math.floor(parameters.elapsedTime / parameters.frequency);
  while (steps > 0) {
    animate();
    steps -= 1;
  }

  parameters.initialTime = new Date().getTime();
}

function animate(timestamp) {
  parameters.uTime = timestamp;

  // // clamp the rotation between 0 -360 degrees
  // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

  // Request the next frame of the animation.
  requestAnimationFrame(animate);
}

// function animate() {
//   const currentTime = Date.now();
//   parameters.elapsedTime = new Date().getTime() - parameters.initialTime;
//   const deltaTime = currentTime - time;
//   time = currentTime;

//   map.panTo([longitude, latitude]);

//   parameters.spherePosition += parameters.dxSphere;
//   parameters.lightDirection.x = -parameters.spherePosition;
//   utils.updateDirectionalLight(parameters);

//   if (parameters.spherePosition >= 2 || parameters.spherePosition < -2) {
//     parameters.dxSphere = -parameters.dxSphere;
//   }
// }

// map.on('click', (e) => {
//   console.log(e.lngLat.wrap());

//   map.removeLayer('sphere');
//   map.addLayer(
//     new Antenna(
//       assetArr[0].id,
//       e.lngLat.wrap(),
//       assetArr[0].url,
//       assetArr[0].scaleFactor,
//       parameters
//     )
//   );
// });
