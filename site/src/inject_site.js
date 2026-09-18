const fs = require('fs');
const path = require('path');
const SRC_DIR = __dirname;
const IMG_DIR = path.join(SRC_DIR, 'images');
const OUT_DIR = path.join(SRC_DIR, '..');

function b64(file) {
  return 'data:image/png;base64,' + fs.readFileSync(path.join(IMG_DIR, file)).toString('base64');
}

let html = fs.readFileSync(path.join(SRC_DIR, 'template.html'), 'utf8');
html = html.replace('__IMG_CIRCUIT__', b64('raw_08_circuit2.png'));
html = html.replace('__IMG_CHANEL__', b64('raw_09_chanel3.png'));
html = html.replace('__IMG_MOSS__', b64('raw_02_moss.png'));
html = html.replace('__IMG_BELLS__', b64('raw_10_bells3.png'));

const outPath = path.join(OUT_DIR, 'index.html');
fs.writeFileSync(outPath, html);
console.log('wrote', outPath, (html.length / 1024 / 1024).toFixed(2), 'MB');
