let baseCol, accentCol; 
let baseColors = new Array(8);
let accentColors = new Array(3);
let numRows = 20;
let numCols = 20;
let grid = new Array(numRows);

function setup(){
  createCanvas(500, 500);
  regeneratePalette = true;
}


function draw() {
  background(255);
  noStroke();

  let baseHue = map(mouseX, 0, width, 0, 360);
  let baseLightness = map(mouseY, 0, height, 0, 100);
  colorMode(HSB, 360, 100, 100);

  baseCol = color(baseHue, 100, baseLightness);
  accentCol = color((baseHue + 180) % 360, 100, baseLightness);
  
  if (regeneratePalette) {
    generatePalette();
    generateGrid();
    regeneratePalette = false;
  }

  drawPalette();
  fill(255);
  rect(0, height/10 + 0.5*height/10, width, height/20);
  drawGrid();
}

function drawPalette() {
  fill(baseCol);
  rect(0, 0, (3*width)/4, height/10);

  fill(accentCol);
  rect((3*width)/4, 0, width/4, height/10);

  for (let i = 0; i < baseColors.length; i++) {
    let c = baseColors[i];
    fill(c);
    rect(i * ((3*width)/4)/baseColors.length, height/10, ((3*width)/4)/baseColors.length + 1, height/10);
  }

  for (let i = 0; i < accentColors.length; i++) {
    let c =  accentColors[i];
    fill(c);
    rect((3*width/4) + i * (width/4)/accentColors.length, height/10, (width/4)/accentColors.length + 1, height/10);
  }
}

function drawGrid() {
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      fill(grid[i][j]);
      rect(i * width/numRows, height/5 + j * height/numCols, width/numRows, height/numCols);
    }
  }
}

function generatePalette() {
  for (let i = 0; i < baseColors.length; i++) {
    // Create variations by changing brightness while keeping hue and saturation
    let brightness = map(i, 0, baseColors.length-1, 20, 80);
    let c = color(hue(baseCol), saturation(baseCol), brightness);
    baseColors[i] = c;
  }

  for (let i = 0; i < accentColors.length; i++) {
    // Create variations by changing brightness while keeping hue and saturation  
    let brightness = map(i, 0, accentColors.length-1, 20, 80);
    let c = color(hue(accentCol), saturation(accentCol), brightness);
    accentColors[i] = c;
  }
}

function generateGrid() {
  for (let i = 0; i < numRows; i++) {
    grid[i] = new Array(numCols);
    for (let j = 0; j < numCols; j++) {
      let baseOrAccent = random();
      if (baseOrAccent < 0.75) {
        let alphaIndex = int(random(baseColors.length));
        grid[i][j] = baseColors[alphaIndex];
      } else {
        let alphaIndex = int(random(accentColors.length));
        grid[i][j] = accentColors[alphaIndex];
      }
    }
  }
}

function mousePressed(){
  regeneratePalette = true;
}