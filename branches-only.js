/* PROJECT: Sakura_Crisp_Fixed_Spin — branches-only variant
   Just the branch skeleton: no flowers, petals, heart, or pulse system.
*/

var WATCH_R = 200;

var branches = [];   // BranchSegment objects
var cx, cy;

// ── BRANCH SEGMENT ───────────────────────────────────────────
function BranchSegment(startV, endV, thStart, thEnd) {
  this.start = startV;
  this.end = endV;
  this.thStart = thStart;
  this.thEnd = thEnd;
}

BranchSegment.prototype.display = function() {
  fill(255);
  stroke(0);
  strokeWeight(1);

  var dir = p5.Vector.sub(this.end, this.start);
  var perp = createVector(-dir.y, dir.x);
  perp.normalize();

  var p1 = p5.Vector.add(this.start, p5.Vector.mult(perp, this.thStart / 2));
  var p2 = p5.Vector.add(this.start, p5.Vector.mult(perp, -this.thStart / 2));
  var p3 = p5.Vector.add(this.end, p5.Vector.mult(perp, -this.thEnd / 2));
  var p4 = p5.Vector.add(this.end, p5.Vector.mult(perp, this.thEnd / 2));

  beginShape();
  vertex(p1.x, p1.y);
  vertex(p2.x, p2.y);
  vertex(p3.x, p3.y);
  vertex(p4.x, p4.y);
  endShape(CLOSE);
};

// ── BRANCH GENERATION ─────────────────────────────────────────────
function generateBranch(startV, targetV, thickness, depth) {
  var dir = p5.Vector.sub(targetV, startV);
  var len = dir.mag();

  if (len > 100) {
    dir.setMag(random(60, 100));
    len = dir.mag();
  }

  var endV = p5.Vector.add(startV, dir);

  var branchObj = new BranchSegment(startV, endV, thickness, thickness * 0.8);
  branches.push(branchObj);

  // exit
  if (thickness < 2 || depth > 5) {
    return;
  }

  // recurse
  var numChildren = floor(random(1, 3));
  for (var i = 0; i < numChildren; i++) {
    var angle = dir.heading() + random(-0.5, 0.5);
    var newLen = len * random(0.7, 0.95);
    var newEnd = createVector(
      endV.x + cos(angle) * newLen,
      endV.y + sin(angle) * newLen
    );

    generateBranch(endV, newEnd, thickness * 0.7, depth + 1);
  }
}

// ── SETUP ───────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(window.devicePixelRatio);

  cx = round(width / 2);
  cy = round(height / 2);

  // Branch 1
  generateBranch(
    createVector(-WATCH_R * 1.2, WATCH_R * 0.7),
    createVector(WATCH_R * 0.3, -WATCH_R * 0.5),
    22,
    0
  );

  // Branch 2
  generateBranch(
    createVector(WATCH_R * 1.1, -WATCH_R * 0.3),
    createVector(-50, -100),
    20,
    0
  );

  // Branch 3
  generateBranch(
    createVector(-WATCH_R * 0.8, -WATCH_R * 1.0),
    createVector(20, 50),
    18,
    0
  );
}

// ── DRAW ────────────────────────────────────────────────────────
function draw() {
  background(255);

  translate(cx, cy);

  // ── WATCH CIRCLE ──────────────────────────────────────────
  noFill();
  stroke(0);
  strokeWeight(1);
  ellipse(0, 0, WATCH_R * 2, WATCH_R * 2);

  // clip
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(0, 0, WATCH_R - 1, 0, TWO_PI);
  drawingContext.clip();

  // ── BRANCHES ──────────────────────────────────────────────
  for (var i = 0; i < branches.length; i++) {
    branches[i].display();
  }

  drawingContext.restore();

  translate(-cx, -cy);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cx = round(width / 2);
  cy = round(height / 2);
}
