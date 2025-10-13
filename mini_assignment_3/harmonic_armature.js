let img;
let input;
let showArmature = true;
let lines = [];
let margin = 0;
let clickThreshold = 8; // how close (in pixels) a click must be to select a line

function setup() {
  createCanvas(800, 600);
  imageMode(CORNER);
  noLoop();

  // File input for uploading an image
  input = createFileInput(handleFile);
  input.position(10, 10);
}

function draw() {
  background(240);

  if (img) {
    // Fit image to canvas
    let aspect = img.width / img.height;
    let w = width;
    let h = width / aspect;
    if (h > height) {
      h = height;
      w = height * aspect;
    }

    let x = (width - w) / 2;
    let y = (height - h) / 2;

    image(img, x, y, w, h);

    if (showArmature) {
      if (lines.length === 0) generateArmatureLines(x, y, w, h);
      drawHarmonicArmature();
    }
  } else {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Upload an image to overlay 14-line harmonic armature", width / 2, height / 2);
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      resizeCanvas(img.width, img.height);
      lines = [];
      redraw();
    });
  }
}

function keyPressed() {
  // Toggle armature visibility
  showArmature = !showArmature;
  redraw();
}

function mousePressed() {
  // Check if click is close to any line
  for (let l of lines) {
    let d = distToSegment(createVector(mouseX, mouseY), l.a, l.b);
    if (d < clickThreshold) {
      l.highlighted = !l.highlighted;
      break;
    }
  }
  redraw();
}

function generateArmatureLines(x, y, w, h) {
  lines = [];

  const cx = x + w / 2;
  const cy = y + h / 2;

  const topMid = createVector(x + w / 2, y);
  const bottomMid = createVector(x + w / 2, y + h);
  const leftMid = createVector(x, y + h / 2);
  const rightMid = createVector(x + w, y + h / 2);

  // Helper to push a line
  const addLine = (x1, y1, x2, y2) => {
    lines.push({
      a: createVector(x1, y1),
      b: createVector(x2, y2),
      highlighted: false
    });
  };

  // 2 main diagonals
  addLine(x, y, x + w, y + h);
  addLine(x + w, y, x, y + h);

  // Center cross
  addLine(cx, y, cx, y + h);
  addLine(x, cy, x + w, cy);

  // 8 reciprocals (corner → opposite side midpoints)
  addLine(x, y, rightMid.x, rightMid.y);
  addLine(x, y, bottomMid.x, bottomMid.y);

  addLine(x + w, y, leftMid.x, leftMid.y);
  addLine(x + w, y, bottomMid.x, bottomMid.y);

  addLine(x, y + h, rightMid.x, rightMid.y);
  addLine(x, y + h, topMid.x, topMid.y);

  addLine(x + w, y + h, leftMid.x, leftMid.y);
  addLine(x + w, y + h, topMid.x, topMid.y);
}

function drawHarmonicArmature() {
  push();
  noFill();

  // Draw all lines
  for (let l of lines) {
    if (l.highlighted) {
      stroke(60, 200, 255);
      strokeWeight(3);
    } else {
      stroke(255, 0, 0, 180);
      strokeWeight(1);
    }
    line(l.a.x, l.a.y, l.b.x, l.b.y);
  }

  // Outer border
  stroke(255, 0, 0, 150);
  strokeWeight(1);
  rect(lines[0].a.x, lines[0].a.y, lines[1].a.x - lines[0].a.x, lines[1].b.y - lines[0].a.y);

  pop();
}

// Compute shortest distance from point p to segment ab
function distToSegment(p, a, b) {
  const ab = p5.Vector.sub(b, a);
  const ap = p5.Vector.sub(p, a);
  const t = constrain(ap.dot(ab) / ab.magSq(), 0, 1);
  const closest = p5.Vector.add(a, p5.Vector.mult(ab, t));
  return p.dist(closest);
}
