class Swatch {
  constructor(x, y, r, l, a, b) {
    this.position = createVector(x, y);
    this.rad = r;
    this.l = l; // CIE L* (lightness): 0-100
    this.a = a; // CIE a* (green-red): typically -128 to +127
    this.b = b; // CIE b* (blue-yellow): typically -128 to +127
    this.selected = false;
    this.locked = false;
    this.order = undefined; // Not used in constructor, but included for parity
  }

  hitTest(x, y) {
    return sq(x - this.position.x) + sq(y - this.position.y) < sq(this.rad);
  }

  moveBy(delta) {
    this.position.add(delta);
  }

  updateColor(delta, mouseWheel) {
    this.a += delta.x * 0.5; // Scale mouse movement for a* channel
    this.b += delta.y * 0.5; // Scale mouse movement for b* channel
    this.l += mouseWheel * 2; // Scale mouse wheel for lightness
    
    // Constrain LAB values to reasonable ranges
    this.l = constrain(this.l, 0, 100);
    this.a = constrain(this.a, -128, 127);
    this.b = constrain(this.b, -128, 127);
  }

  draw() {
    colorMode(RGB, 255);
    if (this.selected) {
      strokeWeight(2);
      stroke(255);
    } else {
      noStroke();
    }

    // Convert LAB to RGB for display
    let rgb = labToRgb(this.l, this.a, this.b);
    fill(rgb.r, rgb.g, rgb.b);
    ellipseMode(CENTER);
    ellipse(this.position.x, this.position.y, this.rad, this.rad);

    if (!this.locked) {
      this.rad -= 0.015;
    }
  }
}