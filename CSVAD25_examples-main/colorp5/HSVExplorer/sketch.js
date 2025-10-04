// HSVExplorer - Explore Hue, Saturation, and Brightness with mouse interaction
// Move mouse horizontally to change hue
// Three vertical bars show the same hue at different brightness levels
// adapted from Rune Madsen's Color Scheme Brightness Example :https://printingcode.runemadsen.com/examples/color/scheme_brightness/index.html
let hueValue;

function setup() {
  createCanvas(600, 400);
  colorMode(HSB, 360, 100, 100);
  noStroke();
}

function draw() {
  background(0);

  // Compute hue based on mouse position
  let hue = map(mouseX, 0, width, 0, 360);

  // First square (pure hue)
  fill(hue, 100, 100);
  rect(0, 0, 200, height);

  // Second square (slightly darker)
  fill(hue, 100, 70); // darkened by lowering brightness
  rect(200, 0, 200, height);

  // Third square (even darker)
  fill(hue, 100, 40);
  rect(400, 0, 200, height);
}
