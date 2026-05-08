/* PROJECT: Pebbles
   THEME: Sensory Transducer / Somatic Calibrator
   AESTHETIC: Black bg, luminous additive-blend drops (Apple Watch Blood O2 ref)
   - Colorful blob pebbles with gravity physics
   - Pulse launches them upward, they settle back down
   - Completely still when no input
*/

var video;
var pebbles = [];
var cx, cy;
var WATCH_R = 200;
var NUM_PEBBLES = 90;

// Pulse
var freeDots = [];        // dots that escaped from blobs on beat
var MAX_FREE_DOTS = 800;
var readings = [];
var maxReadings = 20;
var lastBeatTime = 0;
var beatThreshold = 1.5;
var indicatorFill = 0;
var pulseFlash  = 0;  // slow decay — brightens drops on beat
var screenFlash = 0;  // fast decay — white bloom across the watch face
var bpm = 0;
var bpmHistory = [];
var lastPulseMs = 0;
var manualPulse = false;

// Camera
var devices = [];
var currentDeviceIndex = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
  cx = round(width / 2);
  cy = round(height / 2);

  for (var i = 0; i < NUM_PEBBLES; i++) {
    var r = random(5, 25);
    var ang = random(TWO_PI);
    var dist_from_center = random(0, WATCH_R - r - 2);

    // Each blob is a fixed dot cloud — random offsets within radius, stored once
    var dots = [];
    var numDots = max(50, floor(r * 6.0));
    for (var d = 0; d < numDots; d++) {
      var da = random(TWO_PI);
      var dr = r * pow(random(), 0.22); // steep edge density, sparse interior
      var c  = random(1);
      dots.push({
        ox:  cos(da) * dr,
        oy:  sin(da) * dr,
        col: c < 0.42 ? 0 : c < 0.84 ? 1 : 2,
        sz:  random(0.8, 2.2),
        a:   random(160, 255)
      });
    }

    pebbles.push({
      x:  cx + cos(ang) * dist_from_center,
      y:  cy + sin(ang) * dist_from_center - WATCH_R * 0.3,
      vx: random(-0.5, 0.5),
      vy: random(0, 1),
      r:  r,
      dots: dots
    });
  }

  getVideoDevices();
}

function physicsTick(isPulse) {
  var GRAVITY = 0.15;
  var DAMPING = 0.85;
  var STOP_THRESHOLD = 0.1;

  if (isPulse) {
    for (var i = 0; i < pebbles.length; i++) {
      var p = pebbles[i];
      p.vx += random(-3, 3);
      p.vy += random(-12, -6);
      // shed a few dots on each beat
      var shed = floor(random(2, 6));
      for (var s = 0; s < shed; s++) {
        var dt = p.dots[floor(random(p.dots.length))];
        freeDots.push({
          x:   p.x + dt.ox,
          y:   p.y + dt.oy,
          vx:   p.vx + random(-2, 2),
          vy:   p.vy + random(-2, 1),
          grav: random(-0.14, 0.08), // negative = rises, positive = falls
          col: dt.col,
          sz:  dt.sz,
          a:   dt.a
        });
      }
    }
    if (freeDots.length > MAX_FREE_DOTS)
      freeDots.splice(0, freeDots.length - MAX_FREE_DOTS);
  }

  // free dot physics — gravity + circular boundary
  for (var i = 0; i < freeDots.length; i++) {
    var fd = freeDots[i];
    fd.vy += fd.grav;                 // per-dot gravity: neg = up, pos = down
    fd.vx += random(-0.04, 0.04);    // gentle horizontal wobble
    fd.x  += fd.vx;
    fd.y  += fd.vy;
    fd.vx *= 0.90;
    fd.vy *= 0.90;
    if (abs(fd.vx) < 0.05 && abs(fd.vy) < 0.05) { fd.vx = 0; fd.vy = 0; }
    var dx = fd.x - cx, dy = fd.y - cy;
    var dd = sqrt(dx*dx + dy*dy);
    var maxD = WATCH_R - 2;
    if (dd > maxD && dd > 0.01) {
      var nx = dx/dd, ny = dy/dd;
      fd.x = cx + nx * maxD;
      fd.y = cy + ny * maxD;
      var dot = fd.vx*nx + fd.vy*ny;
      if (dot > 0) { fd.vx -= 2*dot*nx*0.3; fd.vy -= 2*dot*ny*0.3; }
    }
  }

  for (var i = 0; i < pebbles.length; i++) {
    var p = pebbles[i];
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= DAMPING;
    p.vy *= DAMPING;
    if (abs(p.vx) < STOP_THRESHOLD && abs(p.vy) < STOP_THRESHOLD) {
      p.vx = 0;
      p.vy = 0;
    }
  }

  // pebble-to-pebble collisions
  for (var i = 0; i < pebbles.length; i++) {
    for (var j = i + 1; j < pebbles.length; j++) {
      var a = pebbles[i];
      var b = pebbles[j];
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var d = sqrt(dx * dx + dy * dy);
      var minD = a.r + b.r;
      if (d < minD && d > 0.01) {
        var nx = dx / d;
        var ny = dy / d;
        var overlap = (minD - d) * 0.5;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        var relVx = a.vx - b.vx;
        var relVy = a.vy - b.vy;
        var dot = relVx * nx + relVy * ny;
        if (dot > 0) {
          a.vx -= nx * dot * 0.5;
          a.vy -= ny * dot * 0.5;
          b.vx += nx * dot * 0.5;
          b.vy += ny * dot * 0.5;
        }
      }
    }
  }

  // boundary: keep inside circle
  for (var i = 0; i < pebbles.length; i++) {
    var p = pebbles[i];
    var dx = p.x - cx;
    var dy = p.y - cy;
    var d = sqrt(dx * dx + dy * dy);
    var maxD = WATCH_R - p.r - 1;
    if (d > maxD && d > 0.01) {
      var nx = dx / d;
      var ny = dy / d;
      p.x = cx + nx * maxD;
      p.y = cy + ny * maxD;
      var dot = p.vx * nx + p.vy * ny;
      if (dot > 0) {
        p.vx -= 2 * dot * nx * 0.4;
        p.vy -= 2 * dot * ny * 0.4;
      }
    }
  }
}

function draw() {
  background(0);

  var now = millis();

  // ── SIGNAL ────────────────────────────────────────────────
  var rawSignal = getPulseStrength();
  var boostedSignal = rawSignal * 4;
  var isPulse = manualPulse || (boostedSignal > beatThreshold && now - lastBeatTime > 300);
  manualPulse = false;
  if (isPulse) {
    lastBeatTime = now;
    indicatorFill = 1;
    pulseFlash  = 1.0;
    screenFlash = 1.0;
  }

  pulseFlash    = max(0, pulseFlash    - 0.035);
  screenFlash   = max(0, screenFlash   - 0.07);
  indicatorFill = max(0, indicatorFill - 0.03);

  // ── PHYSICS ───────────────────────────────────────────────
  physicsTick(isPulse);

  // ── CLIP TO WATCH CIRCLE ──────────────────────────────────
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, WATCH_R - 1, 0, Math.PI * 2);
  drawingContext.clip();

  // ── PEBBLES ───────────────────────────────────────────────
  // Each blob has three color patches at independently random centers,
  // stored at creation and fixed to the blob forever:
  //   blue pool  — large radial at blueOff
  //   red pool   — large radial at redOff
  //   white shine — tight radial at shineOff
  // Each physics blob renders as a dot cloud — no gradients, no shapes.
  // ADD blending: overlapping dots sum toward white; sparse areas stay blue/red.
  blendMode(ADD);
  noStroke();

  for (var i = 0; i < pebbles.length; i++) {
    var p = pebbles[i];
    var f = 1.0 + pulseFlash * 1.8;
    for (var d = 0; d < p.dots.length; d++) {
      var dt = p.dots[d];
      var alpha = min(255, dt.a * f);
      if (dt.col === 0)      fill(0,   min(255, 160*f), 255, alpha);
      else if (dt.col === 1) fill(min(255, 220*f), 25, 55, alpha);
      else                   fill(min(255, 230*f), min(255, 215*f), 255, alpha);
      ellipse(p.x + dt.ox, p.y + dt.oy, dt.sz, dt.sz);
    }
  }

  // free dots — settled at bottom, scattered from blobs on beat
  for (var i = 0; i < freeDots.length; i++) {
    var fd = freeDots[i];
    var alpha = min(255, fd.a * f);
    if (fd.col === 0)      fill(0,   min(255, 160*f), 255, alpha);
    else if (fd.col === 1) fill(min(255, 220*f), 25, 55, alpha);
    else                   fill(min(255, 230*f), min(255, 215*f), 255, alpha);
    ellipse(fd.x, fd.y, fd.sz, fd.sz);
  }

  blendMode(BLEND);

  // ── BEAT FLASH — ADD mode on top of blobs, brightens whole face ──
  if (screenFlash > 0) {
    blendMode(ADD);
    var sf = screenFlash;
    var flash = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, WATCH_R);
    flash.addColorStop(0,    'rgba(255,255,255,' + (sf * 0.55).toFixed(3) + ')');
    flash.addColorStop(0.35, 'rgba(180,120,255,' + (sf * 0.30).toFixed(3) + ')');
    flash.addColorStop(0.70, 'rgba(0,80,200,'    + (sf * 0.12).toFixed(3) + ')');
    flash.addColorStop(1,    'rgba(0,0,0,0)');
    drawingContext.fillStyle = flash;
    drawingContext.beginPath();
    drawingContext.arc(cx, cy, WATCH_R, 0, Math.PI * 2);
    drawingContext.fill();
    blendMode(BLEND);
  }

  // ── HEART + BPM ───────────────────────────────────────────
  var heartY = WATCH_R * 0.62;
  drawPixelHeart(cx - 24, cy + heartY, 10);

  fill(255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(14);
  textFont('monospace');
  var bpmStr = bpm > 0 ? str(bpm) : '--';
  text(bpmStr, cx - 4, cy + heartY);

  drawingContext.restore();

  // ── WATCH RING ────────────────────────────────────────────
  noFill();
  stroke(50);
  strokeWeight(1);
  ellipse(cx, cy, WATCH_R * 2, WATCH_R * 2);

  // ── INDICATOR DOT ─────────────────────────────────────────
  var indX = cx - WATCH_R - 30;
  var indY = cy - WATCH_R - 30;
  noStroke();
  if (indicatorFill > 0.5) {
    fill(255, 40, 70, 65);
    ellipse(indX, indY, 28, 28);
    fill(255, 40, 70, 230);
    ellipse(indX, indY, 12, 12);
  } else {
    stroke(55);
    strokeWeight(1);
    noFill();
    ellipse(indX, indY, 18, 18);
  }

  // ── INSTRUCTIONS ──────────────────────────────────────────
  noStroke();
  fill(80);
  textSize(10);
  textFont('monospace');
  textAlign(CENTER, BOTTOM);
  text('SPACE / TAP to pulse', width / 2, height - 16);
}

// ── PULSE ───────────────────────────────────────────────────────

function registerPulse() {
  var now = millis();
  if (lastPulseMs > 0) {
    var interval = now - lastPulseMs;
    if (interval > 250 && interval < 3000) {
      bpmHistory.push(60000 / interval);
      if (bpmHistory.length > 6) bpmHistory.shift();
      var sum = 0;
      for (var i = 0; i < bpmHistory.length; i++) sum += bpmHistory[i];
      bpm = constrain(round(sum / bpmHistory.length), 55, 130);
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
  registerPulse();
}

// ── PIXEL HEART ─────────────────────────────────────────────────

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
  fill(220, 45, 75);
  for (var row = 0; row < grid.length; row++) {
    for (var col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        rect(px + (col - 3) * ps, py + (row - 3) * ps, ps, ps);
      }
    }
  }
}

// ── CAMERA PULSE DETECTION ──────────────────────────────────────

function getPulseStrength() {
  if (!video || !video.pixels) return 0;
  video.loadPixels();
  var rSum = 0;
  var count = 0;
  var sx = floor(video.width / 2 - 10);
  var sy = floor(video.height / 2 - 10);
  for (var x = sx; x < sx + 20; x++) {
    for (var y = sy; y < sy + 20; y++) {
      var i = (x + y * video.width) * 4;
      if (video.pixels[i]) { rSum += video.pixels[i]; count++; }
    }
  }
  var currentR = count > 0 ? rSum / count : 0;
  var ci = (floor(video.width / 2) + floor(video.height / 2) * video.width) * 4;
  if (video.pixels[ci] < video.pixels[ci + 1] + 10) return 0;
  readings.push(currentR);
  if (readings.length > maxReadings) readings.shift();
  if (readings.length < 5) return 0;
  var avg = 0;
  for (var i = 0; i < readings.length; i++) avg += readings[i];
  avg /= readings.length;
  return max(0, currentR - avg);
}

// ── CAMERA SETUP ────────────────────────────────────────────────

function getVideoDevices() {
  if (navigator.mediaDevices) {
    navigator.mediaDevices.enumerateDevices().then(gotDevices);
  }
}

function gotDevices(deviceInfos) {
  devices = [];
  for (var i = 0; i < deviceInfos.length; i++) {
    if (deviceInfos[i].kind === 'videoinput') devices.push(deviceInfos[i]);
  }
  if (devices.length > 0) {
    var frontIndex = -1;
    for (var i = 0; i < devices.length; i++) {
      if (devices[i].label.toLowerCase().indexOf('front') !== -1) {
        frontIndex = i;
        break;
      }
    }
    if (frontIndex !== -1) currentDeviceIndex = frontIndex;
    startCamera(devices[currentDeviceIndex].deviceId);

    var btn = createButton('Switch Cam');
    btn.position(20, height - 40);
    btn.style('font-family', 'monospace');
    btn.style('font-weight', 'bold');
    btn.style('color', '#aaa');
    btn.style('background', '#111');
    btn.style('border', '1px solid #333');
    btn.mousePressed(function() {
      currentDeviceIndex = (currentDeviceIndex + 1) % devices.length;
      startCamera(devices[currentDeviceIndex].deviceId);
    });
  }
}

function startCamera(id) {
  if (video) video.remove();
  video = createCapture({
    video: { deviceId: { exact: id }, width: 320, height: 240 },
    audio: false
  });
  video.size(320, 240);
  video.elt.setAttribute('playsinline', '');
  video.hide();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cx = round(width / 2);
  cy = round(height / 2);
}
