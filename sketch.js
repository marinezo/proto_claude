var video;

// Wave / line visuals
var NUM_LAYERS = 5;
var layers = [];
var waveHistory = [];        // recorded peak amplitude per frame, scrolls across screen
var MAX_HISTORY = 0;     // set in setup based on width
var baseAmp = 26;
var peakBoost = 0;       // decays each frame, spikes the line on a pulse

// Pulse
var readings = [];
var maxReadings = 20;
var lastBeatTime = 0;
var beatThreshold = 1.5;
var indicatorFill = 0;
var pulseFlash  = 0;
var bpm = 0;
var bpmHistory = [];
var lastPulseMs = 0;
var manualPulse = false;

// Camera
var facingMode = 'environment';
var camOn = true;

var PALETTE = ['#fdd302', '#118c4b', '#ff79be', '#706bad', '#0273b7', '#601f3f'];
var BG_COLOR = '#F7F1E6';
var smoothAmp = 0;
var paper;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);

  MAX_HISTORY = floor(width / 4);
  for (var i = 0; i < MAX_HISTORY; i++) waveHistory.push(0);

  NUM_LAYERS = PALETTE.length;
  for (var i = 0; i < NUM_LAYERS; i++) {
    layers.push({
      col:    PALETTE[i],
      speed:  random(0.0012, 0.0025),
      freq:   random(0.0009, 0.0018),
      phase:  random(TWO_PI),
      ampMul: map(i, 0, NUM_LAYERS - 1, 0.6, 1.25),
      yOff:   map(i, 0, NUM_LAYERS - 1, -1, 1) * (height * 0.16),
      weight: width * 0.045
    });
  }

  paper = createGraphics(width, height);
  paper.colorMode(RGB, 255, 255, 255, 255);
  paper.background(BG_COLOR);
  paper.noStroke();
  for (var g = 0; g < width * height * 0.06; g++) {
    var gx = random(width), gy = random(height);
    var v = random(1) < 0.5 ? 0 : 255;
    paper.fill(v, v, v, random(4, 14));
    paper.rect(gx, gy, random(1, 2), random(1, 2));
  }

  startCamera();
  setupButtons();
}

function draw() {
  image(paper, 0, 0);

  var now = millis();

  var rawSignal = getPulseStrength();
  var boostedSignal = rawSignal * 4;
  var isPulse = manualPulse || (boostedSignal > beatThreshold && now - lastBeatTime > 300);
  manualPulse = false;
  if (isPulse) {
    lastBeatTime = now;
    indicatorFill = 1;
    pulseFlash  = 1.0;
    peakBoost = 1.0;
  }

  pulseFlash    = max(0, pulseFlash    - 0.035);
  indicatorFill = max(0, indicatorFill - 0.03);
  peakBoost     = max(0, peakBoost     - 0.045);

  // record current peak amplitude and scroll waveHistory rightward
  waveHistory.push(baseAmp * (1 + peakBoost * 6));
  if (waveHistory.length > MAX_HISTORY) waveHistory.shift();

  smoothAmp += (waveHistory[waveHistory.length - 1] - smoothAmp) * 0.04;

  drawTrippyWaves(now);

  var heartX = 36;
  var heartY = 36;
  drawPixelHeart(heartX, heartY, 10);

  fill(40, 35, 35);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(16);
  textFont('monospace');
  var bpmStr = bpm > 0 ? str(bpm) : '--';
  text(bpmStr, heartX + 18, heartY);

  var indX = width - 40;
  var indY = 40;
  noStroke();
  if (indicatorFill > 0.5) {
    fill(96, 31, 63, 65);
    ellipse(indX, indY, 28, 28);
    fill(96, 31, 63, 200);
    ellipse(indX, indY, 12, 12);
  } else {
    stroke(120);
    strokeWeight(1);
    noFill();
    ellipse(indX, indY, 18, 18);
  }

  noStroke();
  fill(120);
  textSize(10);
  textFont('monospace');
  textAlign(CENTER, BOTTOM);
  text('TAP to pulse', width / 2, height - 16);
}

function waveY(lay, xc, now) {
  var hi = floor(map(xc, 0, width, 0, waveHistory.length - 1));
  hi = constrain(hi, 0, waveHistory.length - 1);
  var amp = (smoothAmp * 0.5 + waveHistory[hi] * 0.5) * lay.ampMul;

  var wob = sin(xc * lay.freq + now * lay.speed + lay.phase) * amp;
  wob += sin(xc * lay.freq * 0.45 - now * lay.speed * 0.55 + lay.phase * 1.7) * amp * 0.5;
  wob += sin(xc * lay.freq * 0.2 + now * lay.speed * 0.3 + lay.phase * 0.6) * amp * 0.3;

  // organic high-frequency grain via noise (turbulent ink edges, not a clean sine)
  wob += (noise(xc * 0.01, lay.phase, now * 0.00012) - 0.5) * amp * 0.6;

  return wob;
}

function drawTrippyWaves(now) {
  var midY = height / 2;
  var f = 1.0 + pulseFlash * 0.18;

  noStroke();
  blendMode(MULTIPLY);

  var STRANDS = 16;
  var step = 14;

  for (var L = 0; L < layers.length; L++) {
    var lay = layers[L];
    var c = color(lay.col);
    var baseW = lay.weight * f;

    for (var s = 0; s < STRANDS; s++) {
      // each strand: a thin organic ribbon offset from the core line,
      // with its own noise seed so edges fray independently like wet pigment
      var seed = lay.phase * 13.7 + s * 91.3;
      var off  = map(s, 0, STRANDS - 1, -1, 1) * baseW * 0.5;
      var alpha = map(abs(s - (STRANDS - 1) / 2), 0, (STRANDS - 1) / 2, 34, 6);

      fill(red(c), green(c), blue(c), alpha);

      beginShape();
      var pts = [];
      for (var x = -step; x <= width + step; x += step) {
        var xc = constrain(x, 0, width);
        var w = waveY(lay, xc, now);
        var n = (noise(xc * 0.018, seed, now * 0.0002) - 0.5) * baseW * 0.9;
        pts.push({ x: x, y: midY + lay.yOff + w + off + n });
      }
      curveVertex(pts[0].x, pts[0].y);
      for (var i = 0; i < pts.length; i++) curveVertex(pts[i].x, pts[i].y);
      curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].y);
      endShape();
    }

    // a darker, drier "pigment edge" line tracing the core path
    noFill();
    stroke(red(c) * 0.7, green(c) * 0.7, blue(c) * 0.7, 50);
    strokeWeight(1.4);
    beginShape();
    var pts2 = [];
    for (var x2 = -step; x2 <= width + step; x2 += step) {
      var xc2 = constrain(x2, 0, width);
      var w2 = waveY(lay, xc2, now);
      pts2.push({ x: x2, y: midY + lay.yOff + w2 });
    }
    curveVertex(pts2[0].x, pts2[0].y);
    for (var j = 0; j < pts2.length; j++) curveVertex(pts2[j].x, pts2[j].y);
    curveVertex(pts2[pts2.length - 1].x, pts2[pts2.length - 1].y);
    endShape();
    noStroke();
  }

  blendMode(BLEND);
}

function registerPulse() {
  var now = millis();
  if (lastPulseMs > 0) {
    var interval = now - lastPulseMs;
    if (interval > 250 && interval < 3000) {
      bpmHistory.push(60000 / interval);
      if (bpmHistory.length > 6) bpmHistory.shift();
      var sum = 0;
      for (var i = 0; i < bpmHistory.length; i++) sum += bpmHistory[i];
      bpm = constrain(round(sum / bpmHistory.length), 40, 200);
    }
  }
  lastPulseMs = now;
  lastBeatTime = now;
  indicatorFill = 1;
  manualPulse = true;
}

function keyPressed() {
  if (key === ' ') registerPulse();
}

function mousePressed() {
  if (mouseX < 120 && mouseY > height - 100) return;
  registerPulse();
}

function touchStarted() {
  if (touches.length > 0 && touches[0].x < 120 && touches[0].y > height - 100) return;
  registerPulse();
  return false;
}

function drawPixelHeart(px, py, s) {
  var grid = [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0]
  ];
  var ps = max(1, floor(s / 5));
  noStroke();
  fill(96, 31, 63);
  for (var row = 0; row < grid.length; row++) {
    for (var col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        rect(px + (col - 3) * ps, py + (row - 3) * ps, ps, ps);
      }
    }
  }
}

function getPulseStrength() {
  if (!video || !video.pixels || !camOn) return 0;
  video.loadPixels();
  if (!video.pixels.length) return 0;
  var rSum = 0;
  var count = 0;
  var sx = floor(video.width / 2 - 15);
  var sy = floor(video.height / 2 - 15);
  for (var x = sx; x < sx + 30; x++) {
    for (var y = sy; y < sy + 30; y++) {
      var idx = (x + y * video.width) * 4;
      rSum += video.pixels[idx];
      count++;
    }
  }
  var currentR = count > 0 ? rSum / count : 0;
  var ci = (floor(video.width / 2) + floor(video.height / 2) * video.width) * 4;
  if (video.pixels[ci] < video.pixels[ci + 1] + 5) return 0;
  readings.push(currentR);
  if (readings.length > maxReadings) readings.shift();
  if (readings.length < 5) return 0;
  var avg = 0;
  for (var i = 0; i < readings.length; i++) avg += readings[i];
  avg /= readings.length;
  return max(0, currentR - avg);
}

function startCamera() {
  if (video) video.remove();
  video = createCapture({
    video: { facingMode: facingMode, width: 320, height: 240 },
    audio: false
  });
  video.size(320, 240);
  video.elt.setAttribute('playsinline', '');
  video.hide();
}

function setupButtons() {
  var btnStyle = function(btn) {
    btn.style('font-family', 'monospace');
    btn.style('font-weight', 'bold');
    btn.style('background', '#111');
    btn.style('border', '1px solid #333');
  };

  var toggleBtn = createButton('Cam ON');
  toggleBtn.position(20, height - 80);
  btnStyle(toggleBtn);
  toggleBtn.style('color', '#5f5');
  toggleBtn.mousePressed(function() {
    camOn = !camOn;
    if (!camOn) {
      if (video) { video.stop(); video.hide(); }
      toggleBtn.html('Cam OFF');
      toggleBtn.style('color', '#f55');
    } else {
      startCamera();
      toggleBtn.html('Cam ON');
      toggleBtn.style('color', '#5f5');
    }
  });

  var switchBtn = createButton('Rear Cam');
  switchBtn.position(20, height - 40);
  btnStyle(switchBtn);
  switchBtn.style('color', '#aaa');
  switchBtn.mousePressed(function() {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    startCamera();
    switchBtn.html('' + (facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'));
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  MAX_HISTORY = floor(width / 4);
  while (waveHistory.length < MAX_HISTORY) waveHistory.unshift(0);
  while (waveHistory.length > MAX_HISTORY) waveHistory.shift();

  paper = createGraphics(width, height);
  paper.colorMode(RGB, 255, 255, 255, 255);
  paper.background(BG_COLOR);
  paper.noStroke();
  for (var g = 0; g < width * height * 0.06; g++) {
    var gx = random(width), gy = random(height);
    var v = random(1) < 0.5 ? 0 : 255;
    paper.fill(v, v, v, random(4, 14));
    paper.rect(gx, gy, random(1, 2), random(1, 2));
  }
}
