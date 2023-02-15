
import { interpolateColour, rgba2hex } from './lerp.js';

import { Buildings } from './models/Buildings.js';

// import * as THREE from './build/three.module.js';

mapboxgl.accessToken =
  'pk.eyJ1IjoiYWxleGFhYyIsImEiOiJja3o1OGdrcWUwZGN2MnRwa2xsa2pqNTI3In0.RenxXCa3uR7D7-tdvoYKGw';
const apiKey = 'wSVUkjoWKTD8fUSyzJd5';

const longitude = -74.0056055,
  latitude = 40.7128896;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  // style: 'mapbox://styles/mapbox/dark-v10',
  center: [longitude, latitude],
  zoom: 16,
  pitch: 55,
  bearing: -20,
  antialias: true,
});

let id;
const title = document.querySelector('.content--contentWrapper h1');
let color = interpolateColour('#2523e8', '#ffd439', 0.5);

// map.addControl(new mapboxgl.NavigationControl());

/**
 * Debug
 */

const parameters = {
  animate: false,
  // materialColor: '#409ebf',
  materialColor: '#dddddd',
  materialOpacity: 1,
  materialAmbientTerm: 0,
  materialSpecularTerm: 1,
  materialShininess: 2.8,

  lightColor: '#dddddd',
  ambientTerm: 0.3,
  specularTerm: 1,
  lightPosition: {
    x: 0,
    y: 2000,
    z: -20,
  },
  lightDirection: {
    x: -40,
    y: -30,
    z: 15,
  },
  lightCutOff: 0.95,
  // lightDirection: {
  //   x: 1,
  //   y: -0.5,
  //   z: 0.3,
  // },
  wireframe: false,
  lightSource: false,
  fixedLight: false,
  uTime: null,
  date: new Date(),
  initialTime: null,
  // directionalLight: new THREE.DirectionalLight(0xffffff, 0.5),
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
    meters: mapboxgl.MercatorCoordinate.fromLngLat([longitude, latitude], 0),
  },
  zoom: map.getZoom(),

  resolution: [window.innerWidth / 2, window.innerHeight / 2],

  colorA: '#2523e8',
  colorB: '#ffd439',

  interpolatedColor: color,
};

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.

await map.once('load');

// Add daytime fog
map.setFog({
  range: [2, 8],
  'horizon-blend': 0.5,
  color: 'white',
  'high-color': '#add8e6',
  'space-color': '#d8f2ff',
  'star-intensity': 0.15,
});

// // Add nighttime fog
// map.setFog({
//   range: [2, 8],
//   'horizon-blend': 0.3,
//   color: '#242B4B',
//   'high-color': '#161B36',
//   'space-color': '#0B1026',
//   'star-intensity': 0.8,
// });

// Insert the layer beneath any symbol layer.
const layers = map.getStyle().layers;
const labelLayerId = layers.find(
  (layer) => layer.type === 'symbol' && layer.layout['text-field']
).id;

if (map.getLayer('building')) {
  map.removeLayer('building');
}

if (map.getSource('composite')) {
  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#ddd',
        'fill-extrusion-height': ['number', ['get', 'height'], 5],
        'fill-extrusion-base': ['number', ['get', 'min_height'], 0],
        'fill-extrusion-opacity': 0.0,
      },
    },
    labelLayerId
  );
}

map.addLayer(
  new Buildings('buildings', '3d-buildings', 1, parameters),
  '3d-buildings'
);

map.setLayoutProperty('road-label', 'visibility', 'none');

// Start the animation.
animate(0);

parameters.initialTime = new Date().getTime();
// setInterval(onFrame, parameters.frequency / 1000);

console.log(map.getStyle().layers);

function animate(timestamp) {
  parameters.uTime = timestamp === 0 ? 1000 : timestamp;

  let pct = Math.abs(Math.sin(parameters.uTime * 0.0008));
  // console.log(pct);
  // color = interpolateColour(parameters.colorA, parameters.colorB, pct );
  // console.log(parameters.colorA);
  // console.log(parameters.colorB);
  // console.log(pct);
  // console.log(color);
  // return;

  const hexColor = color;
  // const hexColor = `#${rgba2hex(color)}`;
  // title.style.color = hexColor;
  title.style.opacity = 1 - pct / 5;

  // title.style.opacity = 1 - pct - 0.1;

  // parameters.interpolatedColor = hexColor;

  // // clamp the rotation between 0 -360 degrees
  // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

  // Request the next frame of the animation.
  id = requestAnimationFrame(animate);
}

const animateBtn = document.querySelector('#animate');
const stopBtn = document.querySelector('#stop-animation');

animateBtn.addEventListener('click', (event) => {
  animateBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  requestAnimationFrame(animate);
});

stopBtn.addEventListener('click', (event) => {
  animateBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  cancelAnimationFrame(id);
});
