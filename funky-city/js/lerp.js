// https://stackoverflow.com/q/66123016

const is = {
  hex: (a) => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a),
  rgb: (a) => /^rgb/.test(a),
  hsl: (a) => /^hsl/.test(a),
  col: (a) => is.hex(a) || is.rgb(a) || is.hsl(a),
};

const convertToRgba = (colour) => {
  return is.hex(colour)
    ? hexToRgba(colour)
    : is.rgb(colour)
    ? rbgToRgba(colour)
    : is.hsl(colour)
    ? hslToRgba(colour)
    : colour;
};

const hexToRgba = (colour, alpha = 1) => {
  const [r, g, b] = colour.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

const rbgToRgba = (colour, alpha = 1) => {
  const [r, g, b] = colour.replace(/[^\d,]/g, '').split(',');
  return `rgba(${r},${g},${b},${alpha})`;
};

// https://stackoverflow.com/a/49974627
function rgba2hex(orig) {
  var a,
    isPercent,
    rgb = orig
      .replace(/\s/g, '')
      .match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
    alpha = ((rgb && rgb[4]) || '').trim(),
    hex = rgb
      ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
        (rgb[2] | (1 << 8)).toString(16).slice(1) +
        (rgb[3] | (1 << 8)).toString(16).slice(1)
      : orig;

  if (alpha !== '') {
    a = alpha;
  } else {
    a = 0o1;
  }

  // // multiply before convert to HEX
  // a = ((a * 255) | (1 << 8)).toString(16).slice(1);
  // hex = hex + a;

  return hex;
}

const deconstructRgba = (rgba) => {
  return rgba
    .replace(/[^\d,]/g, '')
    .split(',')
    .map((x) => parseInt(x));
};

const formatRbga = (colour) => {
  return `rgba(${colour.r},${colour.g},${colour.b},${colour.a})`;
};

const interpolateColour = (colourA, colourB, progress) => {
  const [r1, g1, b1, a1] = deconstructRgba(convertToRgba(colourA));
  const [r2, g2, b2, a2] = deconstructRgba(convertToRgba(colourB));
  return formatRbga({
    r: Math.round((r1 + r2) * progress),
    g: Math.round((g1 + g2) * progress),
    b: Math.round((b1 + b2) * progress),
    a: Math.round((a1 + a2) * progress),
  });
};

export {
  interpolateColour,
  convertToRgba,
  hexToRgba,
  rbgToRgba,
  deconstructRgba,
  rgba2hex,
};
