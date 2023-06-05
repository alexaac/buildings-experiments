import utils from './utils.js';

let imgNames = [];
const imgDiv = document.getElementById('mps-inline-block');

// Get the data
const data = await utils.getData('data/categories.json');

data.forEach((elem, i) => {
  if (elem.type === 'child') {
    const a = document.createElement('a');
    a.href = `https://maptheclouds.com/playground/buildings-experiments/${elem.name}/`;

    const img = document.createElement('img');
    img.src = `https://maptheclouds.com/playground/buildings-experiments/${elem.name}/img/demo.gif`;
    img.className = 'post-img';

    a.appendChild(img);
    imgDiv.appendChild(a);
  }
});
