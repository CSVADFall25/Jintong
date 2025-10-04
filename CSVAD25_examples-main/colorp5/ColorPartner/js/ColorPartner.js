let swatch1;
let swatch2;
let swatches = [];
let selectedSwatch = null;
let colorShift = false;
let move = false;
let framesElapsed = 0;
let dragOffset = null;

function setup() {
  createCanvas(800, 800);
  swatch1 = new Swatch(round(width * 0.3), height / 2, 100, 0, 100, 100);
  swatch2 = new Swatch(round(width * 0.6), height / 2, 100, 10, 100, 100);
  swatch1.locked = true;
  swatch2.locked = true;
  swatches.push(swatch1);
  swatches.push(swatch2);
}

function draw() {
  colorMode(RGB, 255);
  background(200, 200, 200);

  for (let i = 0; i < swatches.length; i++) {
    swatches[i].draw();
  }

  for (let i = swatches.length - 1; i >= 0; i--) {
    if (swatches[i].rad < 0) {
      swatches.splice(i, 1);
    }
  }

  if (selectedSwatch != null && !colorShift && !move) {
    colorMode(RGB, 255);
    stroke(255);
    line(selectedSwatch.position.x, selectedSwatch.position.y, mouseX, mouseY);
    framesElapsed++;
    if (framesElapsed > 100) {
      generateVariations(selectedSwatch, mouseX, mouseY);
      framesElapsed = 0;
    }
  }
}

function keyPressed() {
  if (key === 'c') {
    colorShift = true;
  } else if (key === 'm') {
    move = true;
  }
}

function keyReleased() {
  colorShift = false;
  move = false;
}

function mouseReleased() {
  deselectAllSwatches();
  framesElapsed = 0;
  dragOffset = null; // Reset drag offset when mouse is released
}

function mouseWheel(event) {
  let e = round(event.deltaY / 100); // normalize across browsers
  for (let i = 0; i < swatches.length; i++) {
    let s = swatches[i];
    if (s.selected === true) {
      if (colorShift === true) {
        s.updateColor(createVector(0, 0), e);
      }
      return false;
    }
  }
  return false;
}

function mouseDragged() {
  let delta = createVector(mouseX - pmouseX, mouseY - pmouseY);
  for (let i = 0; i < swatches.length; i++) {
    let s = swatches[i];
    if (s.selected === true) {
      if (colorShift === true) {
        s.updateColor(delta, 0);
      } else if (move === true) {
        // Use absolute positioning with offset for more precise movement
        if (dragOffset !== null) {
          let newX = mouseX - dragOffset.x;
          let newY = mouseY - dragOffset.y;
          s.position.set(newX, newY);
        }
      }
      break; // Only move one swatch at a time
    }
  }
}



function mousePressed() {
  let s = checkForSwatchHit(mouseX, mouseY);
  if (s != null && s.locked) {
    s.selected = true;
    selectedSwatch = s;
    s.rad = 75;
    
    // Store the offset between mouse and swatch center for smoother dragging
    if (move === true) {
      dragOffset = createVector(mouseX - s.position.x, mouseY - s.position.y);
    }
  }
}

function deselectAllSwatches() {
  for (let i = 0; i < swatches.length; i++) {
    swatches[i].selected = false;
  }
  selectedSwatch = null;
}

function checkForSwatchHit(x, y) {
  for (let i = swatches.length - 1; i >= 0; i--) {
    let s = swatches[i];
    let hitTest = s.hitTest(x, y);
    if (hitTest === true) {
      s.locked = true;
      return s;
    }
  }
  return null;
}

function calculateDistance(swatch,x,y){
    let d = dist(x, y, swatch.position.x, swatch.position.y);
    return {distance:d,hue:swatch.hue,sat:swatch.sat,bri:swatch.bri};
}

function calculateValue(valueDistancePairs){
  let totalWeight = 0;
  let weightedHueSum = 0;
  let weightedSatSum = 0;
  let weightedBriSum = 0;

  for (let i = 0; i < valueDistancePairs.length; i++) {
    let pair = valueDistancePairs[i];
    let weight = 1 / (pair.distance + 1e-5); // Avoid division by zero
    weightedHueSum += pair.hue * weight;
    weightedSatSum += pair.sat * weight;
    weightedBriSum += pair.bri * weight;
    
    totalWeight += weight;
  }
  if(totalWeight > 0){
    return{hueWeight:weightedHueSum / totalWeight,
    satWeight:weightedSatSum / totalWeight,
    briWeight:weightedBriSum / totalWeight};
  }
  else{
    return {hueWeight:0,satWeight:0,briWeight:0};
  }
}

function generateVariations(targetSwatch, x, y) {
  /*let diffVec = createVector(x - targetSwatch.position.x, y - targetSwatch.position.y);
  let dist = map(diffVec.mag(), 0, width / 2, 0, 40);
  dist = constrain(dist, 0, 40);
  console.log('dist:', dist);*/
  let distances = [];
  for (let i = 0; i < swatches.length; i++) {
    let s = swatches[i];
    let d = calculateDistance(s, x, y);
    distances.push(d);
  }
  let newWeights = calculateValue(distances);

  let newSwatch = new Swatch(x, y, 40, newWeights.hueWeight, newWeights.satWeight, newWeights.briWeight);
  swatches.push(newSwatch);
}

// Register mouseWheel event for p5.js
function setupEventHandlers() {
  // Attach mouseWheel event
  window.addEventListener('wheel', function(e) {
    // Prevent the default scrolling behavior
    if (colorShift && selectedSwatch) {
      mouseWheel({deltaY: e.deltaY});
      e.preventDefault();
    }
  }, {passive: false});
}

// Needed for mouseWheel to work in some browsers
setupEventHandlers();