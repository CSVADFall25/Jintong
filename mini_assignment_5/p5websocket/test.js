// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8765');

let message = '';

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
    message = event.data;

    

});

let hue = 0;
let cam;

function setup() {
  createCanvas(720, 540);
  pixelDensity(1);
  cam = createCapture(VIDEO);
  cam.size(720, 540);
  cam.hide();
}

function draw() {
  background(220);
  translate(width, 0);
  scale(-1, 1);

  cam.loadPixels();

  if (message === "Out of range") {
    image(cam, 0, 0, width, height);
  }
  else if (message !== '') {
    let value = parseFloat(message);
    if (!isNaN(value)) {
      image(cam, 0, 0, width, height);

      let blur = map(value, 0, 70, 50, 0);
      filter(BLUR, blur);
    } else {
      image(cam, 0, 0, width, height);
    }
  }
  else {
    image(cam, 0, 0, width, height);
  }
  cam.updatePixels();
}
    