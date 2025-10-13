// Combined sketch: harmonic armature + saliency + Delaunay
// Try to import images that are not too large (e.g. <1000x1000)


let img;
let fileInput;
let triangles = [];
const DEFAULT_POINTS = 300;

// Harmonic armature
let lines = [];
let clickThreshold = 8;

// Saliency
let saliencyMap;

// UI
let ui = {
  padding: 10,
  buttons: [],
  domButtons: []
};

let imageX = 10;
let imageY = 50; // leave room for file input

function setup() {
  createCanvas(1200, 800);
  pixelDensity(1);
  noSmooth();
  noLoop();

  fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);

  ui.buttons = [
    { id: 'armature', label: 'Armature', active: false },
    { id: 'saliency', label: 'Saliency', active: false },
    { id: 'delaunay', label: 'Delaunay', active: false }
  ];

  // DOM buttons (hidden until image loaded)
  for (let i = 0; i < ui.buttons.length; i++) {
    const b = ui.buttons[i];
    const btn = createButton(b.label);
    btn.position(-9999, -9999);
    btn.style('margin', '4px');
    btn.mousePressed(() => {
      ui.buttons[i].active = !ui.buttons[i].active;
      updateDomButtonStyle(btn, ui.buttons[i].active);
      // if saliency toggled, recompute saliency/delaunay
      if (ui.buttons[i].id === 'saliency') {
        if (ui.buttons[i].active && img) generateSaliencyMap();
        if (img) generateDelaunay();
      }
      // if delaunay toggled on, ensure triangles are generated with current saliency state
      if (ui.buttons[i].id === 'delaunay') {
        if (img) generateDelaunay();
      }
      redraw();
    });
    updateDomButtonStyle(btn, false);
    ui.domButtons.push(btn);
  }

  redraw();
}

function updateDomButtonStyle(btn, active) {
  if (active) btn.style('background-color', '#64c8ff');
  else btn.style('background-color', '');
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      saliencyMap = createImage(img.width, img.height);
      generateSaliencyMap();
      generateDelaunay();

      // clear armature lines so they regenerate positioned to image
      lines = [];

      // position DOM buttons to the right of the image
      const bx = imageX + img.width + 20; // space between image and buttons
      for (let i = 0; i < ui.domButtons.length; i++) {
        ui.domButtons[i].position(bx, imageY + i * 36);
      }

      redraw();
    });
  }
}

function draw() {
  background(240);

  if (img) {
    let x = imageX;
    let y = imageY;
    let w = img.width;
    let h = img.height;

    image(img, x, y, w, h);

    // Saliency overlay
    if (getButtonState('saliency')) {
      if (saliencyMap) image(saliencyMap, x, y, w, h);
    }

    // Delaunay overlay
    if (getButtonState('delaunay')) {
      push();
      noStroke();
      for (let t of triangles) {
        let ca = color(t.col[0], t.col[1], t.col[2], t.col[3] !== undefined ? t.col[3] : 255);
        fill(ca);
        triangle(x + t.a[0], y + t.a[1], x + t.b[0], y + t.b[1], x + t.c[0], y + t.c[1]);
      }
      pop();
    }

    // Armature overlay
    if (getButtonState('armature')) {
      if (lines.length === 0) generateArmatureLines(x, y, w, h);
      drawHarmonicArmature();
    }

  } else {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('Upload an image to use the combined sketch', width / 2, height / 2);
  }
}

function mousePressed() {
  // allow clicking lines when armature is active
  if (getButtonState('armature')) {
    for (let l of lines) {
      let d = distToSegment(createVector(mouseX, mouseY), l.a, l.b);
      if (d < clickThreshold) {
        l.highlighted = !l.highlighted;
        break;
      }
    }
    redraw();
  }
}

function getButtonState(id) {
  for (let b of ui.buttons) if (b.id === id) return b.active;
  return false;
}

// ------------------ Harmonic armature functions ------------------

function generateArmatureLines(x, y, w, h) {
  lines = [];

  const cx = x + w / 2;
  const cy = y + h / 2;

  const topMid = createVector(x + w / 2, y);
  const bottomMid = createVector(x + w / 2, y + h);
  const leftMid = createVector(x, y + h / 2);
  const rightMid = createVector(x + w, y + h / 2);

  const addLine = (x1, y1, x2, y2) => {
    lines.push({ a: createVector(x1, y1), b: createVector(x2, y2), highlighted: false });
  };

  addLine(x, y, x + w, y + h);
  addLine(x + w, y, x, y + h);

  addLine(cx, y, cx, y + h);
  addLine(x, cy, x + w, cy);

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

  // Outer border if lines exist
  if (lines.length >= 2) {
    stroke(255, 0, 0, 150);
    strokeWeight(1);
    rect(lines[0].a.x, lines[0].a.y, lines[1].a.x - lines[0].a.x, lines[1].b.y - lines[0].a.y);
  }

  pop();
}

function distToSegment(p, a, b) {
  const ab = p5.Vector.sub(b, a);
  const ap = p5.Vector.sub(p, a);
  const t = constrain(ap.dot(ab) / ab.magSq(), 0, 1);
  const closest = p5.Vector.add(a, p5.Vector.mult(ab, t));
  return p.dist(closest);
}

// ------------------ Saliency functions ------------------

function generateSaliencyMap() {
  if (!img) return;
  saliencyMap = createImage(img.width, img.height);

  img.loadPixels();
  saliencyMap.loadPixels();

  let blurredImg = img.get();
  blurredImg.filter(BLUR, 20);
  blurredImg.loadPixels();

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;

      let originalBrightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
      let blurredBrightness = (blurredImg.pixels[index] + blurredImg.pixels[index + 1] + blurredImg.pixels[index + 2]) / 3;

      let contrast = abs(originalBrightness - blurredBrightness) * 3;
      contrast = constrain(contrast, 0, 255);

      saliencyMap.pixels[index] = contrast;
      saliencyMap.pixels[index + 1] = contrast;
      saliencyMap.pixels[index + 2] = contrast;
      saliencyMap.pixels[index + 3] = 255;
    }
  }
  saliencyMap.updatePixels();
}

// ------------------ Delaunay functions ------------------

function generateDelaunay() {
  triangles = [];
  if (!img) return;

  // generate points in image coordinate space
  const pts = [];
  const n = DEFAULT_POINTS;
  for (let i = 0; i < n; i++) {
    pts.push([random(img.width), random(img.height)]);
  }
  pts.push([0,0],[img.width,0],[0,img.height],[img.width,img.height]);

  // naive embedded Delaunator-like algorithm from original Dalaunay.js
  const d = Delaunator.from(pts);
  for (let i = 0; i < d.triangles.length; i += 3) {
    let a = pts[d.triangles[i]];
    let b = pts[d.triangles[i + 1]];
    let c = pts[d.triangles[i + 2]];
    let cx = (a[0] + b[0] + c[0]) / 3;
    let cy = (a[1] + b[1] + c[1]) / 3;
    // if saliency is active, sample color from saliencyMap (grayscale) else use original image
    let col;
    if (getButtonState('saliency') && saliencyMap) {
      col = saliencyMap.get(floor(cx), floor(cy));
    } else {
      col = img.get(floor(cx), floor(cy));
    }
    triangles.push({ a, b, c, col });
  }
}

class Delaunator {
  static from(points) {
    const n = points.length;
    const triangles = [];
    for (let i = 0; i < n - 2; i++) {
      for (let j = i + 1; j < n - 1; j++) {
        for (let k = j + 1; k < n; k++) {
          const A = points[i], B = points[j], C = points[k];
          if (abs(cross(A,B,C)) < 1e-6) continue;
          const circle = circum(A,B,C);
          if (!circle) continue;
          let valid = true;
          for (let m = 0; m < n; m++) {
            if (m===i||m===j||m===k) continue;
            const P = points[m];
            if (distSq(P, [circle.x,circle.y]) <= circle.r*circle.r - 1e-6) {
              valid = false; break;
            }
          }
          if (valid) triangles.push(i,j,k);
        }
      }
    }
    return { triangles };
  }
}

function cross(a,b,c) {
  return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
}

function circum(a,b,c) {
  const ax=a[0], ay=a[1], bx=b[0], by=b[1], cx=c[0], cy=c[1];
  const d = 2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));
  if (abs(d) < 1e-12) return null;
  const ax2ay2=ax*ax+ay*ay, bx2by2=bx*bx+by*by, cx2cy2=cx*cx+cy*cy;
  const ux=(ax2ay2*(by-cy)+bx2by2*(cy-ay)+cx2cy2*(ay-by))/d;
  const uy=(ax2ay2*(cx-bx)+bx2by2*(ax-cx)+cx2cy2*(bx-ax))/d;
  const r = dist(ux,uy,ax,ay);
  return {x:ux, y:uy, r:r};
}

function distSq(p1,p2){ const dx=p1[0]-p2[0], dy=p1[1]-p2[1]; return dx*dx+dy*dy; }

