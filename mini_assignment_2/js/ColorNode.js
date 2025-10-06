class ColorNode {
  constructor(x, y, r, c) {
    this.pos = createVector(x, y);
    this.radius = r;
    this.c = c; // p5.Color object

    colorMode(HSB, 255);
    this.hue = hue(c);
    this.sat = saturation(c);
    this.bri = brightness(c);

    this.edges = [];
    // editing state
    this.isEditing = false;
    // tmp storage for mousePressed -> mouseReleased ring hit
    this._lastRingHit = null;
  }

  draw() {
    colorMode(HSB, 255);
    ellipseMode(CENTER);
    if (this.isEditing) {
      // draw slightly larger node to indicate editing mode
      let editRadius = this.radius * 1.2;
      fill(this.hue, this.sat, this.bri);
      ellipse(this.pos.x, this.pos.y, editRadius * 2, editRadius * 2);

  //---------------------------Editing Mode------------------------------------
  // draw main hue ring using fixed spacing --- gaps don't change with node size
  let offsetBase = 8;
  let offsetScale = 3.5; // used to derive a fixed spacing in pixels
  // fixed spacing between elements (in pixels)
  let S = offsetBase * offsetScale; // e.g. 8 * 3.5 = 28px
  // increase thickness by ~3.5x
  let thickness = Math.round(14 * 3.5);
  // quarter ring and main ring thickness same
  let quarterThickness = thickness;
  let quarterCenterRadius = editRadius + S + quarterThickness / 2;
  let ringRadius = quarterCenterRadius + quarterThickness / 2 + S + thickness / 2;
      noFill();
      strokeWeight(thickness);
      let steps = 180;
      for (let i = 0; i < steps; i++) {
        let a1 = map(i, 0, steps, 0, TWO_PI);
        let a2 = map(i + 1, 0, steps, 0, TWO_PI);
        let mid = (a1 + a2) / 2;
        let h = int(map(mid, 0, TWO_PI, 0, 255));
        stroke(h, 255, 255);
        let x1 = this.pos.x + cos(a1) * ringRadius;
        let y1 = this.pos.y + sin(a1) * ringRadius;
        let x2 = this.pos.x + cos(a2) * ringRadius;
        let y2 = this.pos.y + sin(a2) * ringRadius;
        line(x1, y1, x2, y2);
      }

  // quarter rings: top-left (analogous) and bottom-right (complementary)
  // quarterCenterRadius already computed above so gaps are constant
      let span = PI / 2;
      let stepsQ = 40;
      // top-left analogous: hue range around current hue
      let tlStart = (this.hue - 15 + 255) % 255;
      let tlEnd = (this.hue + 15) % 255;
      strokeWeight(quarterThickness);
      for (let i = 0; i < stepsQ; i++) {
        let a1 = -3 * PI / 4 - span/2 + (i / stepsQ) * span;
        let a2 = -3 * PI / 4 - span/2 + ((i+1) / stepsQ) * span;
        let t = i / (stepsQ - 1);
        let delta = (tlEnd - tlStart + 255) % 255;
        let h = (tlStart + delta * t) % 255;
        // use node's current saturation & brightness so quarter rings follow node color
        stroke(h, this.sat, this.bri);
        let x1 = this.pos.x + cos(a1) * quarterCenterRadius;
        let y1 = this.pos.y + sin(a1) * quarterCenterRadius;
        let x2 = this.pos.x + cos(a2) * quarterCenterRadius;
        let y2 = this.pos.y + sin(a2) * quarterCenterRadius;
        line(x1, y1, x2, y2);
      }

      // bottom-right complementary
      let comp = (this.hue + 128) % 255;
      let brStart = comp;
      let brEnd = (comp + 15) % 255;
      for (let i = 0; i < stepsQ; i++) {
        let a1 = PI / 4 - span/2 + (i / stepsQ) * span;
        let a2 = PI / 4 - span/2 + ((i+1) / stepsQ) * span;
        let t = i / (stepsQ - 1);
        let delta = (brEnd - brStart + 255) % 255;
        let h = (brStart + delta * t) % 255;
        // use node's current saturation & brightness
        stroke(h, this.sat, this.bri);
        let x1 = this.pos.x + cos(a1) * quarterCenterRadius;
        let y1 = this.pos.y + sin(a1) * quarterCenterRadius;
        let x2 = this.pos.x + cos(a2) * quarterCenterRadius;
        let y2 = this.pos.y + sin(a2) * quarterCenterRadius;
        line(x1, y1, x2, y2);
      }

      // outer 2/5 arcs: Brightness and Saturation
      // place them outside the main ring with same spacing S and thickness
      let outerSpan = TWO_PI * (2/5); // 2/5 of a full circle
      // compute outer center radius (gap s)
      let outerCenterRadius = ringRadius + S + thickness; // ringRadius + S + thickness
      let stepsO = 120;

      // Brightness arc (top-right): one end black, one end white
      let brightCenter = -PI / 4; // -45deg (top-right)
      let cBlack = color(0, 0, 0);
      let cWhite = color(0, 0, 255);
      strokeWeight(thickness);
      for (let i = 0; i < stepsO; i++) {
        let a1 = brightCenter - outerSpan/2 + (i / stepsO) * outerSpan;
        let a2 = brightCenter - outerSpan/2 + ((i+1) / stepsO) * outerSpan;
        let t = i / (stepsO - 1);
        let col = lerpColor(cBlack, cWhite, t);
        stroke(col);
        let x1 = this.pos.x + cos(a1) * outerCenterRadius;
        let y1 = this.pos.y + sin(a1) * outerCenterRadius;
        let x2 = this.pos.x + cos(a2) * outerCenterRadius;
        let y2 = this.pos.y + sin(a2) * outerCenterRadius;
        line(x1, y1, x2, y2);
      }

      // Saturation arc (bottom-left): one end black, one end node's brightest color
      let satCenter = 3 * PI / 4; // 135deg (bottom-left)
      let satBlack = color(0, 0, 0);
      let satColor = color(this.hue, 255, this.bri); // max saturation, same brightness
      for (let i = 0; i < stepsO; i++) {
        let a1 = satCenter - outerSpan/2 + (i / stepsO) * outerSpan;
        let a2 = satCenter - outerSpan/2 + ((i+1) / stepsO) * outerSpan;
        let t = i / (stepsO - 1);
        let col = lerpColor(satBlack, satColor, t);
        stroke(col);
        let x1 = this.pos.x + cos(a1) * outerCenterRadius;
        let y1 = this.pos.y + sin(a1) * outerCenterRadius;
        let x2 = this.pos.x + cos(a2) * outerCenterRadius;
        let y2 = this.pos.y + sin(a2) * outerCenterRadius;
        line(x1, y1, x2, y2);
      }
    } else {
      fill(this.hue, this.sat, this.bri);
      ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
    }
  }

  // Return info if point (x,y) hits the full ring or quarter rings.
  // Returns null or { type: 'full'|'analog'|'comp', hue, angle }
  getRingHitInfo(x, y) {
    if (!this.isEditing) return null;
    let editRadius = this.radius * 1.2;
  let offsetBase = 8;
  let offsetScale = 3.5;
  let S = offsetBase * offsetScale;
  let thickness = Math.round(14 * 3.5);
  let quarterThickness = thickness;
  let quarterCenterRadius = editRadius + S + quarterThickness / 2;
  let ringRadius = quarterCenterRadius + quarterThickness / 2 + S + thickness / 2;
    let d = dist(x, y, this.pos.x, this.pos.y);
    // full ring
    if (d >= (ringRadius - thickness/2) && d <= (ringRadius + thickness/2)) {
      let angle = atan2(y - this.pos.y, x - this.pos.x);
      if (angle < 0) angle += TWO_PI;
      let h = int(map(angle, 0, TWO_PI, 0, 255));
      return { type: 'full', hue: h, angle: angle };
    }

    // quarter rings (quarterCenterRadius and quarterThickness already computed above)
    let span = PI/2;
    let ang = atan2(y - this.pos.y, x - this.pos.x);
    let angN = ang < 0 ? ang + TWO_PI : ang;
    let radialDist = dist(x, y, this.pos.x, this.pos.y);

    const norm = (a) => { let v = a % TWO_PI; if (v < 0) v += TWO_PI; return v; };
    const angleInSpan = (a, center, span) => {
      let aN = norm(a); let cN = norm(center);
      let start = norm(cN - span/2) - 0.0001;
      let end = norm(cN + span/2) + 0.0001;
      if (start <= end) return aN >= start && aN <= end;
      return aN >= start || aN <= end;
    };

    // top-left analogous
    let tlCenter = -3 * PI / 4;
    if (abs(radialDist - quarterCenterRadius) <= (quarterThickness/2 + 1)) {
      if (angleInSpan(ang, tlCenter, span)) {
        let startAngle = norm(tlCenter - span/2);
        let rel = (startAngle <= angN) ? (angN - startAngle) : (TWO_PI - startAngle + angN);
        let t = constrain(rel / span, 0, 1);
        let startHue = (this.hue - 15 + 255) % 255;
        let endHue = (this.hue + 15) % 255;
        let delta = (endHue - startHue + 255) % 255;
        let h = (startHue + delta * t) % 255;
        return { type: 'analog', hue: int(h), angle: ang };
      }
    }

    // bottom-right complementary
    let brCenter = PI / 4;
    if (abs(radialDist - quarterCenterRadius) <= (quarterThickness/2 + 1)) {
      if (angleInSpan(ang, brCenter, span)) {
        let startAngle = norm(brCenter - span/2);
        let rel = (startAngle <= angN) ? (angN - startAngle) : (TWO_PI - startAngle + angN);
        let t = constrain(rel / span, 0, 1);
        let comp = (this.hue + 128) % 255;
        let startHue = comp;
        let endHue = (comp + 15) % 255;
        let delta = (endHue - startHue + 255) % 255;
        let h = (startHue + delta * t) % 255;
        return { type: 'comp', hue: int(h), angle: ang };
      }
    }

  // outer arcs hit testing (brightness and saturation)
  // outer center radius same as used in draw() (S already defined above)
  let outerCenterRadius = ringRadius + S + thickness; // must match draw
    let outerThickness = thickness;
    let outerSpan = TWO_PI * (2/5);

    // brightness arc center (-PI/4)
    let brightCenter = -PI / 4;
    if (abs(radialDist - outerCenterRadius) <= (outerThickness/2 + 2)) {
      if (angleInSpan(ang, brightCenter, outerSpan)) {
        // map angle along arc to 0..1
        let startAngle = norm(brightCenter - outerSpan/2);
        let rel = (startAngle <= angN) ? (angN - startAngle) : (TWO_PI - startAngle + angN);
        let t = constrain(rel / outerSpan, 0, 1);
        // brightness from 0 (black) to 255 (white)
        let briVal = int(lerp(0, 255, t));
        return { type: 'brightness', value: briVal, angle: ang };
      }
    }

    // saturation arc center (3*PI/4)
    let satCenter = 3 * PI / 4;
    if (abs(radialDist - outerCenterRadius) <= (outerThickness/2 + 2)) {
      if (angleInSpan(ang, satCenter, outerSpan)) {
        let startAngle = norm(satCenter - outerSpan/2);
        let rel = (startAngle <= angN) ? (angN - startAngle) : (TWO_PI - startAngle + angN);
        let t = constrain(rel / outerSpan, 0, 1);
        // saturation from 0 (black) to 255 (node's max sat)
        let satVal = int(lerp(0, 255, t));
        return { type: 'saturation', value: satVal, angle: ang };
      }
    }

    return null;
  }

  setBrightness(b) {
    this.bri = constrain(b, 0, 255);
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  setSaturation(s) {
    this.sat = constrain(s, 0, 255);
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  setHue(h) {
    this.hue = ((h % 255) + 255) % 255;
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  hitTest(x, y) {
    return sq(x - this.pos.x) + sq(y - this.pos.y) < sq(this.radius);
  }

  move(d) {
    this.pos.add(d);
    this.updateEdges();
  }

  changeHue(x, y) {
    let v1 = createVector(x, y);
    let d = int(map(this.pos.dist(v1), 0, this.radius, 0, 255));
    this.hue = d;
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  changeBright(x, y) {
    let v1 = createVector(x, y);
    let d = int(map(this.pos.dist(v1), 0, this.radius, 0, 255));
    this.bri = d;
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  changeSaturation(x, y) {
    let v1 = createVector(x, y);
    let d = int(map(this.pos.dist(v1), 0, this.radius, 0, 255));
    this.sat = d;
    colorMode(HSB, 255);
    this.c = color(this.hue, this.sat, this.bri);
    this.updateEdgesColor();
  }

  changeRadius(x, y) {
    let v1 = createVector(x, y);
    this.radius = this.pos.dist(v1);
    this.updateEdges();
  }

  updateEdgesColor() {
    for (let edge of this.edges) {
      if (edge.startNode === this)
        edge.setStartColor(this.c);
      else if (edge.endNode === this)
        edge.setEndColor(this.c);
    }
  }

  updateEdges() {
    for (let edge of this.edges) {
      if (edge.startNode === this || edge.endNode === this) {
        edge.calculateRect();
      }
    }
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  removeEdge(edge) {
    let index = this.edges.indexOf(edge);
    if (index >= 0) this.edges.splice(index, 1);
  }

  hasEdgeWith(node) {
    for (let edge of this.edges) {
      if (edge.endNode === node || edge.startNode === node)
        return true;
    }
    return false;
  }

  removeAllEdges() {
    this.edges = [];
  }
}