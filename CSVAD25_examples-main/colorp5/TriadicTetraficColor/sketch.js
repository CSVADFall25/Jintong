// Triadic Tetradic Colo
// Mouse position changes base hue value. Four squares show analogous colors (base, base +30, base +60, base +90).
// extended from Rune Madsen's Color Scheme Analogous Example :https://printingcode.runemadsen.com/examples/color/scheme_analogous/index.html

let outerRadius = 200;
let innerRadius = 100; // hole size
let steps = 360/15; // resolution
let mode = 'triadic'; // change to 'tetradic' for tetradic colors

function setup() {
  createCanvas(800, 800);
  colorMode(HSB, 360, 100, 100);
  noStroke();
}

function draw() {
  background(100);
  drawRing();
  if(mode === 'triadic'){
    drawTriadicColors();
  } else if(mode === 'tetradic'){
    drawTetradicColors();
  }
  fill(0);
  text('click to toggle mode',50, height-50);
}

function mousePressed(){
  if(mode === 'triadic'){
    mode = 'tetradic';
  } else if(mode === 'tetradic'){
    mode = 'triadic';
  } 
}


function drawTriadicColors(){
  // Map mouseX to hue (0–360)
  let baseHue = map(mouseX, 0, width, 0, 360);

  let squareWidth = width/3;
  // Square 1: base hue
  fill((baseHue + 0) % 360, 100, 100);
  rect(0, 0, squareWidth, height/4);
  drawColorPosition(baseHue);

  // Square 2: base + 120
  fill((baseHue + 120) % 360, 100, 100);
  rect(squareWidth, 0, squareWidth, height/4);
  drawColorPosition(baseHue + 120);

  // Square 3: base + 240
  fill((baseHue + 240) % 360, 100, 100);
  rect(squareWidth * 2, 0, squareWidth, height/4);
  drawColorPosition(baseHue + 240);

}

function drawTetradicColors(){
  // Map mouseX to hue (0–360)
  let baseHue = map(mouseX, 0, width, 0, 360);

  let squareWidth = width/4;
  // Square 1: base hue
  fill((baseHue + 0) % 360, 100, 100);
  rect(0, 0, squareWidth, height/4);
  drawColorPosition(baseHue);

  // Square 2: base + 90
  fill((baseHue + 90) % 360, 100, 100);
  rect(squareWidth, 0, squareWidth, height/4);
  drawColorPosition(baseHue + 90);

  // Square 3: base + 180
  fill((baseHue + 180) % 360, 100, 100);
  rect(squareWidth * 2, 0, squareWidth, height/4);
  drawColorPosition(baseHue + 180);

   // Square 4: base + 270
  fill((baseHue + 270) % 360, 100, 100);
  rect(squareWidth * 3, 0, squareWidth, height/4);
  drawColorPosition(baseHue + 270);
}

function drawColorPosition(hue){
  push();
  translate(width / 2, height / 2); 
  let x1 = cos(radians(hue)) * (innerRadius+(outerRadius-innerRadius)/2);
  let y1 = sin(radians(hue)) * (innerRadius+(outerRadius-innerRadius)/2);
  fill(0);
  ellipse(x1, y1, 20,20);
  pop();
}

function drawRing(){
  push();
  translate(width / 2, height / 2); // center of canvas

  

  for (let angle = 0; angle < 360; angle+=steps) {
    let nextAngle = angle + steps;

    // Outer edge points
    let x1 = cos(radians(angle)) * outerRadius;
    let y1 = sin(radians(angle)) * outerRadius;
    let x2 = cos(radians(nextAngle)) * outerRadius;
    let y2 = sin(radians(nextAngle)) * outerRadius;

    // Inner edge points
    let x3 = cos(radians(nextAngle)) * innerRadius;
    let y3 = sin(radians(nextAngle)) * innerRadius;
    let x4 = cos(radians(angle)) * innerRadius;
    let y4 = sin(radians(angle)) * innerRadius;

    fill(angle, 100, 100);
    quad(x1, y1, x2, y2, x3, y3, x4, y4);
   
  }
  pop();

}