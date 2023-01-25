let imgNames = [];
const imgDiv = document.getElementById('mps-inline-block');

/**
 * @description Fetch data
 * @param {string} url - file
 */
const getData = async (url) => {
  const response = fetch(url);

  const data = await (await response).json();

  return data;
};

// Get the data
const data = await getData('data/categories.json');

data.forEach((elem, i) => {
  if (elem.type === 'child') {
    const a = document.createElement('a');
    a.href = `https://maptheclouds.com/playground/buildings-experiments/${elem.name}/`;

    const img = document.createElement('img');
    img.src = `../${elem.name}/img/demo.gif`;
    img.className = 'post-img';

    a.appendChild(img);
    imgDiv.appendChild(a);
  }
});
