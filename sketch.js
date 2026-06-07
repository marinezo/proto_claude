var video;

// Wave / line visuals
var NUM_LAYERS = 5;
var layers = [];
var history = [];        // recorded peak amplitude per frame, scrolls across screen
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
var screenFlash = 0;
var bpm = 0;
var bpmHistory = [];
var lastPulseMs = 0;
var manualPulse = false;

// Camera
var facingMode = 'environment';
var camOn = true;

var hueShift = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);

  MAX_HISTORY = floor(width / 4);
  for (var i = 0; i < MAX_HISTORY; i++) history.push(0);

  for (var i = 0; i < NUM_LAYERS; i++) {
    layers.push({
      hue:    (i * 360 / NUM_LAYERS),
      speed:  random(0.015, 0.05),
      freq:   random(0.006, 0.018),
      phase:  random(TWO_PI),
      ampMul: map(i, 0, NUM_LAYERS - 1, 0.5, 1.3),
      yOff:   map(i, 0, NUM_LAYERS - 1, -1, 1) * (height * 0.06),
      weight: random(2, 5)
    });
  }

  startCamera();
  setupButtons();
}

function draw() {
  background(0, 0, 6);

  var now = millis();

  var rawSignal = getPulseStrength();
  var boostedSignal = rawSignal * 4;
  var isPulse = manualPulse || (boostedSignal > beatThreshold && now - lastBeatTime > 300);
  manualPulse = false;
  if (isPulse) {
    lastBeatTime = now;
    indicatorFill = 1;
    pulseFlash  = 1.0;
    screenFlash = 1.0;
    peakBoost = 1.0;
  }

  pulseFlash    = max(0, pulseFlash    - 0.035);
  screenFlash   = max(0, screenFlash   - 0.07);
  indicatorFill = max(0, indicatorFill - 0.03);
  peakBoost     = max(0, peakBoost     - 0.045);

  hueShift = (hueShift + 0.6) % 360;

  // record current peak amplitude and scroll history rightward
  history.push(baseAmp * (1 + peakBoost * 2.2));
  if (history.length > MAX_HISTORY) history.shift();

  drawTrippyWaves(now);

  if (screenFlash > 0) {
    blendMode(ADD);
    var sf = screenFlash;
    var flash = drawingContext.createRadialGradient(width/2, height/2, 0, width/2, height/2, max(width, height) * 0.7);
    flash.addColorStop(0,    'hsla(' + hueShift + ', 100%, 70%, ' + (sf * 0.35).toFixed(3) + ')');
    flash.addColorStop(0.4,  'hsla(' + ((hueShift + 120) % 360) + ', 100%, 60%, ' + (sf * 0.22).toFixed(3) + ')');
    flash.addColorStop(0.75, 'hsla(' + ((hueShift + 240) % 360) + ', 100%, 50%, ' + (sf * 0.10).toFixed(3) + ')');
    flash.addColorStop(1,    'rgba(0,0,0,0)');
    drawingContext.fillStyle = flash;
    drawingContext.fillRect(0, 0, width, height);
    blendMode(BLEND);
  }

  var heartX = 36;
  var heartY = height - 36;
  drawPixelHeart(heartX, heartY, 10);

  fill(0, 0, 100);
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
    fill(350, 80, 100, 65);
    ellipse(indX, indY, 28, 28);
    fill(350, 80, 100, 95);
    ellipse(indX, indY, 12, 12);
  } else {
    stroke(0, 0, 35);
    strokeWeight(1);
    noFill();
    ellipse(indX, indY, 18, 18);
  }

  noStroke();
  fill(0, 0, 45);
  textSize(10);
  textFont('monospace');
  textAlign(CENTER, BOTTOM);
  text('TAP to pulse', width / 2, height - 16);
}

function drawTrippyWaves(now) {
  var midY = height / 2;
  var f = 1.0 + pulseFlash * 0.25;

  blendMode(ADD);
  noFill();

  for (var L = 0; L < layers.length; L++) {
    var lay = layers[L];
    var hue = (lay.hue + hueShift) % 360;

    for (var pass = 0; pass < 2; pass++) {
      var weight = lay.weight + (pass === 0 ? 0 : 0);
      strokeWeight(weight - pass * 1.5);
      var alpha = (pass === 0 ? 28 : 70) * f;
      stroke(hue, 75, 100, alpha);

      beginShape();
      for (var x = 0; x <= width; x += 6) {
        var hi = floor(map(x, 0, width, 0, history.length - 1));
        hi = constrain(hi, 0, history.length - 1);
        var amp = history[hi] * lay.ampMul;

        var wob = sin(x * lay.freq + now * lay.speed + lay.phase) * amp;
        wob += sin(x * lay.freq * 2.3 - now * lay.speed * 1.7 + lay.phase * 1.5) * amp * 0.35;

        var y = midY + lay.yOff + wob;
        vertex(x, y);
      }
      endShape();
    }
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
  fill(345, 80, 85);
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

  var toggleBtn = createButton('📷 Cam ON');
  toggleBtn.position(20, height - 80);
  btnStyle(toggleBtn);
  toggleBtn.style('color', '#5f5');
  toggleBtn.mousePressed(function() {
    camOn = !camOn;
    if (!camOn) {
      if (video) { video.stop(); video.hide(); }
      toggleBtn.html('📷 Cam OFF');
      toggleBtn.style('color', '#f55');
    } else {
      startCamera();
      toggleBtn.html('📷 Cam ON');
      toggleBtn.style('color', '#5f5');
    }
  });

  var switchBtn = createButton('⟳ Rear Cam');
  switchBtn.position(20, height - 40);
  btnStyle(switchBtn);
  switchBtn.style('color', '#aaa');
  switchBtn.mousePressed(function() {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    startCamera();
    switchBtn.html('⟳ ' + (facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'));
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  MAX_HISTORY = floor(width / 4);
  while (history.length < MAX_HISTORY) history.unshift(0);
  while (history.length > MAX_HISTORY) history.shift();
}
