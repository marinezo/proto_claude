// ---------------------------------------------------------------------
// Pixel-candy-shop art library.
// Palette matches the reference PICO-8-style swatch: dark navy sky,
// maroon, forest green, brown, grays, cream, and bright candy accents.
// All icons are authored in a local 44x44 design box centered on (0,0),
// then scaled to whatever size is requested. rectMode/ellipseMode are
// set to CENTER in setup(), so every coordinate here is a center point.
// ---------------------------------------------------------------------

const PAL = {
  black:  [17, 17, 20],
  navy:   [29, 43, 83],
  maroon: [126, 37, 83],
  dgreen: [0, 135, 81],
  brown:  [171, 82, 54],
  dgray:  [95, 87, 79],
  lgray:  [194, 195, 199],
  cream:  [255, 241, 232],
  red:    [255, 0, 77],
  orange: [255, 163, 0],
  yellow: [255, 236, 39],
  green:  [0, 228, 54],
  blue:   [41, 173, 255],
  indigo: [131, 118, 156],
  pink:   [255, 119, 168],
  peach:  [255, 204, 170],
  choc:   [92, 51, 38],
  tan:    [214, 157, 106]
};

const CANDY_COLOR_CYCLE = ['red', 'orange', 'yellow', 'green', 'blue', 'pink', 'indigo', 'peach', 'brown', 'maroon', 'dgreen'];

function PF(key, a) {
  const c = PAL[key];
  if (a === undefined) fill(c[0], c[1], c[2]);
  else fill(c[0], c[1], c[2], a);
}
function PS(key, w) {
  const c = PAL[key];
  stroke(c[0], c[1], c[2]);
  strokeWeight(w === undefined ? 2 : w);
}
function PN() { noStroke(); }

// ---------------------------------------------------------------------
// Individual candy icons. Each fn(x, y, s) draws centered at (x,y),
// scaled so a 44-unit design box maps to an s-pixel footprint.
// ---------------------------------------------------------------------

function icon_walnut(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('brown'); ellipse(0, 1, 34, 30);
  PS('dgray', 2.5);
  line(0, -13, -3, -2); line(-3, -2, 3, 4); line(3, 4, 0, 15);
  PN(); PF('peach'); ellipse(-8, -8, 8, 6);
  pop();
}

function icon_bagel(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('tan'); ellipse(0, 0, 34, 26);
  PS('black', 1.5); PF('cream'); ellipse(0, 0, 12, 9);
  PN(); PF('dgray');
  ellipse(-8, -6, 3, 3); ellipse(0, -9, 3, 3); ellipse(8, -5, 3, 3); ellipse(3, 3, 3, 3);
  pop();
}

function icon_gummy(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('green');
  ellipse(-11, 4, 8, 10); ellipse(11, 4, 8, 10);
  ellipse(-6, 17, 9, 9); ellipse(6, 17, 9, 9);
  rect(0, 6, 20, 20, 6);
  ellipse(0, -9, 18, 16);
  ellipse(-7, -17, 7, 7); ellipse(7, -17, 7, 7);
  PN(); PF('peach'); ellipse(0, 7, 10, 10);
  PF('black'); ellipse(-4, -10, 2, 2); ellipse(4, -10, 2, 2);
  pop();
}

function icon_cherry(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('dgreen', 2.5);
  line(0, -20, -6, 1); line(0, -20, 5, 4);
  PN(); PF('dgreen'); triangle(0, -20, -5, -17, -1, -14);
  PS('black', 2); PF('red');
  ellipse(-6, 6, 16, 16); ellipse(7, 9, 16, 16);
  PN(); PF('peach'); ellipse(-9, 2, 3, 3); ellipse(4, 5, 3, 3);
  pop();
}

function icon_burger(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('peach'); ellipse(0, -13, 30, 14);
  PN(); PF('cream'); ellipse(-8, -15, 2, 2); ellipse(0, -17, 2, 2); ellipse(8, -15, 2, 2);
  PS('black', 2); PF('green'); rect(0, -6, 30, 6, 1);
  PF('yellow'); rect(0, -1, 29, 5, 0);
  PF('brown'); rect(0, -1, 25, 6, 2);
  PF('peach'); rect(0, 9, 30, 11, 5);
  pop();
}

function icon_waffle(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('tan'); rect(0, 0, 34, 34, 4);
  PS('brown', 1.3);
  line(-17, -8.5, 17, -8.5); line(-17, 0, 17, 0); line(-17, 8.5, 17, 8.5);
  line(-8.5, -17, -8.5, 17); line(0, -17, 0, 17); line(8.5, -17, 8.5, 17);
  PN(); PF('brown');
  for (let iy = 0; iy < 4; iy++) {
    for (let ix = 0; ix < 4; ix++) {
      const cx2 = -12.75 + ix * 8.5, cy2 = -12.75 + iy * 8.5;
      ellipse(cx2, cy2, 3.5, 3.5);
    }
  }
  PS('orange', 2.5);
  line(-13, -13, -6, -3); line(-6, -3, 3, -11); line(3, -11, 13, 1); line(13, 1, 8, 12);
  PS('black', 1.5); PF('yellow'); rect(-5, -12, 9, 7, 1);
  pop();
}

function icon_olives(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('lgray'); rect(0, 15, 26, 8, 3);
  PF('dgreen');
  ellipse(-8, 4, 10, 12); ellipse(0, 0, 11, 13); ellipse(8, 5, 10, 12);
  PN(); PF('red');
  ellipse(-8, -1, 2, 2); ellipse(0, -6, 2, 2); ellipse(8, 0, 2, 2);
  pop();
}

function icon_milk(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('cream');
  rect(0, 6, 22, 24, 2);
  triangle(-11, -6, 11, -6, 0, -16);
  PS('dgray', 1.5); line(0, -16, 0, -6);
  PS('black', 2); PF('blue'); rect(0, 10, 22, 5, 0);
  pop();
}

function icon_toffee(x, y, s) {
  push(); translate(x, y); scale(-s / 44, s / 44);
  PS('black', 2); PF('yellow');
  triangle(-7, -7, -7, 7, -18, 0);
  triangle(7, -7, 7, 7, 18, 0);
  rect(0, 0, 14, 12, 3);
  PS('orange', 1.5);
  line(-14, -3, -10, 0); line(-14, 3, -10, 0);
  line(14, -3, 10, 0); line(14, 3, 10, 0);
  PN(); PF('cream'); rect(-3, -3, 4, 3, 1);
  pop();
}

function icon_veggies(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('green'); rect(-9, 3, 10, 22, 5);
  PS('black', 2); PF('red'); ellipse(9, -2, 18, 18);
  PS('dgreen', 2); line(9, -11, 9, -15);
  PN(); PF('dgreen'); triangle(9, -11, 6, -14, 12, -14);
  PF('peach'); ellipse(5, -6, 3, 3);
  pop();
}

function icon_chocball(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2.5); PF('choc'); ellipse(0, 1, 30, 30);
  noFill(); PS('peach', 2); arc(0, 1, 20, 20, PI * 1.1, PI * 1.9, OPEN);
  PS('black', 1.5); PF('yellow'); triangle(10, 12, 16, 12, 13, 18);
  pop();
}

function icon_bread(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('tan');
  rect(0, 6, 26, 18, 4);
  ellipse(0, -4, 26, 14);
  PS('brown', 2);
  line(-8, -8, -4, -2); line(-2, -9, 2, -2); line(4, -8, 8, -2);
  pop();
}

function icon_juice(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('lgray', 3); line(6, -10, 14, -22);
  PS('black', 2); PF('orange'); rect(0, 4, 20, 24, 2);
  PF('cream'); rect(0, 4, 20, 8, 0);
  PN(); PF('red'); ellipse(0, 4, 4, 4);
  pop();
}

function icon_hotdog(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('peach'); rect(0, 3, 34, 14, 7);
  PF('red'); rect(0, -3, 30, 9, 5);
  PS('yellow', 2);
  line(-13, -3, -6, -7); line(-6, -7, 1, -3); line(1, -3, 8, -7); line(8, -7, 15, -3);
  pop();
}

function icon_lollipop(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('lgray'); rect(0, 16, 3, 20, 1);
  PF('pink'); ellipse(0, -2, 26, 26);
  noFill(); PS('cream', 2.5);
  arc(0, -2, 18, 18, 0, PI, OPEN);
  arc(0, -2, 10, 10, PI, TWO_PI, OPEN);
  pop();
}

function icon_smarties(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('cream'); rect(0, 0, 32, 22, 5);
  const cols = ['red', 'orange', 'yellow', 'dgreen', 'blue', 'pink'];
  const px = [-9, 0, 9, -9, 0, 9];
  const py = [-5, -5, -5, 6, 6, 6];
  for (let i = 0; i < 6; i++) {
    PS('black', 1.5); PF(cols[i]);
    ellipse(px[i], py[i], 9, 9);
  }
  pop();
}

function icon_popcorn(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('red'); quad(-13, 4, 13, 4, 9, 20, -9, 20);
  PS('cream', 3);
  line(-6, 6, -4, 18); line(0, 6, 0, 18); line(6, 6, 4, 18);
  PS('black', 2); PF('cream');
  ellipse(-8, -2, 10, 10); ellipse(0, -8, 12, 12); ellipse(8, -2, 10, 10);
  ellipse(-3, -10, 9, 9); ellipse(4, -11, 8, 8);
  pop();
}

function icon_cottoncandy(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('lgray'); rect(0, 16, 3, 16, 1);
  PF('pink');
  ellipse(-8, -4, 18, 18); ellipse(8, -4, 18, 18);
  ellipse(0, -12, 18, 18); ellipse(0, -2, 20, 16);
  pop();
}

function icon_cacao(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('dgray', 2); noFill();
  arc(13, 3, 15, 17, -HALF_PI, HALF_PI, OPEN);
  PS('black', 2); PF('cream');
  rect(0, 6, 24, 20, 3);
  PN(); PF('choc');
  ellipse(0, -4, 22, 8);
  PN(); PF('cream');
  ellipse(-4, -5, 3, 3); ellipse(3, -3, 2.5, 2.5);
  PS('lgray', 2); noFill();
  line(-6, -14, -8, -18); line(-8, -18, -5, -22);
  line(3, -14, 1, -18); line(1, -18, 4, -22);
  pop();
}

function icon_tomatopaste(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('lgray'); ellipse(0, -9, 22, 6);
  PF('red'); rect(0, 4, 22, 26, 2);
  PF('cream'); rect(0, 6, 22, 12, 0);
  PN(); PF('red'); ellipse(0, 6, 6, 6);
  PF('dgreen'); triangle(0, 3, -2, 1, 2, 1);
  pop();
}

function icon_chocolate(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('choc'); rect(0, 0, 32, 20, 2);
  PS('dgray', 1.5);
  line(-16, 0, 16, 0); line(-8, -10, -8, 10); line(0, -10, 0, 10); line(8, -10, 8, 10);
  PN(); PF('peach', 90); rect(-10, -6, 6, 4, 1);
  pop();
}

function icon_strawberry(x, y, s) {
  push(); translate(x, y); scale(s / 44);
  PS('black', 2); PF('red');
  beginShape();
  vertex(-11, 0);
  bezierVertex(-11, -8, -6, -4, 0, -4);
  bezierVertex(6, -4, 11, -8, 11, 0);
  bezierVertex(11, 10, 4, 20, 0, 20);
  bezierVertex(-4, 20, -11, 10, -11, 0);
  endShape(CLOSE);
  PN(); PF('dgreen');
  triangle(-8, -4, -2, -4, -5, -12);
  triangle(-2, -4, 4, -4, 1, -13);
  triangle(4, -4, 9, -4, 6, -11);
  PS('dgreen', 2); line(0, -4, 0, -8);
  PN(); PF('yellow');
  ellipse(-5, 4, 2, 2); ellipse(4, 2, 2, 2); ellipse(-3, 10, 2, 2);
  ellipse(5, 10, 2, 2); ellipse(0, 16, 2, 2); ellipse(-6, 14, 2, 2);
  pop();
}

const ICON_FN = {
  walnut: icon_walnut, bagel: icon_bagel, gummy: icon_gummy, cherry: icon_cherry,
  burger: icon_burger, waffle: icon_waffle, olives: icon_olives, milk: icon_milk,
  toffee: icon_toffee, veggies: icon_veggies, chocball: icon_chocball, bread: icon_bread,
  juice: icon_juice, hotdog: icon_hotdog, lollipop: icon_lollipop, smarties: icon_smarties,
  popcorn: icon_popcorn, cottoncandy: icon_cottoncandy, cacao: icon_cacao,
  tomatopaste: icon_tomatopaste, chocolate: icon_chocolate, strawberry: icon_strawberry
};

function drawCandyIcon(type, x, y, s) {
  const fn = ICON_FN[type];
  if (fn) fn(x, y, s);
}

// ---------------------------------------------------------------------
// Scene furniture: dispenser tub, shelf, letter tile, mascot cat, misc.
// ---------------------------------------------------------------------

function drawTub(x, y) {
  push(); translate(x, y);
  PS('black', 2); PF('indigo'); rect(0, 50, 78, 16, 4);
  PF('dgray'); rect(0, 36, 56, 14, 3);
  PS('black', 2); PF('lgray', 235); ellipse(0, -4, 72, 76);
  noFill(); PS('black', 2); ellipse(0, -4, 72, 76);
  PN();
  PF('red'); ellipse(-15, -16, 10, 10);
  PF('yellow'); ellipse(6, -22, 9, 9);
  PF('green'); ellipse(17, -4, 10, 10);
  PF('pink'); ellipse(-6, 6, 9, 9);
  PF('blue'); ellipse(14, 18, 8, 8);
  PS('black', 2); PF('dgray'); rect(0, -36, 52, 10, 3);
  PF('red'); rect(0, -44, 16, 8, 2);
  pop();
}

function drawShelf(cx, y, w) {
  PS('black', 2); PF('brown'); rect(cx, y, w, 12, 0);
  PN(); PF('dgray');
  for (let i = 0; i < w; i += 22) {
    rect(cx - w / 2 + i + 11, y + 3, 2, 6, 0);
  }
}

function drawLetterTile(x, y, letter, colKey, rot, s) {
  push(); translate(x, y); rotate(rot); scale(s / 44);
  PS('black', 2); PF(colKey);
  triangle(-17, -8, -17, 8, -27, 0);
  triangle(17, -8, 17, 8, 27, 0);
  rect(0, 0, 34, 34, 8);
  PN(); fill(20, 20, 24);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(24);
  text(letter, 0, 2);
  textStyle(NORMAL);
  pop();
}

function drawMascotCat(x, y, s, blink) {
  push(); translate(x, y); scale(s / 60);
  PS('black', 2); PF('peach');
  ellipse(0, 0, 50, 46);
  triangle(-22, -16, -6, -32, -12, -4);
  triangle(22, -16, 6, -32, 12, -4);
  PN(); PF('pink');
  triangle(-17, -17, -10, -25, -13, -9);
  triangle(17, -17, 10, -25, 13, -9);
  PF('black');
  if (blink) {
    rect(-11, 0, 7, 2, 1); rect(11, 0, 7, 2, 1);
  } else {
    ellipse(-11, 0, 5, 7); ellipse(11, 0, 5, 7);
  }
  PF('pink'); triangle(-3, 8, 3, 8, 0, 12);
  PS('dgray', 1.5);
  line(-25, 10, -45, 6); line(-25, 14, -45, 14);
  line(25, 10, 45, 6); line(25, 14, 45, 14);
  pop();
}

function drawStarBurst(x, y, colKey, t) {
  // t: 0..1 progress of a catch celebration effect
  push(); translate(x, y);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (TWO_PI / n) * i + t * 1.5;
    const r = 6 + t * 26;
    PN(); PF(colKey, 255 * (1 - t));
    ellipse(cos(a) * r, sin(a) * r, 6 * (1 - t * 0.5), 6 * (1 - t * 0.5));
  }
  pop();
}
