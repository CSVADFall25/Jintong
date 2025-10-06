// Create a novel color picker (p5.js version)
// Inspired by Sihwa Park's Processing example

let colorNodes = [];
let edges = [];

let currentNode = null;
let currentEdge = null;

let hueChange = false;
let brightChange = false;
let saturationChange = false;
let radiusChange = false;
let move = false;
let drawConnector = false;

let rightMoveMode = false;        // node follows mouse after a right-click until confirmed
let rightPressPending = false;    // true between right mouse press and release (to detect drag vs click)
let rightPressStart = null;       // {x,y} start pos of right press
let rightPressNode = null;        // node that was pressed with right button
let rightResize = false;          // true when right-button-dragging to resize
let lastRightClickTime = 0;       // for double-right-click detection
let lastRightClickNode = null;

let gZIndex = 0;
let drawStroke = false;
let blendModeIndex = 0;
let blendModeArr = ['blend', 'add', 'screen'];
let lastColor;
let lastLeftClickTime = 0;
let lastLeftClickNode = null;

function setup() {
  createCanvas(900, 900, WEBGL);
  colorMode(HSB, 255);
  lastColor = color(0, 255, 255);

  // Simple UI
  let strokeCB = createCheckbox('Stroke', false);
  strokeCB.position(10, 10);
  strokeCB.changed(() => drawStroke = strokeCB.checked());

  let blendSelect = createSelect();
  blendSelect.position(10, 40);
  ['BLEND', 'ADD', 'SCREEN'].forEach((m, i) => blendSelect.option(m, i));
  blendSelect.changed(() => blendModeIndex = int(blendSelect.value()));

  let info = 
    "===================  How to Use  ===================\n" +

    "- Left click: add a node\n" +
    "- Double left click: toggle edit mode for a node\n"+
    "- Double left click after picking color for the node: exit edit mode\n"+
    "  - In edit mode:\n" +
    "    - Click on color ring to set hue\n" +
    "    - Click on brightness ring to set brightness\n" +
    "    - Click on saturation ring to set saturation\n" +
    
    "- Right click: move a node\n" +
    "- Right click and drag: resize a node\n"+
    "- Double right click: delete a node\n"+

    "- Select & Drag: make an edge\n\n";

  let infoDiv = createDiv('<pre>' + info + '</pre>');
  infoDiv.position(width - 170, 10);
  infoDiv.style('color', '#888');
  infoDiv.style('font-size', '14px');
  infoDiv.style('background', '#222');
  infoDiv.style('padding', '8px');
  infoDiv.style('border-radius', '8px');
}

function draw() {
  background(0);
  resetMatrix();
  colorMode(RGB, 255);
  setBlendMode(blendModeArr[blendModeIndex]);
  
  // If in right-move mode, make the selected node follow the mouse
  if (rightMoveMode && currentNode) {
    currentNode.pos.set(mouseX - width/2, mouseY - height/2);
  }

  // draw all edges
  for (let e of edges) {
    console.log('drawing edge from', e.startNode.pos.x, e.startNode.pos.y, 'to', e.endNode.pos.x, e.endNode.pos.y);
    e.draw();
  }
  setBlendMode('blend');

  // draw all nodes
  if (drawStroke) {
    stroke(255);
    strokeWeight(3);
  } else {
    noStroke();
  }
  for (let n of colorNodes) {
    n.draw();
  }

  // draw connector and adjustments
  if (currentNode) {
    let m = createVector(mouseX - width/2, mouseY - height/2);
    let v = p5.Vector.sub(m, currentNode.pos);
    let angle = v.heading();

    if (hueChange || brightChange || saturationChange) {
      stroke(255);
      strokeWeight(3);
      point(currentNode.pos.x, currentNode.pos.y);
      strokeWeight(1);
      let endPoint = m.copy();
      if (v.mag() >= currentNode.radius) {
        endPoint.x = currentNode.radius;
        endPoint.y = 0;
        endPoint.rotate(angle);
        endPoint.add(currentNode.pos);
      }
      line(currentNode.pos.x, currentNode.pos.y, endPoint.x, endPoint.y);
    }

    if (drawConnector && currentEdge) {
      let sl = createVector(currentNode.radius * 0.25, 0).rotate(angle + PI * 0.5);
      let el = p5.Vector.add(sl, m);
      sl.add(currentNode.pos);
      let sr = createVector(currentNode.radius * 0.25, 0).rotate(angle - PI * 0.5);
      let er = p5.Vector.add(sr, m);
      sr.add(currentNode.pos);

      stroke(255);
      strokeWeight(1);
      beginShape(LINES);
      vertex(currentNode.pos.x, currentNode.pos.y, 0);
      vertex(sl.x, sl.y, 0);
      vertex(currentNode.pos.x, currentNode.pos.y, 0);
      vertex(sr.x, sr.y, 0);
      vertex(currentNode.pos.x, currentNode.pos.y, 0);
      vertex(mouseX - width/2, mouseY - height/2, 0);
      vertex(mouseX - width/2, mouseY - height/2, 0);
      vertex(el.x, el.y, 0);
      vertex(mouseX - width/2, mouseY - height/2, 0);
      vertex(er.x, er.y, 0);
      endShape();
      currentEdge.draw();
    }
  }
}

function mousePressed() {
  // Ignore UI elements
  if (overAnyUI()) return;

  // find node under mouse
  let nodeUnder = nodesHitTest(mouseX - width/2, mouseY - height/2);

  // Handle right-button press specially: record for click-vs-drag detection
  if (mouseButton === RIGHT) {
    rightPressPending = true;
    rightPressStart = { x: mouseX, y: mouseY };
    rightPressNode = nodeUnder;
    // do not toggle/remove immediately; wait until release to distinguish drag vs click
    return; // other right-button behavior handled on release/drag
  }

  // Left-button behavior (unchanged)
  currentNode = nodeUnder;
  // If clicking on a color ring of any editing node, do not create a new node here.
  if (mouseButton === LEFT) {
    let mx = mouseX - width/2;
    let my = mouseY - height/2;
    for (let i = colorNodes.length - 1; i >= 0; i--) {
      let n = colorNodes[i];
      if (n.isEditing) {
        let info = n.getRingHitInfo(mx, my);
        if (info) {
          n._lastRingHit = info;
          // let mouseReleased handle the ring click (color selection). Prevent node creation.
          return;
        }
      }
    }
  }
  if (!currentNode) {
    currentEdge = edgesHitTest(mouseX - width/2, mouseY - height/2);
    if (!currentEdge) {
      if (mouseButton === LEFT) {
        let cc = new ColorNode(mouseX - width/2, mouseY - height/2, 50, lastColor);
        colorNodes.push(cc);
        currentNode = cc;
      }
    } else {
      if (mouseButton === LEFT) {
        let c = get(mouseX, mouseY); // get color under mouse
        let midNode = new ColorNode(mouseX - width/2, mouseY - height/2, 50, color(c));
        colorNodes.push(midNode);
        lastColor = midNode.c;

        let edge1 = GradientEdgeRect.fromNodes(currentEdge.startNode, midNode, 0, 0, gZIndex++);
        let edge2 = GradientEdgeRect.fromNodes(midNode, currentEdge.endNode, 0, 0, gZIndex++);
        edges.push(edge1, edge2);
        currentEdge.startNode.removeEdge(currentEdge);
        currentEdge.startNode.addEdge(edge1);
        midNode.addEdge(edge1);
        midNode.addEdge(edge2);
        currentEdge.endNode.removeEdge(currentEdge);
        currentEdge.endNode.addEdge(edge2);

        let idx = edges.indexOf(currentEdge);
        if (idx !== -1) edges.splice(idx, 1);
      }
    }
  } else {
    // left-click on an existing node: check for double-click to toggle edit mode
    let now = millis();
    if (lastLeftClickNode === currentNode && (now - lastLeftClickTime) < 300) {
      // double left-click: toggle edit mode
      currentNode.isEditing = !currentNode.isEditing;
      // when entering edit mode, keep node selected; when exiting, clear
      if (!currentNode.isEditing) {
        // exit edit mode
      }
      lastLeftClickTime = 0;
      lastLeftClickNode = null;
      return;
    }

    // not a double click: normal left-click behavior
    lastLeftClickTime = now;
    lastLeftClickNode = currentNode;
    lastColor = currentNode.c;
    for (let edge of currentNode.edges) edge.isSelected(true);
    edges.sort((a, b) => a.zIndex - b.zIndex);
  }
}

function mouseDragged() {
  // If right-press is pending and mouse moved enough, treat as right-drag (resize)
  if (rightPressPending && mouseButton === RIGHT) {
    let dx = mouseX - rightPressStart.x;
    let dy = mouseY - rightPressStart.y;
    if (sqrt(dx*dx + dy*dy) > 5) {
      // start right-drag resize
      rightResize = true;
      rightPressPending = false;
      // ensure we have a node to resize
      if (rightPressNode) {
        currentNode = rightPressNode;
      }
    }
  }

  // Right-drag resize: allow resizing while holding right button
  if (mouseButton === RIGHT && rightResize && currentNode) {
    currentNode.changeRadius(mouseX - width/2, mouseY - height/2);
    lastColor = currentNode.c;
    return;
  }


  if (mouseButton === RIGHT) return; // don't process left behaviors while right button is down
  if (currentNode) {
    if (hueChange) currentNode.changeHue(mouseX - width/2, mouseY - height/2);
    else if (brightChange) currentNode.changeBright(mouseX - width/2, mouseY - height/2);
    else if (saturationChange) currentNode.changeSaturation(mouseX - width/2, mouseY - height/2);
    else if (radiusChange) currentNode.changeRadius(mouseX - width/2, mouseY - height/2);
    else if (move) {
      let delta = createVector(mouseX-pmouseX, mouseY-pmouseY);
      currentNode.move(delta);
    } else if (!drawConnector) {
      drawConnector = true;
      currentEdge = GradientEdgeRect.fromNodes(currentNode, null, mouseX - width/2, mouseY - height/2, gZIndex++);
    }
    if (drawConnector && currentEdge) {
      currentEdge.setEndMid(mouseX - width/2, mouseY - height/2);
      let node = nodesHitTest(mouseX - width/2, mouseY - height/2);
      if (!node) {
        currentEdge.setEndColor(currentNode.c);
      } else if (node !== currentNode) {
        currentEdge.setEndColor(node.c);
      }
    }
    lastColor = currentNode.c;
  }
}

function mouseReleased() {
  if (mouseButton === RIGHT) {
    if (rightResize) {
      rightResize = false;
      rightPressPending = false;
    } else if (rightPressPending) {
      let node = rightPressNode;
      let now = millis();
      if (lastRightClickNode === node && (now - lastRightClickTime) < 300 && node) {
        // double right-click --- delete node
        let removeIndices = [];
        for (let edge of node.edges) {
          let idx = edges.indexOf(edge);
          if (idx !== -1) removeIndices.push(idx);
        }
        removeIndices.sort((a, b) => b - a);
        for (let idx of removeIndices) edges.splice(idx, 1);
        node.removeAllEdges();
        let idxn = colorNodes.indexOf(node);
        if (idxn !== -1) colorNodes.splice(idxn, 1);
        if (rightMoveMode && currentNode === node) {
          rightMoveMode = false;
          currentNode = null;
        }
      } else {
        if (node) {
          if (!rightMoveMode) {
            rightMoveMode = true;
            currentNode = node;
          } else {
            if (currentNode === node) {
              rightMoveMode = false;
              currentNode = null;
            } else {
              currentNode = node;
            }
          }
        }
      }
      lastRightClickTime = now;
      lastRightClickNode = node;
      rightPressPending = false;
    }
    rightPressPending = false;
    return;
  }

  // finish edge drawing
  if (drawConnector && currentEdge) {
    let node = nodesHitTest(mouseX - width/2, mouseY - height/2);
    if (node && node !== currentNode) {
      if (!currentNode.hasEdgeWith(node)) {
        currentEdge.setEndNode(node);
        edges.push(currentEdge);
        currentNode.addEdge(currentEdge);
        node.addEdge(currentEdge);
      }
    }
  }

  // If left mouse released and a node is in edit mode, check for ring click to set hue
  if (mouseButton === LEFT) {
    for (let i = colorNodes.length - 1; i >= 0; i--) {
      let n = colorNodes[i];
      if (n.isEditing) {
        if (n._lastRingHit) {
          let info = n._lastRingHit;
          n._lastRingHit = null;
          if (info.type === 'full' || info.type === 'analog' || info.type === 'comp') {
            n.setHue(info.hue);
          } else if (info.type === 'brightness') {
            n.setBrightness(info.value);
          } else if (info.type === 'saturation') {
            n.setSaturation(info.value);
          }
          break;
        }
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        let info = n.getRingHitInfo(mx, my);
        if (info) {
          if (info.type === 'full' || info.type === 'analog' || info.type === 'comp') {
            n.setHue(info.hue);
          } else if (info.type === 'brightness') {
            n.setBrightness(info.value);
          } else if (info.type === 'saturation') {
            n.setSaturation(info.value);
          }
          break;
        }
      }
    }
  }

  // reset interaction flags and current selections
  currentNode = null;
  drawConnector = false;
  currentEdge = null;
  move = false;
  radiusChange = false;
}

function keyPressed() {
  if (drawConnector) return;
  if (key === 'h' || key === 'H') hueChange = true;
  else if (key === 's' || key === 'S') brightChange = true;
  else if (key === 'b' || key === 'B') saturationChange = true;
  else if (key === 'm' || key === 'M') move = true;
  else if (key === 'r' || key === 'R') radiusChange = true;
  else if (key === ' ') saveCanvas('screenshot', 'png');
}

function keyReleased() {
  hueChange = false;
  brightChange = false;
  saturationChange = false;
  move = false;
  radiusChange = false;
}

// ----- Helper and Class Definitions -----

function overAnyUI() {
  // crude: ignore if mouse is on left 220px or right 170px
  return mouseX < 230 || mouseX > width - 170;
}

function nodesHitTest(x, y) {
  for (let i = colorNodes.length - 1; i >= 0; i--) {
    if (colorNodes[i].hitTest(x, y)) return colorNodes[i];
  }
  return null;
}

function edgesHitTest(x, y) {
  for (let i = edges.length - 1; i >= 0; i--) {
    if (edges[i].hitTest(x, y)) return edges[i];
  }
  return null;
}

function setBlendMode(mode) {
  if (mode === 'blend') blendMode(BLEND);
  else if (mode === 'add') blendMode(ADD);
  else if (mode === 'screen') blendMode(SCREEN);
}


// Helper: point-line distance
function distToSegment(p, v, w) {
  let l2 = p5.Vector.dist(v, w)**2;
  if (l2 === 0) return p5.Vector.dist(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = max(0, min(1, t));
  let proj = createVector(v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
  return p5.Vector.dist(p, proj);
}