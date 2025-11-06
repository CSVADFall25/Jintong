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

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  if (message === "Out of range") {
    background(0);
  }
  else{
    background(100);
  }
  
}