class GradientEdgeRect {
  // Primary constructor is private; use static methods for construction
  constructor({ 
    startLeft, startRight, endLeft, endRight, 
    startMid, endMid, startNode, endNode, 
    startColor, endColor, zIndex = -1 
  }) {
    this.startLeft = startLeft || null;
    this.startRight = startRight || null;
    this.endLeft = endLeft || null;
    this.endRight = endRight || null;
    this.startMid = startMid || null;
    this.endMid = endMid || null;
    this.startNode = startNode || null;
    this.endNode = endNode || null;
    this.startColor = startColor;
    this.endColor = endColor;
    this.zIndex = zIndex;
    this.selected = false;
  }

  // Pattern 1: Use rectangle corners and colors directly
  static fromCorners(sl, sr, el, er, sColor, eColor) {
    return new GradientEdgeRect({
      startLeft: sl.copy(), 
      startRight: sr.copy(), 
      endLeft: el.copy(), 
      endRight: er.copy(), 
      startColor: sColor, 
      endColor: eColor,
      zIndex: -1,
    });
  }

  // Pattern 2: Use ColorNodes, x/y, and index (like original Java)
  static fromNodes(sNode, eNode, x, y, index) {
    const startNode = sNode;
    const endNode = eNode ? eNode : sNode;
    const startMid = sNode.pos.copy();
    const endMid = eNode ? eNode.pos.copy() : createVector(x, y);
    let edge = new GradientEdgeRect({
      startMid,
      endMid,
      startNode,
      endNode,
      startColor: startNode.c,
      endColor: endNode.c,
      zIndex: index,
    });
    edge.calculateRect();
    return edge;
  }

  compareTo(edge) {
    return this.zIndex - edge.zIndex;
  }

  calculateRect() {
    // Always get current positions and colors from nodes to handle movement and color changes
    if (this.startNode) {
      this.startMid = this.startNode.pos.copy();
      this.startColor = this.startNode.c;
    }
    if (this.endNode) {
      this.endMid = this.endNode.pos.copy();
      this.endColor = this.endNode.c;
    }
    
    // Requires startNode, endNode, startMid, endMid
    console.log('Calculating rect for edge from', this.startNode.pos.x, this.startNode.pos.y, 'to', this.endNode.pos.x, this.endNode.pos.y);
    let v = p5.Vector.sub(this.endMid, this.startMid);
    let angle = v.heading();
    this.startLeft = p5.Vector.fromAngle(angle + PI * 0.5).mult(this.startNode.radius).add(this.startMid);
    this.endLeft   = p5.Vector.fromAngle(angle + PI * 0.5).mult(this.endNode.radius).add(this.endMid);
    this.startRight = p5.Vector.fromAngle(angle - PI * 0.5).mult(this.startNode.radius).add(this.startMid);
    this.endRight   = p5.Vector.fromAngle(angle - PI * 0.5).mult(this.endNode.radius).add(this.endMid);
  }

  draw() {
    // Always recalculate before drawing to handle node movement
    this.calculateRect();
    
    noStroke();
    colorMode(HSB, 255);
    beginShape(QUADS);
    fill(this.startColor);
    vertex(this.startLeft.x, this.startLeft.y, 0);
    vertex(this.startRight.x, this.startRight.y, 0);
    fill(this.endColor);
    vertex(this.endRight.x, this.endRight.y, 0);
    vertex(this.endLeft.x, this.endLeft.y, 0);
    endShape();
  }

  isSelected(s) {
    this.selected = s;
    if (this.selected) {
      this.zIndex = window.gZIndex !== undefined ? window.gZIndex++ : 0;
    }
  }

  hitTest(x, y) {
    // Recalculate rectangle to ensure current positions for accurate hit testing
    this.calculateRect();
    let p = createVector(x, y);
    return isInRect(this.startLeft, this.startRight, this.endRight, this.endLeft, p);
  }

  setStartColor(c) {
    this.startColor = c;
  }

  setEndColor(c) {
    this.endColor = c;
  }

  setEndMid(x, y) {
    this.endMid.x = x;
    this.endMid.y = y;
    this.calculateRect();
  }

  setEndNode(node) {
    this.endNode = node;
    this.endColor = node.c;
    this.endMid = node.pos.copy();
    this.calculateRect();
  }
}

// Helper functions as before:
function triangleSize(p1, p2, p3) {
  return 0.5 * Math.abs(
    p1.x * (p2.y - p3.y) +
    p2.x * (p3.y - p1.y) +
    p3.x * (p1.y - p2.y)
  );
}

function isInRect(a, b, c, d, p) {
  let areaRect = Math.floor(0.5 * Math.abs((a.y - c.y) * (d.x - b.x) + (b.y - d.y) * (a.x - c.x)));
  let abp = triangleSize(a, b, p);
  let bcp = triangleSize(b, c, p);
  let cdp = triangleSize(c, d, p);
  let dap = triangleSize(d, a, p);
  return areaRect === Math.floor(abp + bcp + cdp + dap);
}