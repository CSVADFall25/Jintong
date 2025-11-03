// Data mapping:
// distance -> determines which ring the circle is on (by interval)
// energy -> determines the size of the circle (higher energy, smaller circle)
// duration -> determines the rotation speed (longer duration, slower speed)

let circles = [];
let table;
let distance = [];
let labels = [];
let energy = [];
let duration = [];
let tooltipGraphics;
let minDistance, maxDistance, orbitStep;
const numOrbits = 5;

function preload() {
  // Make sure your CSV is in the same folder as the sketch
  table = loadTable('cycling_workouts.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 800);
  tooltipGraphics = createGraphics(width, height);
  // draw() will run continuously to support hover interaction

  // Extract all values from CSV
  for (let r = 0; r < table.getRowCount(); r++) {
    labels.push(formatDate(table.getString(r, 'startDate')));
    distance.push(float(table.getString(r, 'totalDistance_miles')));
    energy.push(float(table.getString(r, 'totalEnergyBurned_cal')));
    duration.push(float(table.getString(r, 'duration_minutes')));
  }

  const minDur = min(duration);
  const maxDur = max(duration);
  const minEnergy = min(energy);
  const maxEnergy = max(energy);
  minDistance = min(distance);
  maxDistance = max(distance);

  // Orbit boundaries based on distance (in miles)
  const orbitBounds = [0, 1.5, 2.5, 3, 8, 13];
  orbitStep = (maxDistance - minDistance) / numOrbits;

  for (let r = 0; r < table.getRowCount(); r++) {
    // Map duration to angular speed (longer duration -> slower speed)
  let angularSpeed = map(duration[r], minDur, maxDur, 0.02, 0.005) * 0.5;

    // Map energy to circle size (higher energy -> smaller size)
    let circleRadius = map(energy[r], minEnergy, maxEnergy, 15, 3);

    // Assign particles to correct orbit level based on manual bounds
    let dist = distance[r];
    let orbitLevel = 0;
    for (let i = 0; i < orbitBounds.length - 1; i++) {
    
      if (dist > orbitBounds[i] && dist < orbitBounds[i + 1]) {
        orbitLevel = i;
        break;
      }
      if (dist === orbitBounds[i + 1]) {
        orbitLevel = i;
        break;
      }
    }
    let orbitRadius = (orbitLevel + 1) * 60;
    let hue = map(dist, minDistance, maxDistance, 0, 270);
    circles.push(new Circle(orbitRadius, angularSpeed, circleRadius, hue));
  }

}


function draw() {
  background(20);

  const center = createVector(width / 2, height / 2);

  // Draw the 5 orbits and their labels
  const orbitBounds = [0, 1.5, 2.5, 3, 8, 13];
  for (let i = 1; i <= numOrbits; i++) {
    const r = i * 60;
    noFill();
    stroke(50);
    strokeWeight(1);
    circle(center.x, center.y, r * 2);

    // Add distance labels
    fill(150);
    noStroke();
    textSize(9);
    textAlign(LEFT, CENTER);
    let labelText = `${orbitBounds[i-1].toFixed(1)}-${orbitBounds[i].toFixed(1)} miles`;
    text(labelText, center.x + r + 5, center.y);
  }

  for (let c of circles) {
    c.update(center, mouseX, mouseY);
    c.show(center);
  }
  drawTooltip(duration, energy, distance, labels);
}

function drawTooltip(values1,values2,values3,labels) {
  
  tooltipGraphics.clear();
  const maxValue1 = max(values1);
  const maxValue2 = max(values2);
  const maxValue3 = max(values3);

  for (let i = 0; i < circles.length; i++) {
    const h = map(values1[i], 0, maxValue1, 0, height - 80);
    

    // Only show tooltip when the mouse is over this circle
    const mouseDist = circles[i].mouseOver(mouseX, mouseY);
    if (mouseDist) {
      // Prepare tooltip content: date + distance, energy, duration
      const dKm = values3[i];
      const kcal = values2[i];
      const hours = values1[i];
      const lines = [
        `${labels[i]}`,
        `Distance: ${nf(dKm, 1, 1)} miles`,
        `Energy: ${round(kcal)} cal`,
        `Duration: ${nf(hours, 1, 2)} min`
      ];

      push();
      // Draw a floating tooltip near the mouse
      tooltipGraphics.colorMode(RGB);
      tooltipGraphics.textAlign(LEFT, TOP);
      tooltipGraphics.textSize(12);
      const padding = 8;
      // Compute tooltip width by longest line
      let tw = 0;
      for (let t of lines) { tw = max(tw, textWidth(t)); }
      let boxW = tw + padding * 2;
      let lineH = 16;
      let boxH = lines.length * lineH + padding * 2;
      let tipX = constrain(mouseX + 12, 0, width - boxW - 1);
      let tipY = constrain(mouseY - (boxH + 12), 0, height - boxH - 1);
      // Background and border
      tooltipGraphics.noStroke();
      tooltipGraphics.fill(0, 0, 0, 200);
      tooltipGraphics.rect(tipX, tipY, boxW, boxH, 6);
      // Text
      tooltipGraphics.fill(255);
      for (let li = 0; li < lines.length; li++) {
        tooltipGraphics.text(lines[li], tipX + padding, tipY + padding + li * lineH);
      }
      pop();
    }
  }
  image(tooltipGraphics, 0, 0);
}

// Circle class
class Circle {
  constructor(orbitRadius, angularSpeed, r, hue) {
    this.orbitRadius = orbitRadius;
    this.angularSpeed = angularSpeed;
    this.r = r;
    this.hue = hue;
    this.angle = random(TWO_PI); // Start at a random angle
    this.pos = createVector();
  }

  update(center, mx, my) {
    if (!this.mouseOver(mx, my)) {
      this.angle += this.angularSpeed;
    }
    // Calculate position based on orbit
    this.pos.x = center.x + this.orbitRadius * cos(this.angle);
    this.pos.y = center.y + this.orbitRadius * sin(this.angle);
  }

  show() {
    noStroke();
    colorMode(HSB);
    fill(this.hue, 255, 255, 180);
    circle(this.pos.x, this.pos.y, this.r * 2);
  }
  mouseOver(mx, my) {
    let d = dist(mx, my, this.pos.x, this.pos.y);
    return d < this.r;
  }
}

function formatDate(datetimeStr) {
  // Split on space → ["2023-10-16", "14:08:33", "-0700"]
  let datePart = datetimeStr.split(" ")[0];
  
  // Split date part → ["2023", "10", "16"]
  let parts = datePart.split("-");
  let year = parts[0].slice(2); // get last two digits
  let month = parts[1];
  let day = parts[2];

  return `${month}/${day}/${year}`;
}
