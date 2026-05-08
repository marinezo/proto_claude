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

// Two-color palette: electric blue / crimson red
// White appears only as the specular highlight inside each gradient
var PALETTE = [
  'blue',
  'red',
];

// Pulse
var readings = [];
var maxReadings = 20;
var lastBeatTime = 0;
var beatThreshold = 1.5;
var indicatorFill = 0;
var pulseFlash = 0;   // 1.0 on beat, decays to 0
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
    var numVerts = floor(random(10, 15));
    var offsets = [];
    for (var v = 0; v < numVerts; v++) {
      offsets.push(random(0.95, 1.05));
    }
    pebbles.push({
      x: cx + cos(ang) * dist_from_center,
      y: cy + sin(ang) * dist_from_center - WATCH_R * 0.3,
      vx: random(-0.5, 0.5),
      vy: random(0, 1),
      r: r,
      verts: numVerts,
      offsets: offsets,
      colorIdx: floor(random(2))   // 0 = blue, 1 = red
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
    pulseFlash = 1.0;
  }

  pulseFlash    = max(0, pulseFlash    - 0.035);
  indicatorFill = max(0, indicatorFill - 0.03);

  // ── PHYSICS ───────────────────────────────────────────────
  physicsTick(isPulse);

  // ── CLIP TO WATCH CIRCLE ──────────────────────────────────
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(cx, cy, WATCH_R - 1, 0, Math.PI * 2);
  drawingContext.clip();

  // ── AMBIENT PULSE BLOOM ───────────────────────────────────
  if (pulseFlash > 0) {
    var a1 = (pulseFlash * 0.18).toFixed(3);
    var a2 = (pulseFlash * 0.07).toFixed(3);
    var bloom = drawingContext.createRadialGradient(cx, cy, 0, cx, cy, WATCH_R);
    bloom.addColorStop(0,    'rgba(255, 80, 80, '   + a1 + ')');
    bloom.addColorStop(0.45, 'rgba(0, 100, 255, '   + a2 + ')');
    bloom.addColorStop(1,    'rgba(0, 0, 0, 0)');
    drawingContext.fillStyle = bloom;
    drawingContext.beginPath();
    drawingContext.arc(cx, cy, WATCH_R, 0, Math.PI * 2);
    drawingContext.fill();
  }

  // ── PEBBLES — 3D radial gradient, no halos ────────────────
  // Each drop is a single gradient blob: white specular highlight
  // offset to top-left → saturated color → deep shadow → transparent edge.
  // ADD blending means blue+red overlaps bloom toward white.
  blendMode(ADD);
  drawingContext.globalCompositeOperation = 'lighter';

  for (var i = 0; i < pebbles.length; i++) {
    var p = pebbles[i];
    var f  = 1.0 + pulseFlash * 0.9;   // brightness multiplier on beat

    // Highlight origin: offset toward top-left for 3D sphere illusion
    var hx = p.x - p.r * 0.33;
    var hy = p.y - p.r * 0.33;
    var grad = drawingContext.createRadialGradient(
      hx, hy, p.r * 0.05,   // inner — tight highlight
      p.x, p.y, p.r * 1.12  // outer — slightly beyond blob edge (soft blur)
    );

    if (p.colorIdx === 0) {
      // Electric blue
      var s = ~~min(255, 180 * f);
      grad.addColorStop(0,    'rgba(210, 235, 255, 1)');
      grad.addColorStop(0.25, 'rgba(0, ' + s + ', 255, 1)');
      grad.addColorStop(0.72, 'rgba(0, 22, 70, 1)');
      grad.addColorStop(1,    'rgba(0, 0, 0, 0)');
    } else {
      // Crimson red
      var s = ~~min(255, 220 * f);
      grad.addColorStop(0,    'rgba(255, 220, 220, 1)');
      grad.addColorStop(0.25, 'rgba(' + s + ', 35, 60, 1)');
      grad.addColorStop(0.72, 'rgba(65, 0, 10, 1)');
      grad.addColorStop(1,    'rgba(0, 0, 0, 0)');
    }

    // Build smooth blob path via quadratic curves through vertex midpoints
    var vx = [], vy = [];
    for (var v = 0; v < p.verts; v++) {
      var a = TWO_PI * v / p.verts;
      var rr = p.r * p.offsets[v];
      vx.push(p.x + cos(a) * rr);
      vy.push(p.y + sin(a) * rr);
    }
    var n = p.verts;
    drawingContext.beginPath();
    drawingContext.moveTo((vx[n-1] + vx[0]) / 2, (vy[n-1] + vy[0]) / 2);
    for (var v = 0; v < n; v++) {
      var nv = (v + 1) % n;
      drawingContext.quadraticCurveTo(
        vx[v], vy[v],
        (vx[v] + vx[nv]) / 2, (vy[v] + vy[nv]) / 2
      );
    }
    drawingContext.closePath();
    drawingContext.fillStyle = grad;
    drawingContext.fill();
  }

  blendMode(BLEND);

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
