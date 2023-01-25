import { Buildings } from './models/Buildings.js';

import * as THREE from '../../js/build/three.module.js';

const longitude = -74.012512161357,
  latitude = 40.706013850308665;

const apiKey = 'wSVUkjoWKTD8fUSyzJd5';

let styles = {
  day: '../../../styles/maptiler3d.json',
  night: '../../../styles/dark.json',
};
let selectedStyle = styles.day;

const map = (window.map = new maplibregl.Map({
  container: 'map',
  style: selectedStyle,
  // style:
  //   'https://api.maptiler.com/maps/streets/style.json?key=wSVUkjoWKTD8fUSyzJd5',
  center: [longitude, latitude],
  zoom: 15.5,
  pitch: 75,
  bearing: 30,
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

map.on('click', (e) => {
  console.log(e.lngLat.wrap());
});
