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
  }

  draw() {
    colorMode(HSB, 255);
    fill(this.hue, this.sat, this.bri);
    ellipseMode(CENTER);
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
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
    console.log('updating edges for node at', this.pos.x, this.pos.y, this.edges.length);
    for (let edge of this.edges) {
      if (edge.startNode === this || edge.endNode === this)
        edge.calculateRect();
        console.log('  updated edge to', edge.endNode ? edge.endNode.pos.x + ',' + edge.endNode.pos.y : 'null');
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