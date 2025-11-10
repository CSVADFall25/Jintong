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
  // translate(width, 0);
  // scale(-1, 1);

  if (cam.loadedmetadata) {
    cam.loadPixels();

    if (message === "Out of range") {
      image(cam, 0, 0, width, height);
    } else if (message !== '') {
      let value = parseFloat(message);

      if (!isNaN(value)) {
      
        console.log('message:', message, 'value:', value);
        
        fill(0);
        textSize(24);
        
        let w = map(value, 0, 160, 1, 150); 
        let h = map(value, 0, 160, 1, 150);
        for (let j = 0; j < height; j += 20) {
          for (let i = 0; i < width; i += 20) {
            let p = (i + j * width) * 4;
            let r = cam.pixels[p];
            let g = cam.pixels[p + 1];
            let b = cam.pixels[p + 2];
            fill(r, g, b);
            noStroke();
            ellipse(i, j, w, h, CENTER);

          }

        }
        text('Value: ' + value, 20, 40);

      } else {
        image(cam, 0, 0, width, height);
      }
    } else {
      image(cam, 0, 0, width, height);
    }
    cam.updatePixels();
  }
}
    