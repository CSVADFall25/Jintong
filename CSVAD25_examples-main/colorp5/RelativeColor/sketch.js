// Josef Albers Color Relativity 1 Example from Code as Creative Medium
// What are the conditions where three colors look like 4? 
// moving the mouse changes the background colors
// moving the mouse while pressing changes the circle color
// Vertical mouse movement changes saturation of the colors
// Horizontal mouse movement changes hue of the colors

let leftCol, rightCol, circleCol;
let mode = "background"; // other mode is "circle"

function setup() {
  createCanvas(500, 500);
  colorMode(HSB, 360, 100, 100);
  leftCol = color(random(360), random(100), random(100));
  rightCol = color(random(360), random(100), random(100));
  circleCol = color(random(360), random(100), random(100));
  noStroke();
}

function draw() {
   // Map mouseX to hue (0–360)

  let baseHue = map(mouseX, 0, width, 0, 360);
  let baseSat = map(mouseY, 0, height, 0, 100);
  if(mode === "circle"){
    circleCol = color(baseHue, baseSat, 100);
  }
  else if(mode === "background"){ 
    leftCol = color(baseHue, baseSat, 100);
    rightCol = color((baseHue + 180) % 360, 100-baseSat, 100);
  }

  fill(leftCol);
  rect(0, 0, width/2, height);

  fill(rightCol);
  rect(width/2, 0, width/2, height);

  fill(circleCol);
  ellipse(width/4, height/2, 60, 60);
  ellipse(3*width/4, height/2, 60, 60);
  
  fill(0);
  text('press mouse to change inner circle color',10, height-10);
}


function mousePressed() {
  mode = "circle";
}

function mouseReleased() {
  mode = "background";
}
