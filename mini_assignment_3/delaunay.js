let img;
let input;
let pointInput;
let triangles = [];

function setup() {
  createCanvas(800, 600);
  noLoop();

  input = createFileInput(handleFile);
  input.position(10, 10);

  pointInput = createInput("300");

}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      resizeCanvas(img.width, img.height);
      generateDelaunay();
      redraw();
    });
  }
}

function draw() {
  background(220);
  if (!img || triangles.length === 0) return;

  noStroke();
  for (let t of triangles) {
    fill(t.col);
    triangle(t.a[0], t.a[1], t.b[0], t.b[1], t.c[0], t.c[1]);
  }
}

function generateDelaunay() {
  triangles = [];

  const pts = [];
  const n = int(pointInput.value()) || 300;
  for (let i = 0; i < n; i++) {
    pts.push([random(width), random(height)]);
  }
  pts.push([0,0],[width,0],[0,height],[width,height]);
  
  const d = Delaunator.from(pts);
  for (let i = 0; i < d.triangles.length; i += 3) {
    let a = pts[d.triangles[i]];
    let b = pts[d.triangles[i + 1]];
    let c = pts[d.triangles[i + 2]];
    let cx = (a[0] + b[0] + c[0]) / 3;
    let cy = (a[1] + b[1] + c[1]) / 3;
    let col = img.get(cx, cy);
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
