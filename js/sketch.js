// ---------------------------------------------------------------------
// לומדים אותיות עם ממתקים — Learn Hebrew Letters with Candy
// A pixel-art candy dispenser: candies (and occasional Hebrew letters)
// roll out of a tub. Tap one to catch it and reveal its word below.
// ---------------------------------------------------------------------

const W = 480, H = 800;

const TUB_X = 96, TUB_Y = 150;
const SHELF_Y = 246;
const SPAWN_X = 132;
const DESPAWN_X = W + 60;

const ANSWER_BOX = { x: 20, y: 306, w: 440, h: 178 };
const TRACK_X0 = 20, TRACK_Y0 = 522, TILE = 36, TILE_GAP = 4, TILE_COLS = 11;

let items = [];
let particles = [];
let answerState = { type: 'idle' };
let learnedSet = new Set();
let caughtCount = 0;
let nextSpawnAt = 0;
let lastSpawnIdx = -1;
let muted = false;
let actx = null;
let blinkTimer = 0;
let blinkOn = false;

function setup() {
  const c = createCanvas(W, H);
  c.parent('gameWrap');
  rectMode(CENTER);
  ellipseMode(CENTER);
  textFont('Heebo, Arial, sans-serif');
  CANDY_DATA.forEach((d, i) => { d.colKey = CANDY_COLOR_CYCLE[i % CANDY_COLOR_CYCLE.length]; });
  nextSpawnAt = millis() + 600;
  blinkTimer = millis() + random(2000, 5000);
}

function draw() {
  drawBackground();
  handleSpawning();
  updateItems();
  drawShelf(W / 2, SHELF_Y, W);
  drawTub(TUB_X, TUB_Y);
  drawItems();
  drawParticles();
  drawAnswerBox();
  drawProgressTracker();
  drawMascotScene();
  drawHeader();
}

// ---------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------

function drawBackground() {
  noStroke();
  for (let y = 0; y < 300; y++) {
    const t = y / 300;
    const r = lerp(29, 131, t), g = lerp(20, 118, t), b = lerp(50, 156, t);
    stroke(r, g, b); line(0, y, W, y);
  }
  noStroke();
  PF('cream'); rect(W / 2, 300 + 250, W, 500);

  PN(); PF('cream', 200);
  const twinkle = (frameCount % 90) < 45;
  const stars = [[40, 40], [400, 30], [340, 80], [60, 110], [430, 130], [200, 24]];
  for (let i = 0; i < stars.length; i++) {
    if ((i % 2 === 0) === twinkle) {
      rect(stars[i][0], stars[i][1], 3, 3);
    }
  }

  PS('black', 2); PF('dgray');
  rect(W / 2, 300, W, 4);
}

// ---------------------------------------------------------------------
// Spawning & rolling items
// ---------------------------------------------------------------------

function handleSpawning() {
  if (millis() < nextSpawnAt) return;
  nextSpawnAt = millis() + random(4200, 6000);
  if (items.length >= 6) return;

  let idx = floor(random(CANDY_DATA.length));
  if (idx === lastSpawnIdx) idx = (idx + 1) % CANDY_DATA.length;
  lastSpawnIdx = idx;
  const data = CANDY_DATA[idx];
  const kind = random() < 0.28 ? 'letter' : 'candy';

  items.push({
    kind, data,
    x: SPAWN_X, y: SHELF_Y,
    r: kind === 'letter' ? 22 : 24,
    speed: random(0.22, 0.32),
    phase: random(TWO_PI),
    caught: false
  });
}

function updateItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.x += it.speed;
    if (it.x > DESPAWN_X) items.splice(i, 1);
  }
  if (millis() > blinkTimer) {
    blinkOn = true;
    if (millis() > blinkTimer + 150) {
      blinkOn = false;
      blinkTimer = millis() + random(2500, 6000);
    }
  }
}

function drawItems() {
  for (const it of items) {
    const bounce = abs(sin(frameCount * 0.15 + it.phase)) * 4;
    const wobble = sin(frameCount * 0.12 + it.phase) * 0.22;
    const dy = SHELF_Y - bounce - 6;
    PN(); PF('black', 40);
    ellipse(it.x, SHELF_Y + 8, it.r * 1.4, 6);
    if (it.kind === 'candy') {
      push(); translate(it.x, dy); rotate(wobble);
      drawCandyIcon(it.data.icon, 0, 0, 46);
      pop();
    } else {
      drawLetterTile(it.x, dy, it.data.letter, it.data.colKey, wobble, 44);
    }
  }
}

// ---------------------------------------------------------------------
// Catching
// ---------------------------------------------------------------------

function attemptCatch(mx, my) {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (dist(mx, my, it.x, SHELF_Y) < it.r + 6) {
      catchItem(it);
      items.splice(i, 1);
      return true;
    }
  }
  return false;
}

function catchItem(it) {
  particles.push({ x: it.x, y: SHELF_Y, colKey: it.data.colKey, t: 0 });
  playPop();
  caughtCount++;
  learnedSet.add(it.data.letter);
  if (it.kind === 'candy') {
    answerState = { type: 'word', data: it.data };
    speakLetterThenWord(it.data.name, it.data.word);
  } else {
    answerState = { type: 'letterHold', data: it.data, until: millis() + 3000 };
    speak(it.data.name);
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += 0.045;
    if (p.t >= 1) { particles.splice(i, 1); continue; }
    drawStarBurst(p.x, p.y, p.colKey, p.t);
  }
}

// ---------------------------------------------------------------------
// Answer container
// ---------------------------------------------------------------------

function drawAnswerBox() {
  const b = ANSWER_BOX;
  PS('black', 3); PF('cream');
  rect(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 14);
  PN(); PF('dgray', 140);
  rect(b.x + b.w / 2, b.y + b.h - 8, b.w - 16, 4, 2);

  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;

  if (answerState.type === 'letterHold' && millis() > answerState.until) {
    const d = answerState.data;
    answerState = { type: 'word', data: d };
    speak(d.word);
  }

  if (answerState.type === 'idle') {
    PS('black', 2); PF('lgray');
    ellipse(cx, cy - 24, 70, 70);
    PN(); fill(90, 85, 80); textAlign(CENTER, CENTER); textSize(46); textStyle(BOLD);
    text('?', cx, cy - 20);
    textStyle(NORMAL);
    fill(70, 65, 62); textSize(17);
    text('לחצו על ממתק או אות שמתגלגלים!', cx, cy + 46);
    return;
  }

  if (answerState.type === 'letterHold') {
    const d = answerState.data;
    drawCandyIcon(d.icon, cx, cy - 4, 118);
    const remain = constrain((answerState.until - millis()) / 3000, 0, 1);
    const badgeX = b.x + b.w - 34, badgeY = b.y + 34;
    PS('black', 2); PF(d.colKey);
    rect(badgeX, badgeY, 34, 34, 8);
    PN(); fill(20); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(24);
    text(d.letter, badgeX, badgeY + 2);
    textStyle(NORMAL);
    PN(); PF('lgray');
    rect(cx, b.y + b.h - 20, b.w - 60, 8, 4);
    PF(d.colKey);
    rect(cx - (b.w - 60) / 2 + ((b.w - 60) * remain) / 2, b.y + b.h - 20, (b.w - 60) * remain, 8, 4);
    return;
  }

  if (answerState.type === 'word') {
    const d = answerState.data;
    drawCandyIcon(d.icon, cx, cy - 46, 72);
    const maxW = b.w - 60;
    const w40 = measureHebrewWordWidth(d.word, 40);
    const fsize = w40 > maxW ? max(20, 40 * maxW / w40) : 40;
    drawHebrewWord(d.word, cx, cy + 30, fsize, PAL[d.colKey]);
    fill(120, 112, 106); noStroke(); textAlign(CENTER, CENTER); textSize(15);
    text(d.gloss, cx, cy + 58);
  }
}

function measureHebrewWordWidth(word, size) {
  push();
  textSize(size); textStyle(BOLD);
  const sp = size * 0.04;
  const chars = word.split('');
  let total = sp * (chars.length - 1);
  for (const c of chars) total += (c === ' ' ? size * 0.32 : textWidth(c));
  textStyle(NORMAL);
  pop();
  return total;
}

function drawHebrewWord(word, cx, cy, size, emphColArr) {
  push();
  textSize(size);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  const chars = word.split('');
  const sp = size * 0.04;
  const widths = chars.map(c => (c === ' ' ? size * 0.32 : textWidth(c)));
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  const startX = cx - total / 2;
  let curX = startX;
  for (let i = chars.length - 1; i >= 0; i--) {
    const c = chars[i];
    const w = widths[i];
    if (i === 0) fill(emphColArr[0], emphColArr[1], emphColArr[2]);
    else fill(35, 32, 30);
    noStroke();
    text(c, curX, cy);
    if (i === 0 && c !== ' ') {
      stroke(emphColArr[0], emphColArr[1], emphColArr[2]);
      strokeWeight(3);
      line(curX, cy + size * 0.42, curX + w, cy + size * 0.42);
      noStroke();
    }
    curX += w + sp;
  }
  textStyle(NORMAL);
  pop();
}

// ---------------------------------------------------------------------
// Progress tracker
// ---------------------------------------------------------------------

function drawProgressTracker() {
  fill(70, 65, 62); noStroke(); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD);
  text('האותיות שלמדנו', W / 2, TRACK_Y0 - 12);
  textStyle(NORMAL);

  for (let i = 0; i < CANDY_DATA.length; i++) {
    const d = CANDY_DATA[i];
    const col = i % TILE_COLS, row = floor(i / TILE_COLS);
    const x = TRACK_X0 + col * (TILE + TILE_GAP) + TILE / 2;
    const y = TRACK_Y0 + row * (TILE + TILE_GAP) + TILE / 2;
    const learned = learnedSet.has(d.letter);
    PS('black', 1.5);
    if (learned) PF(d.colKey); else PF('lgray', 130);
    rect(x, y, TILE, TILE, 6);
    PN();
    fill(learned ? 20 : 150);
    textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD);
    text(d.letter, x, y + 1);
    textStyle(NORMAL);
  }
}

// ---------------------------------------------------------------------
// Mascot + header
// ---------------------------------------------------------------------

function drawMascotScene() {
  PN(); PF('peach', 60);
  rect(W / 2, 700, W, 200);
  drawMascotCat(W - 66, 700, 88, blinkOn);
  fill(140, 120, 90); noStroke(); textAlign(CENTER, CENTER); textSize(14);
  text('נתפסו ' + caughtCount + ' ממתקים!', W / 2 - 40, 700);
}

function drawHeader() {
  PS('black', 3); PF('navy');
  rect(W / 2, 26, W, 52);
  fill(255, 241, 232); noStroke(); textAlign(CENTER, CENTER); textSize(22); textStyle(BOLD);
  text('🍬 לומדים אותיות עם ממתקים 🍬', W / 2, 26);
  textStyle(NORMAL);

  drawMuteButton(W - 30, 26);
}

function drawMuteButton(x, y) {
  PS('black', 2); PF(muted ? 'dgray' : 'orange');
  rect(x, y, 32, 32, 8);
  PN(); fill(255);
  textAlign(CENTER, CENTER); textSize(16);
  text(muted ? '🔇' : '🔊', x, y + 1);
}

// ---------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------

function handlePress(mx, my) {
  ensureAudio();
  if (dist(mx, my, W - 30, 26) < 20) {
    muted = !muted;
    if (muted && window.speechSynthesis) window.speechSynthesis.cancel();
    return;
  }
  attemptCatch(mx, my);
}

function mousePressed() { handlePress(mouseX, mouseY); return false; }
function touchStarted() {
  if (touches.length > 0) handlePress(touches[0].x, touches[0].y);
  else handlePress(mouseX, mouseY);
  return false;
}

// ---------------------------------------------------------------------
// Speech (letter name, then word)
// ---------------------------------------------------------------------

function speak(text) {
  if (muted || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unsupported, ignore */ }
}

function speakLetterThenWord(letterName, word) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  speak(letterName);
  speak(word);
}

// ---------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------

function ensureAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}

function playPop() {
  if (muted || !actx) return;
  const t = actx.currentTime;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g); g.connect(actx.destination);
  o.start(t); o.stop(t + 0.26);
}
