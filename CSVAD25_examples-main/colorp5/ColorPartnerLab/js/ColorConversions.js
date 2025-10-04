// Color conversion functions for RGB <-> CIE L*a*b* color spaces

// Convert RGB (0-255) to XYZ
function rgbToXyz(r, g, b) {
  // Normalize RGB values to 0-1
  r = r / 255;
  g = g / 255;
  b = b / 255;
  
  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Convert to XYZ using sRGB matrix
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  
  return {x: x * 100, y: y * 100, z: z * 100}; // Scale to 0-100
}

// Convert XYZ to CIE L*a*b*
function xyzToLab(x, y, z) {
  // Reference white D65
  let xn = 95.047;
  let yn = 100.000;
  let zn = 108.883;
  
  x = x / xn;
  y = y / yn;
  z = z / zn;
  
  // Apply lab transformation
  let fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  let fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  let fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  let l = 116 * fy - 16;
  let a = 500 * (fx - fy);
  let b = 200 * (fy - fz);
  
  return {l: l, a: a, b: b};
}

// Convert RGB directly to CIE L*a*b*
function rgbToLab(r, g, b) {
  let xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

// Convert CIE L*a*b* to XYZ
function labToXyz(l, a, b) {
  // Reference white D65
  let xn = 95.047;
  let yn = 100.000;
  let zn = 108.883;
  
  let fy = (l + 16) / 116;
  let fx = a / 500 + fy;
  let fz = fy - b / 200;
  
  let x = fx > 0.206893 ? Math.pow(fx, 3) : (fx - 16/116) / 7.787;
  let y = fy > 0.206893 ? Math.pow(fy, 3) : (fy - 16/116) / 7.787;
  let z = fz > 0.206893 ? Math.pow(fz, 3) : (fz - 16/116) / 7.787;
  
  return {x: x * xn, y: y * yn, z: z * zn};
}

// Convert XYZ to RGB
function xyzToRgb(x, y, z) {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  
  // Convert XYZ to linear RGB using sRGB matrix
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  
  // Apply gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
  
  // Clamp values to 0-1 and scale to 0-255
  r = Math.max(0, Math.min(1, r)) * 255;
  g = Math.max(0, Math.min(1, g)) * 255;
  b = Math.max(0, Math.min(1, b)) * 255;
  
  return {r: Math.round(r), g: Math.round(g), b: Math.round(b)};
}

// Convert CIE L*a*b* directly to RGB
function labToRgb(l, a, b) {
  let xyz = labToXyz(l, a, b);
  return xyzToRgb(xyz.x, xyz.y, xyz.z);
}

// Calculate Euclidean distance between two LAB colors
function labDistance(lab1, lab2) {
  let dL = lab1.l - lab2.l;
  let da = lab1.a - lab2.a;
  let db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// Calculate Delta E CIE76 (perceptual color difference)
function deltaE76(lab1, lab2) {
  return labDistance(lab1, lab2);
}

// Interpolate between two LAB colors
function interpolateLab(lab1, lab2, t) {
  return {
    l: lab1.l + (lab2.l - lab1.l) * t,
    a: lab1.a + (lab2.a - lab1.a) * t,
    b: lab1.b + (lab2.b - lab1.b) * t
  };
}