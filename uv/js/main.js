import * as dat from '../../js/libs/lil-gui.module.min.js';
import * as THREE from '../../js/build/three.module.js';

import { Buildings } from './models/Buildings.js';

const coordinates = {
  lng: -74.00763197935618,
  lat: 40.70903681821676,
};

const apiKey = 'wSVUkjoWKTD8fUSyzJd5';
let isRotating = false;
let coords;

let styles = {
  day: './styles/maptiler3d.json',
  night: '../../../styles/dark.json',
};
let selectedStyle = styles.day;

const map = (window.map = new maplibregl.Map({
  container: 'map',
  style: selectedStyle,
  // style:
  //   'https://api.maptiler.com/maps/streets/style.json?key=wSVUkjoWKTD8fUSyzJd5',
  center: [coordinates.lng, coordinates.lat],
  zoom: 14.6,
  pitch: 55,
  bearing: 8,
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

// https://github.com/maplibre/maplibre-gl-js/issues/1123
map.getCameraPosition = () => {
  console.log(map.transform);
  const pitch = map.transform._pitch;
  const bearing = map.transform._bearing;
  const altitude = Math.cos(pitch) * map.transform.cameraToCenterDistance;
  const latOffset = Math.tan(pitch) * map.transform.cameraToCenterDistance;
  const latPosPointInPixels = map.transform.centerPoint.add(
    new maplibregl.Point(0, latOffset)
  );
  const latLong = map.transform.pointLocation(latPosPointInPixels);
  const verticalScaleConstant =
    map.transform.worldSize /
    (2 * Math.PI * 6378137 * Math.abs(Math.cos(latLong.lat * (Math.PI / 180))));
  const altitudeInMeters = altitude / verticalScaleConstant;
  return {
    lng: latLong.lng,
    lat: latLong.lat,
    altitude: altitudeInMeters,
    pitch: (pitch * 180) / Math.PI,
    bearing: bearing,
  };
};

// select
let cities = {
  burj_1: {
    name: 'Burj Khalifa (Dubai) 898m',
    coords: { lng: 55.27448417886444, lat: 25.195506308380118 },
    zoom: 15,
    bearing: -40,
  },
  merkeda_2: {
    name: 'Merdeka Tower (Kuala Lumpur) 678.9m',
    coords: { lng: 101.70053102105362, lat: 3.1450993388381505 },
    zoom: 15.5,
    bearing: 8,
  },
  shanghai_3: {
    name: 'Shanghai Tower (Shanghai) 632m',
    coords: { lng: 121.50067628481872, lat: 31.240010576034734 },
    zoom: 15.3,
    bearing: 44,
  },
  abraj_4: {
    name: 'Abraj Al-Bait Clock Tower (Mecca) 601m',
    coords: { lng: 39.825656422268025, lat: 21.421167870439746 },
    zoom: 15.6,
    bearing: -170,
  },
  lotte_6: {
    name: 'Lotte World Tower (Seoul) 554.5m',
    coords: { lng: 127.10150269697829, lat: 37.51159078812876 },
    zoom: 15.3,
    bearing: -30,
  },
  wtc_7: {
    name: 'One World Trade Center (New York City) 541.3m',
    coords: { lng: -74.01141499356697, lat: 40.70944142814059 },
    zoom: 15,
    bearing: -7,
  },
};

var keys = Object.keys(cities);
keys.reverse();

// map.on('moveend', ({ originalEvent }) => {
//   console.log(originalEvent);
//   if (originalEvent) {
//     map.fire('usermoveend');
//   } else {
//     map.fire('flyend');
//   }
// });

const orbit = () => {
  if (isRotating) {
    rotateCamera.cancel();
    isRotating = false;
  } else {
    rotateCamera.start();
    isRotating = true;
  }
};

const jumpToCity = (coords, zoom, bearing) => {
  setTimeout(function () {
    map.flyTo({
      center: coords,
      zoom: zoom || 15,
      pitch: 76,
      bearing: bearing || 0,
    });
  }, 0);

  console.log(map.getCameraPosition());
};
const citiesSelect = document.querySelector('#toolBar');
keys.forEach(function (key, index) {
  const div = citiesSelect.appendChild(document.createElement('div'));
  div.className = 'item';
  div.id = key;
  div.style.visibility = 'hidden';
  div.style.opacity = 0;
  div.style.bottom = '30px';

  div.addEventListener('click', (e) => {
    e.stopPropagation();
    jumpToCity(cities[key].coords, cities[key].zoom, cities[key].bearing);
  });

  const backgroundDiv = div.appendChild(document.createElement('div'));
  backgroundDiv.id = `${key} buttonBG`;
  backgroundDiv.className = 'buttonBG';

  const buttonDiv = div.appendChild(document.createElement('div'));
  buttonDiv.id = `${key} button`;
  buttonDiv.className = 'button';
  buttonDiv.innerText = cities[key].name;
});

const div = citiesSelect.appendChild(document.createElement('div'));
div.className = 'item';
div.id = 'selectButton';
div.click();

// Animate overlay
let showSelect = true;
div.addEventListener('click', () => {
  if (showSelect) {
    keys.forEach(function (key, index) {
      const cityDiv = document.querySelector(`#${key}`);

      gsap.to(cityDiv.style, {
        duration: 1,
        visibility: 'visible',
        opacity: 1,
        bottom: `${(index + 1) * 30}px`,
        height: '30px',
      });
    });
    showSelect = false;
  } else {
    keys.forEach(function (key) {
      const cityDiv = document.querySelector(`#${key}`);

      gsap.to(cityDiv.style, {
        duration: 1,
        bottom: '30px',
        height: 0,
        opacity: 0,
      });
      gsap.to(cityDiv.style, {
        delay: 1,
        duration: 1,
        visibility: 'hidden',
      });
    });
    showSelect = true;
  }
});

const backgroundDiv = div.appendChild(document.createElement('div'));
backgroundDiv.id = 'backgroundselectButton';
backgroundDiv.className = 'buttonBG';

const buttonDiv = div.appendChild(document.createElement('div'));
buttonDiv.id = 'buttonselectButton';
buttonDiv.className = 'button';
buttonDiv.innerText = 'SELECT BUILDING';

/**
 * Debug
 */
const gui = new dat.GUI({ closed: true });

const parameters = {
  // materialColor: '#409ebf',
  materialColor: '#ffffff',
  materialOpacity: 1,
  materialAmbientTerm: 1,
  materialSpecularTerm: 0,
  materialShininess: 2.8,

  lightColor: '#ffffff',
  ambientTerm: 0.8,
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
  longitude: coordinates.lng,
  latitude: coordinates.lat,

  preWave: 200.1,
  hWave: 300,
  postWave: 400.1,
  opacity: 1,

  center: {
    meters: maplibregl.MercatorCoordinate.fromLngLat(
      [coordinates.lng, coordinates.lat],
      0
    ),
  },
  zoom: map.getZoom(),

  resolution: [window.innerWidth / 2, window.innerHeight / 2],

  uColorA: '#2523e8', //[0.149, 0.141, 0.912],
  uColorB: '#ffd439', //[1.0, 0.833, 0.224],
  uSpacing: 0.3,
};

// gui
//   .addColor(parameters, 'lightColor')
//   .name('Light Color')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters, 'ambientTerm')
//   .min(0)
//   .max(1)
//   .step(0.01)
//   .name('Light Ambient Term')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters, 'specularTerm')
//   .min(0)
//   .max(1)
//   .step(0.01)
//   .name('Light Specular Term')
//   .onChange(() => {
//     map.triggerRepaint();
//   });
// gui
//   .add(parameters.lightDirection, 'x')
//   .min(-1)
//   .max(1)
//   .step(0.01)
//   .name('Light x')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters.lightDirection, 'y')
//   .min(-1)
//   .max(1)
//   .step(0.01)
//   .name('Light y')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters.lightDirection, 'z')
//   .min(-1)
//   .max(1)
//   .step(0.01)
//   .name('Light z')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();

// gui
//   .addColor(parameters, 'materialColor')
//   .name('Material Color')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters, 'materialAmbientTerm')
//   .min(0)
//   .max(1)
//   .step(0.01)
//   .name('Material Ambient')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters, 'materialSpecularTerm')
//   .min(0)
//   .max(1)
//   .step(0.01)
//   .name('Material Specular')
//   .onChange(() => {
//     map.triggerRepaint();
//   })
//   .listen();
// gui
//   .add(parameters, 'materialShininess')
//   .min(0)
//   .max(20)
//   .step(0.1)
//   .name('Material Shininess')
//   .onChange((v) => {
//     map.triggerRepaint();
//   });
gui
  .add(parameters, 'materialOpacity')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Opacity')
  .onChange(() => {
    map.triggerRepaint();
  });
gui
  .addColor(parameters, 'uColorA')
  .name('Color A')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .addColor(parameters, 'uColorB')
  .name('Color B')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'uSpacing')
  .min(0.01)
  .max(1)
  .step(0.1)
  .name('Spacing')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();

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
      new Buildings('buildingsLayer', 'building-3d', parameters),
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

//   map.panTo([coordinates.lng, coordinates.lat]);

//   parameters.spherePosition += parameters.dxSphere;
//   parameters.lightDirection.x = -parameters.spherePosition;
//   utils.updateDirectionalLight(parameters);

//   if (parameters.spherePosition >= 2 || parameters.spherePosition < -2) {
//     parameters.dxSphere = -parameters.dxSphere;
//   }
// }

var Animation = function (step) {
  var timerID;
  var innerStep = function (timestamp) {
    step(timestamp);
    timerID = requestAnimationFrame(innerStep);
  };
  return {
    start: function () {
      timerID = requestAnimationFrame(innerStep);
    },
    cancel: function () {
      cancelAnimationFrame(timerID);
    },
  };
};

const rotateCamera = new Animation((timestamp) => {
  // clamp the rotation between 0 -360 degrees
  // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
  map.rotateTo((timestamp / 100) % 360, { duration: 0 });
});

rotateCamera.start();
rotateCamera.cancel();

map.on('click', (e) => {
  console.log(e.lngLat.wrap());

  orbit();
});

map.on('zoomend', () => {
  console.log(map.transform);
  console.log(map.getBearing());
});
