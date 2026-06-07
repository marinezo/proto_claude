var video;

// Dreamy blob / thread visuals
var PALETTE = ['#fdd302', '#118c4b', '#ff79be', '#706bad', '#0273b7', '#601f3f',
               '#7fd9c4', '#9b6bd6', '#ff9b54', '#5f7fd6'];
var BG_COLOR = '#F5F1EA';
var blobs = [];
var threads = [];
var NUM_BLOBS = 26;
var NUM_THREADS = 38;
var peakBoost = 0;       // decays each frame, spikes visuals on a pulse

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

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);

  for (var i = 0; i < NUM_BLOBS; i++) blobs.push(makeBlob());
  for (var i = 0; i < NUM_THREADS; i++) threads.push(makeThread());

  startCamera();
  setupButtons();
}

function makeBlob() {
  return {
    x: random(width),
    y: random(height),
    r: random(40, 130),
    col: color(random(PALETTE)),
    driftX: random(-0.12, 0.12),
    driftY: random(-0.12, 0.12),
    phase: random(TWO_PI),
    pulseSpeed: random(0.004, 0.012),
    baseAlpha: random(60, 110)
  };
}

function makeThread() {
  var x = random(width);
  var y = random(height);
  var len = random(40, 220);
  var ang = random(TWO_PI);
  return {
    x: x,
    y: y,
    ex: x + cos(ang) * len,
    ey: y + sin(ang) * len,
    driftX: random(-0.05, 0.05),
    driftY: random(-0.05, 0.05),
    col: color(random([0, 30, 60])),
    weight: random(0.6, 1.2)
  };
}

function draw() {
  background(BG_COLOR);

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
  peakBoost     = max(0, peakBoost     - 0.02);

  drawBlobs(now);
  drawThreads();

  var heartX = 36;
  var heartY = height - 36;
  drawPixelHeart(heartX, heartY, 10);

  fill(70, 60, 55);
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
    stroke(180, 170, 160);
    strokeWeight(1);
    noFill();
    ellipse(indX, indY, 18, 18);
  }

  noStroke();
  fill(150, 140, 130);
  textSize(10);
  textFont('monospace');
  textAlign(CENTER, BOTTOM);
  text('TAP to pulse', width / 2, height - 16);
}

function drawBlobs(now) {
  noStroke();
  drawingContext.save();
  drawingContext.filter = 'blur(' + (width * 0.018) + 'px)';

  for (var i = 0; i < blobs.length; i++) {
    var b = blobs[i];
    b.x += b.driftX * (1 + peakBoost * 3);
    b.y += b.driftY * (1 + peakBoost * 3);

    if (b.x < -b.r) b.x = width + b.r;
    if (b.x > width + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = height + b.r;
    if (b.y > height + b.r) b.y = -b.r;

    var pulseR = b.r * (1 + sin(now * b.pulseSpeed + b.phase) * 0.08 + peakBoost * 0.55);
    var a = b.baseAlpha * (1 + peakBoost * 0.9);

    fill(red(b.col), green(b.col), blue(b.col), min(255, a));
    ellipse(b.x, b.y, pulseR * 2, pulseR * 2);
  }

  drawingContext.restore();
}

function drawThreads() {
  for (var i = 0; i < threads.length; i++) {
    var t = threads[i];
    var dx = t.driftX * (1 + peakBoost * 4);
    var dy = t.driftY * (1 + peakBoost * 4);
    t.x += dx; t.y += dy;
    t.ex += dx; t.ey += dy;

    var w = width + 200;
    var h = height + 200;
    if (t.x < -100) { t.x += w; t.ex += w; }
    if (t.x > width + 100) { t.x -= w; t.ex -= w; }
    if (t.y < -100) { t.y += h; t.ey += h; }
    if (t.y > height + 100) { t.y -= h; t.ey -= h; }

    stroke(red(t.col), green(t.col), blue(t.col), 110);
    strokeWeight(t.weight);
    line(t.x, t.y, t.ex, t.ey);

    noStroke();
    fill(red(t.col), green(t.col), blue(t.col), 200);
    ellipse(t.x, t.y, 4.5, 4.5);
  }
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
}
