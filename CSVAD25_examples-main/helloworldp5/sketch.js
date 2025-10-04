// Hello World Portrait
// created by Jennifer Jacobs September 26 2019. Inspired by Casey Reas' and Ben Fry's draw a face assignment.
// Converted to p5.js

function setup() {
  // set the size of the canvas to 600 x 600 pixels
  createCanvas(600, 600);

  // set the background color to black
  background(0, 0, 0);

  // set the rect mode to center
  rectMode(CENTER);

  // set the fill to red and draw a 300 x 300 rectangle in the center of the canvas
  fill(255, 0, 0);
  rect(width / 2, height / 2, 300, 300);

  // set the fill to white and draw two white rectangles (the eyes)
  fill(255, 255, 255);
  rect(width / 2 - 60, height / 2 - 60, 100, 20);
  rect(width / 2 + 60, height / 2 - 60, 100, 20);

  // set the fill to black and draw two black rectangles (the pupils)
  fill(0, 0, 0);
  rect(width / 2 - 60, height / 2 - 60, 10, 20);
  rect(width / 2 + 60, height / 2 - 60, 10, 20);

  // set ellipse mode to center and draw an ellipse in the center of the canvas (the mouth)
  ellipseMode(CENTER);
  ellipse(width / 2, height / 2, 200, 40);

  // set the stroke weight to five pixels, then draw two lines at the edge of the mouth
  strokeWeight(5);
  line(width / 2 - 100, height / 2 - 20, width / 2 - 100, height / 2 + 20);
  line(width / 2 + 100, height / 2 - 20, width / 2 + 100, height / 2 + 20);
}