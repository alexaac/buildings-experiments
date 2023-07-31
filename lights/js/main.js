import * as dat from './libs/lil-gui.module.min.js';
import utils from './utils.js';

import extrudeVertexShader from './shaders/extrude/vertex.js';
import extrudeFragmentShader from './shaders/extrude/fragment.js';

// const longitude = -74.0056055,
//   latitude = 40.7128896;

const longitude = -74.01376,
  latitude = 40.704988;

let styles = {
  day: './js/maptiler3d.json',
  night: './js/dark.json',
};
let selectedStyle = styles.day;

var map = new maplibregl.Map({
  container: 'map',
  style: selectedStyle,
  // style: 'https://api.maptiler.com/maps/klokantech-3d/style.json?key=wSVUkjoWKTD8fUSyzJd5',

  center: [longitude, latitude],
  zoom: 16,
  pitch: 85,
  bearing: 0,
  antialias: true,
});

map.addControl(new maplibregl.NavigationControl());

let buildingsProgram,
  modelViewMatrix = mat4.create(),
  projectionMatrix = mat4.create(),
  normalMatrix = mat4.create();

let uTime;

const canvas = map.getCanvas();
const gl = canvas.getContext('webgl');
let { lng, lat } = { longitude, latitude };

let hour = document.querySelector('#hour');

var date = new Date();
var timeNow =
  date.getHours() * 60 * 60 +
  date.getMinutes() * 60 +
  date.getSeconds() -
  30000;

/**
 * Debug
 */

const gui = new dat.GUI({ closed: true });
// gui.hide();
const parameters = {
  // materialColor: '#409ebf',
  materialColor: '#409ebf',

  materialOpacity: 1,
  materialAmbientTerm: 1,
  materialSpecularTerm: 1,
  materialShininess: 2,

  lightColor: '#ffffff',
  ambientTerm: 0.3,
  specularTerm: 1,
  lightDirection: {
    x: 0.26606297492980957,
    y: -0.2591168284416199,
    z: 0.9284766912460327,
  },
  time: timeNow,

  wireframe: false,
};

const changeByTime = (date, time) => {
  date.setHours(Math.floor(time / 60 / 60));
  date.setMinutes(Math.floor(time / 60) % 60);
  date.setSeconds(time % 60);

  ({ lng, lat } = map.getCenter());

  const pos = SunCalc.getPosition(date, lat, lng);

  const dir = m4.normalize([
    Math.cos(pos.azimuth + (3 * Math.PI) / 2),
    Math.sin(pos.azimuth + (3 * Math.PI) / 2),
    2.5,
  ]);

  parameters.lightDirection.x = dir[0];
  parameters.lightDirection.y = dir[1];
  parameters.lightDirection.z = dir[2];

  let dateTZ = utils.dateToTimezone(date, 'America/New_York');
  hour.innerHTML = dateTZ.toLocaleString();

  changeStyleWithDaylight(date, [lng, lat]);
};

changeByTime(date, timeNow);

gui
  .addColor(parameters, 'lightColor')
  .name('Light Color')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'ambientTerm')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Light Ambient Term')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'specularTerm')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Light Specular Term')
  .onChange(() => {
    map.triggerRepaint();
  });
gui
  .add(parameters.lightDirection, 'x')
  .min(-1)
  .max(1)
  .step(0.01)
  .name('Light x')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters.lightDirection, 'y')
  .min(-1)
  .max(1)
  .step(0.01)
  .name('Light y')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters.lightDirection, 'z')
  .min(-1)
  .max(1)
  .step(0.01)
  .name('Light z')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();

gui
  .addColor(parameters, 'materialColor')
  .name('Material Color')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'materialAmbientTerm')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Material Ambient')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'materialSpecularTerm')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Material Specular')
  .onChange(() => {
    map.triggerRepaint();
  })
  .listen();
gui
  .add(parameters, 'materialShininess')
  .min(0)
  .max(20)
  .step(0.1)
  .name('Material Shininess')
  .onChange((v) => {
    map.triggerRepaint();
  });
gui
  .add(parameters, 'materialOpacity')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Material Opacity')
  .onChange(() => {
    map.triggerRepaint();
  });

function changeStyleWithDaylight(date, origin) {
  let sunTimes = utils.getSunTimes(date, origin);
  if (date >= sunTimes.sunriseEnd && date <= sunTimes.sunsetStart) {
    if (selectedStyle != styles.day) {
      console.log("it's day");
      map.setStyle(styles.day);
      selectedStyle = styles.day;

      parameters.lightColor = '#ffffff';
      parameters.materialColor = '#409ebf';
      parameters.ambientTerm = 0.3;
      // parameters.materialAmbientTerm = 1;
      // parameters.materialSpecularTerm = 1;
    }
  } else {
    if (selectedStyle != styles.night) {
      console.log("it's night");
      map.setStyle(styles.night);
      selectedStyle = styles.night;
      parameters.lightColor = '#787fa7';
      parameters.materialColor = '#1c2f99';
      parameters.ambientTerm = 0.2;
      // parameters.materialAmbientTerm = 0.5;
      // parameters.materialSpecularTerm = 0.5;
    }
  }
}

gui
  .add(parameters, 'time')
  .min(timeNow)
  .max(86400)
  .step(10)
  .name('Day Time')
  .onChange((v) => {
    if (v < 86400) {
      changeByTime(date, v);
      map.triggerRepaint();
    }
  })
  .listen();

gui
  .add(parameters, 'wireframe')
  .name('Wireframe')
  .onChange(() => {
    map.triggerRepaint();
  });

class BuildingShadows {
  constructor() {
    this.id = 'buildingsLayer';
    this.buildingsLayerId = 'building-3d';
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(map) {
    this.map = map;

    // find layer source
    const sourceName = this.map.getLayer(this.buildingsLayerId).source;
    this.source = (this.map.style.sourceCaches ||
      this.map.style._otherSourceCaches)[sourceName];
    if (!this.source) {
      console.warn(`Can't find layer ${this.buildingsLayerId}'s source.`);
    }

    // Create a program with the appropriate vertex and fragment shaders
    const initBuildingsProgram = () => {
      // Create a program
      buildingsProgram = gl.createProgram();

      const vertexShader = utils.getShader(
        gl,
        extrudeVertexShader,
        'x-shader/x-vertex'
      );
      const fragmentShader = utils.getShader(
        gl,
        extrudeFragmentShader,
        'x-shader/x-fragment'
      );

      // Attach the shaders to this program
      gl.attachShader(buildingsProgram, vertexShader);
      gl.attachShader(buildingsProgram, fragmentShader);
      gl.linkProgram(buildingsProgram);
      gl.validateProgram(buildingsProgram);

      if (!gl.getProgramParameter(buildingsProgram, gl.LINK_STATUS)) {
        console.error('Could not initialize shaders');
      }

      gl.useProgram(buildingsProgram);

      // We attach the location of these shader values to the program instance
      // for easy access later in the code
      buildingsProgram.uMatrix = gl.getUniformLocation(
        buildingsProgram,
        'u_matrix'
      );
      buildingsProgram.uOpacity = gl.getUniformLocation(
        buildingsProgram,
        'u_opacity'
      );
      buildingsProgram.uTime = gl.getUniformLocation(
        buildingsProgram,
        'u_time'
      );

      buildingsProgram.uLightDiffuse = gl.getUniformLocation(
        buildingsProgram,
        'u_light_diffuse'
      );
      buildingsProgram.uLightAmbient = gl.getUniformLocation(
        buildingsProgram,
        'u_light_ambient'
      );
      buildingsProgram.uLightSpecular = gl.getUniformLocation(
        buildingsProgram,
        'u_light_specular'
      );

      buildingsProgram.uLightDirection = gl.getUniformLocation(
        buildingsProgram,
        'u_light_direction'
      );

      buildingsProgram.uMaterialAmbient = gl.getUniformLocation(
        buildingsProgram,
        'u_material_ambient'
      );
      buildingsProgram.uMaterialDiffuse = gl.getUniformLocation(
        buildingsProgram,
        'u_material_diffuse'
      );
      buildingsProgram.uMaterialSpecular = gl.getUniformLocation(
        buildingsProgram,
        'u_material_specular'
      );
      buildingsProgram.uShininess = gl.getUniformLocation(
        buildingsProgram,
        'u_shininess'
      );

      buildingsProgram.aVertexPosition = gl.getAttribLocation(
        buildingsProgram,
        'a_vertex_position'
      );
      buildingsProgram.aVertexNormal = gl.getAttribLocation(
        buildingsProgram,
        'a_vertex_normal'
      );
      buildingsProgram.aVertexBase = gl.getAttribLocation(
        buildingsProgram,
        'a_vertex_base'
      );
      buildingsProgram.aVertexHeight = gl.getAttribLocation(
        buildingsProgram,
        'a_vertex_height'
      );
    };

    initBuildingsProgram();

    gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
    const color = gl.getParameter(gl.COLOR_CLEAR_VALUE);
    console.log(`clearColor = (
      ${color[0].toFixed(1)},
      ${color[1].toFixed(1)},
      ${color[2].toFixed(1)}
    )`);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.ALWAYS);
    gl.hint(gl.PERSPECTIVE_CORRECTION_HINT, gl.NICEST);

    gl.depthMask(true);
    gl.enable(gl.BLEND);
  }

  render() {
    // console.log('-----------------------------------------');

    if (!this.source) return;

    // Use this program instance
    gl.useProgram(buildingsProgram);

    const coords = this.source.getVisibleCoordinates().reverse();

    const buildingsLayer = this.map.getLayer(this.buildingsLayerId);
    const context = this.map.painter.context;

    ({ lng, lat } = this.map.getCenter());
    const pos = SunCalc.getPosition(date, lat, lng);

    gl.uniform1f(buildingsProgram.uOpacity, parameters.materialOpacity);
    gl.uniform1f(buildingsProgram.uAltitude, pos.altitude);
    gl.uniform1f(buildingsProgram.uAzimuth, pos.azimuth + (3 * Math.PI) / 2);

    // Set the color to use
    gl.uniform3fv(
      buildingsProgram.uMaterialDiffuse,
      utils.normalizeColor(parameters.materialColor)
    );
    gl.uniform4fv(buildingsProgram.uMaterialAmbient, [
      parameters.materialAmbientTerm,
      parameters.materialAmbientTerm,
      parameters.materialAmbientTerm,
      1,
    ]);
    gl.uniform4fv(buildingsProgram.uMaterialSpecular, [
      parameters.materialSpecularTerm,
      parameters.materialSpecularTerm,
      parameters.materialSpecularTerm,
      1,
    ]);
    gl.uniform1f(buildingsProgram.uShininess, parameters.materialShininess);

    // Set the light color to use
    gl.uniform3fv(
      buildingsProgram.uLightDiffuse,
      utils.normalizeColor(parameters.lightColor)
    );
    gl.uniform4fv(buildingsProgram.uLightAmbient, [
      parameters.ambientTerm,
      parameters.ambientTerm,
      parameters.ambientTerm,
      1,
    ]);
    gl.uniform4fv(buildingsProgram.uLightSpecular, [
      parameters.specularTerm,
      parameters.specularTerm,
      parameters.specularTerm,
      1,
    ]);

    gl.uniform1f(buildingsProgram.uTime, uTime);

    // Set the light direction.
    gl.uniform3fv(
      buildingsProgram.uLightDirection,
      [
        parameters.lightDirection.x,
        parameters.lightDirection.y,
        parameters.lightDirection.z,
      ]
      // m4.normalize([
      //   Math.cos(pos.azimuth + (3 * Math.PI) / 2),
      //   Math.sin(pos.azimuth + (3 * Math.PI) / 2),
      //   2.5,
      // ])
    );

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // map.setLight(
    //   {
    //     anchor: 'map',
    //     position: [
    //       1.5,
    //       180 + (pos.azimuth * 180) / Math.PI,
    //       90 - (pos.altitude * 180) / Math.PI,
    //     ],
    //     'position-transition': { duration: 0 },
    //     color: '#fdb',
    //     // color: `hsl(20, ${50 * Math.cos(pos.altitude)}%, ${ 200 * Math.sin(pos.altitude) }%)`
    //   },
    //   { duration: 0 }
    // );

    for (const coord of coords) {
      const tile = this.source.getTile(coord);
      const bucket = tile.getBucket(buildingsLayer);

      if (!bucket) continue;

      const buffers =
        bucket.programConfigurations.programConfigurations['building-3d']
          ._buffers;

      let colorBuffer, heightBuffer, baseBuffer;

      if (buffers.length === 2) {
        [baseBuffer, heightBuffer] = buffers;
      } else {
        [baseBuffer, colorBuffer, heightBuffer] = buffers;
      }

      gl.uniformMatrix4fv(
        buildingsProgram.uMatrix,
        false,
        coord.posMatrix || coord.projMatrix
      );

      gl.uniform1f(
        buildingsProgram.uHeightFactor,
        Math.pow(2, coord.overscaledZ) / tile.tileSize / 8
      );

      for (const segment of bucket.segments.get()) {
        const numPrevAttrib = context.currentNumAttributes || 0;
        const numNextAttrib = 2;

        for (let i = numNextAttrib; i < numPrevAttrib; i++)
          gl.disableVertexAttribArray(i);

        const vertexOffset = segment.vertexOffset || 0;
        gl.enableVertexAttribArray(buildingsProgram.aVertexPosition);
        gl.enableVertexAttribArray(buildingsProgram.aVertexNormal);
        gl.enableVertexAttribArray(buildingsProgram.aVertexHeight);
        gl.enableVertexAttribArray(buildingsProgram.aVertexBase);

        bucket.layoutVertexBuffer.bind(); // Set up the buffer
        gl.vertexAttribPointer(
          buildingsProgram.aVertexPosition,
          2,
          gl.SHORT,
          false,
          12,
          12 * vertexOffset
        );
        gl.vertexAttribPointer(
          buildingsProgram.aVertexNormal,
          4,
          gl.SHORT,
          false,
          12,
          4 + 12 * vertexOffset
        );

        heightBuffer.bind(); // Set up the buffer
        gl.vertexAttribPointer(
          buildingsProgram.aVertexHeight,
          1,
          gl.FLOAT,
          false,
          4,
          4 * vertexOffset
        );

        baseBuffer.bind(); // Set up the buffer
        gl.vertexAttribPointer(
          buildingsProgram.aVertexBase,
          1,
          gl.FLOAT,
          false,
          4,
          4 * vertexOffset
        );
        bucket.indexBuffer.bind(); // Set up the buffer
        context.currentNumAttributes = numNextAttrib;

        // Render to our canvas

        // If wireframe is truthy, we draw using `LINES`
        const type = parameters.wireframe ? gl.LINES : gl.TRIANGLES;

        gl.drawElements(
          type,
          segment.primitiveLength * 3,
          gl.UNSIGNED_SHORT,
          segment.primitiveOffset * 3 * 2
        );
      }
    }
  }
}

// The 'building' layer in the streets vector source contains building-height
// data from OpenStreetMap.
map.on('load', function () {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;

  // if (map.getLayer('building-3d')) {
  //   map.removeLayer('building-3d');
  // }

  if (map.getSource('openmaptiles')) {
    // map.addLayer(
    //   {
    //     id: 'building-3d',
    //     type: 'fill-extrusion',
    //     source: 'openmaptiles',
    //     'source-layer': 'building',
    //     filter: ['all', ['!has', 'hide_3d']],
    //     paint: {
    //       'fill-extrusion-base': {
    //         property: 'render_min_height',
    //         type: 'identity',
    //       },
    //       'fill-extrusion-color': [
    //         'case',
    //         ['has', 'colour'],
    //         ['get', 'colour'],
    //         'hsl(39, 41%, 86%)',
    //       ],
    //       'fill-extrusion-height': {
    //         property: 'render_height',
    //         type: 'identity',
    //       },
    //       'fill-extrusion-opacity': 0.0,
    //     },
    //   },
    //   labelLayerId
    // );

    map.addLayer(new BuildingShadows(), 'building-3d');

    console.log(map.getStyle().layers);

    // Animate time
    gsap.to(parameters, {
      delay: 3,
      duration: 1,
      time: timeNow,
    });
    gsap.to(parameters, {
      duration: 6,
      time: 86400,
      ease: 'linear',
      onUpdate: () => {
        if (parameters.time < 86400) {
          changeByTime(date, parameters.time);
          map.triggerRepaint();
        }
      },
    });

    // map.setLayoutProperty('building', 'visibility', 'none');
  }

  function animate(timestamp) {
    uTime = timestamp;

    // // clamp the rotation between 0 -360 degrees
    // // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    // map.rotateTo((timestamp / 300) % 360, { duration: 0 });

    // Request the next frame of the animation.
    requestAnimationFrame(animate);
  }

  // Start the animation.
  animate(0);
});

let popup;
let buildingId = 200;

// Target the span elements used in the sidebar
const magDisplay = document.getElementById('mag');
const locDisplay = document.getElementById('loc');
const dateDisplay = document.getElementById('date2');

// map.on('click', function (event) {
//   console.log(map.getStyle().layers);
// });

map.on('click', 'building-3d', function (event) {
  map.getCanvas().style.cursor = 'pointer';

  let feature = event.features[0];

  if (popup) popup.remove();

  if (feature.id) {
    // Set constants equal to the current feature's magnitude, location, and time
    const type = feature.properties.type;
    const height = feature.properties.height;
    const underground = feature.properties.underground;

    // Check whether features exist
    if (event.features.length === 0) return;
    // Display the magnitude, location, and time in the sidebar
    magDisplay.textContent = type;
    locDisplay.textContent = height;
    dateDisplay.textContent = underground;

    // If buildingId for the hovered feature is not null,
    // use removeFeatureState to reset to the default behavior
    if (buildingId) {
      map.removeFeatureState({
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      });
    }

    const geometry = feature.geometry;
    const centroid = turf.centroid(geometry);

    // let center = [];
    // let coords = tb.getFeatureCenter(feature, null, 0);
    // center.push([coords[0], coords[1]]);

    popup = new maplibregl.Popup({ offset: 0 })
      .setLngLat(centroid.geometry.coordinates)
      // .setLngLat(center[0].slice())

      .setHTML(
        '<strong>' + (feature.id || feature.properties.height) + '</strong >'
      )
      .addTo(map);

    buildingId = feature.id;

    // When the mouse moves over the earthquakes-viz layer, update the
    // feature state for the feature under the mouse
    map.setFeatureState(
      {
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      },
      {
        hover: true,
      }
    );
  }
});

map.on('mousemove', 'building-3d', function (event) {
  map.getCanvas().style.cursor = 'pointer';

  let feature = event.features[0];

  if (popup) popup.remove();

  if (feature.id) {
    // console.log(feature);

    // Check whether features exist
    if (event.features.length === 0) return;

    // If buildingId for the hovered feature is not null,
    // use removeFeatureState to reset to the default behavior
    if (buildingId) {
      map.removeFeatureState({
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      });
    }

    const geometry = feature.geometry;
    const centroid = turf.centroid(geometry);

    buildingId = feature.id;

    // When the mouse moves over the earthquakes-viz layer, update the
    // feature state for the feature under the mouse
    map.setFeatureState(
      {
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      },
      {
        hover: true,
      }
    );
  }
});

map.on('mouseleave', 'building-3d', () => {
  if (buildingId) {
    map.setFeatureState(
      {
        source: 'openmaptiles',
        sourceLayer: 'building',
        id: buildingId,
      },
      {
        hover: false,
      }
    );
  }

  buildingId = null;
  // Remove the information from the previously hovered feature from the sidebar
  magDisplay.textContent = '';
  locDisplay.textContent = '';
  dateDisplay.textContent = '';
  // Reset the cursor style
  map.getCanvas().style.cursor = '';
});
