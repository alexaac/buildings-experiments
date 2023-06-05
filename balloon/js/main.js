import * as THREE from '../../js/build/three.module.js';

import { Antenna } from './models/Antenna.js';

mapboxgl.accessToken =
  'pk.eyJ1IjoiYWxleGFhYyIsImEiOiJja3o1OGdrcWUwZGN2MnRwa2xsa2pqNTI3In0.RenxXCa3uR7D7-tdvoYKGw';
const apiKey = 'wSVUkjoWKTD8fUSyzJd5';

const center = { lng: -74.00565165636584, lat: 40.7129965903147 };

const longitude = center.lng,
  latitude = center.lat;

const point = { longitude: center.lng, latitude: center.lat };
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

const map = new mapboxgl.Map({
  container: 'map',
  // style: 'mapbox://styles/mapbox/light-v10',
  // style: 'mapbox://styles/mapbox/dark-v10',
  style: '../styles/style.json',
  center: [longitude, latitude],
  zoom: 14.5,
  pitch: 75,
  bearing: 30,
  antialias: true,
});

map.addControl(new mapboxgl.NavigationControl());

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
    meters: mapboxgl.MercatorCoordinate.fromLngLat([longitude, latitude], 0),
  },
  zoom: map.getZoom(),

  resolution: [window.innerWidth / 2, window.innerHeight / 2],
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

map.addLayer(
  new Antenna(
    assetArr[0].id,
    assetArr[0].cord,
    assetArr[0].url,
    assetArr[0].scaleFactor,
    parameters
  )
);

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

// Start the animation.
animate(0);

parameters.initialTime = new Date().getTime();
// setInterval(onFrame, parameters.frequency / 1000);

console.log(map.getStyle().layers);

class searchControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl';
    const _input = document.createElement('input');
    _input.placeholder = 'Search...';
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
// map.addControl(new searchControl(), 'top-left');

// Time
let time = Date.now();

function animate(timestamp) {
  parameters.uTime = timestamp;

  // // clamp the rotation between 0 -360 degrees
  // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

  // Request the next frame of the animation.
  requestAnimationFrame(animate);
}

map.on('click', (e) => {
  console.log(e.lngLat.wrap());

  map.removeLayer('sphere');
  map.addLayer(
    new Antenna(
      assetArr[0].id,
      e.lngLat.wrap(),
      assetArr[0].url,
      assetArr[0].scaleFactor,
      parameters
    )
  );
});

map.on('touchstart', (e) => {
  console.log(e.lngLat.wrap());

  map.removeLayer('sphere');
  map.addLayer(
    new Antenna(
      assetArr[0].id,
      e.lngLat.wrap(),
      assetArr[0].url,
      assetArr[0].scaleFactor,
      parameters
    )
  );
});
