function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(24, 69, 173); //color
  circle(300,350,50);
  noStroke();
  rectMode(CENTER);
  fill(249,250,50);
  rect(300,300,260,450,120);

  //left eye
  fill(255);
  stroke(0);
  strokeWeight(5)
  ellipse(190,280,115,115);
  strokeWeight(20)
  point(210,280,7,7);

  //right eye
  fill(255);
  strokeWeight(5)
  ellipse(320,280,115,115);
  strokeWeight(20)
  point(340,280,7,7);

  //nose
  strokeWeight(5)
  fill(249,250,50);
  arc(255,350,50,50,0,PI);

  //mouse
  fill(235, 154, 129);
  arc(300,400,100,100,0, PI, PIE);

  //ears
  fill(249,250,50);
  noStroke()
  ellipse(450,300,100,120);
  stroke(0);
  strokeWeight(3.5);
  ellipse(450,300,20,30);

  //hair
  line(150,150,200,100);
  line(200,100,250,150);
  line(250,150,300,100);
  line(300,100,350,150);


}
