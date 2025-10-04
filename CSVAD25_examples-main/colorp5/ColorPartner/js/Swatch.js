class Swatch {
  constructor(x, y, r, h, s, b) {
    this.position = createVector(x, y);
    this.rad = r;
    this.hue = h;
    this.sat = s;
    this.bri = b;
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
    this.hue += delta.y;
    this.sat += delta.x;
    this.bri += mouseWheel;
  }

  draw() {
    colorMode(RGB, 255);
    if (this.selected) {
      strokeWeight(2);
      stroke(255);
    } else {
      noStroke();
    }

    colorMode(HSB, 100);
    fill(this.hue, this.sat, this.bri);
    ellipseMode(CENTER);
    ellipse(this.position.x, this.position.y, this.rad, this.rad);

    if (!this.locked) {
      this.rad -= 0.015;
    }
  }
}