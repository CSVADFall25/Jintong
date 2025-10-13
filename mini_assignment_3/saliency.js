let img;
let saliencyMap;
let fileInput; 


function setup() {
  createCanvas(800, 600);
  pixelDensity(1);
  noLoop();
  
  fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);

//   saliencyMap = createImage(img.width, img.height);
//   generateSaliencyMap();
//   displaySaliencyMap();
}


function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      resizeCanvas(img.width, img.height);
      saliencyMap = createImage(img.width, img.height);
      generateSaliencyMap();
      redraw();
    });
  }
}

function draw() {
  background(0);
  if (saliencyMap) {
    displaySaliencyMap();
  }
}

function generateSaliencyMap() {
  if (!img || !saliencyMap) return;

  img.loadPixels();
  saliencyMap.loadPixels();

  // Create a blurred copy of the original image.
  let blurredImg = img.get();
  blurredImg.filter(BLUR, 20);
  blurredImg.loadPixels();

  // Calculate the difference between the original and blurred image brightness.
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;

      let originalBrightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
      let blurredBrightness = (blurredImg.pixels[index] + blurredImg.pixels[index + 1] + blurredImg.pixels[index + 2]) / 3;
      
      let contrast = abs(originalBrightness - blurredBrightness) * 3; // Amplify contrast for visibility.
      contrast = constrain(contrast, 0, 255); // Keep value within range.
      
      saliencyMap.pixels[index] = contrast;
      saliencyMap.pixels[index + 1] = contrast;
      saliencyMap.pixels[index + 2] = contrast;
      saliencyMap.pixels[index + 3] = 255;
    }
  }
  saliencyMap.updatePixels();
}

function displaySaliencyMap() {
  // Display the generated saliency map.
  image(saliencyMap, 0, 0);
}