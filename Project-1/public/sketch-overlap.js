let canvas;
let drawing;
let colorPicker = null;
// realtime collaboration state
let myReadyState = false;
let partnerInfo = {};
let socket;
let startButtonWelcome;

// partner UI refs
let partnerAvatarImg, partnerStatusP;
// partner label element (the text under partner avatar)
let partnerLabel;
// my avatar UI refs
let myAvatarUploadHint, myAvatarLabel;

// UI State and Elements References
let isDrawing = false;
let currentTool = 'brush'; 
let brushType = 'round'; 

let brushSizeSlider, opacitySlider;
let nameInput, citySelect; 
let avatarImgWelcome, avatarInputFile;
let welcomeDiv, drawingDiv;

// User Info
let userName = "Anonymous";
let userCity = "Everywhere";
let avatarSrc = null; 

// Brush Colors
let currentColor = [0, 0, 0]; 
let currentOpacity = 255; 

const canvasWidth = 800;
const canvasHeight = 600;

// =======================================================
// 1. Setup
// =======================================================
function setup() {
    // DOM
    welcomeDiv = select('#welcome-screen');
    drawingDiv = select('#drawing-ui');
    
    // Welcome Screen
    welcomeDiv.style('display', 'flex');
    
    createWelcomeUIElements();

    // Drawing Canvas
    createDrawingUIElements();
    // sockets
    setupSockets();
    updateToolHighlight();
}

function setupSockets() {
    // assumes socket.io client is included in the page
    if (typeof io === 'undefined') {
        console.log('socket.io client not available');
        return;
    }
    socket = io();

    socket.on('connect', () => {
        console.log('connected to server');
        // send initial join info
        socket.emit('joinRoom', { name: userName });
    });

    socket.on('partnerInfo', (data) => {
        partnerInfo = data || {};
            // update partner label and status in real-time; do not change avatar
            if (partnerInfo.name) {
                if (partnerLabel) partnerLabel.html(partnerInfo.name);
                if (partnerStatusP) partnerStatusP.html(partnerInfo.name);
            }
    });

    socket.on('partnerReadyUpdate', (data) => {
        if (!data) return;
        partnerInfo = { ...partnerInfo, ...data };
        // show readiness status (do not duplicate the name here)
        if (typeof data.isReady !== 'undefined' && partnerStatusP) {
            if (data.isReady) {
                partnerStatusP.html('Partner is READY!');
                partnerStatusP.show();
            } else {
                partnerStatusP.html('Partner not ready');
                partnerStatusP.show();
            }
        }
    });

    // partner profile updates (name only)
    socket.on('partnerUpdate', (data) => {
        if (!data) return;
        // only update the partner label (the text under the avatar)
        if (data.name && partnerLabel) {
            partnerLabel.html(data.name);
        }
    });

    // server signals both users should start the drawing session
    socket.on('startGame', () => {
        startDrawingSession();
    });

    // receive drawing segments from partner and draw them onto the local canvas
    socket.on('drawingData', (data) => {
        if (!data) return;
        // draw partner stroke onto the same drawing buffer so both users see it
        drawing.push();
        drawing.strokeWeight(data.size || 4);
        drawing.strokeCap(ROUND);
        if (data.tool === 'eraser') {
            drawing.stroke(255,255,255, data.opacity || 255);
            drawing.line(data.px, data.py, data.cx, data.cy);
        } else {
            let col = data.color || [0,0,0];
            // use a small interpolation to make strokes visible
            drawing.noStroke();
            let steps = Math.max(1, Math.ceil(dist(data.px, data.py, data.cx, data.cy) / Math.max(1, (data.size||4) * 0.35)));
            for (let i = 0; i <= steps; i++) {
                let t = steps === 0 ? 0 : i / steps;
                let x = lerp(data.px, data.cx, t);
                let y = lerp(data.py, data.cy, t);
                drawing.fill(col[0], col[1], col[2], data.opacity || 255);
                drawing.ellipse(x, y, data.size || 4, data.size || 4);
            }
        }
        drawing.pop();
    });

}

function createWelcomeUIElements() {
    // center container
    let center = createDiv('');
    center.parent(welcomeDiv);
    center.style('display', 'flex');
    center.style('flex-direction', 'column');
    center.style('align-items', 'center');
    center.style('justify-content', 'center');
    center.style('width', '100%');
    center.style('gap', '16px');

    // inputs row (name + location)
    let inputsRow = createDiv('').parent(center);
    inputsRow.style('display', 'flex');
    inputsRow.style('gap', '8px');
    inputsRow.style('align-items', 'center');

    nameInput = createInput('');
    nameInput.parent(inputsRow);
    nameInput.attribute('placeholder', 'Your name');
    nameInput.style('padding', '8px');
    nameInput.style('width', '220px');
    nameInput.input(() => {
        userName = nameInput.value() || 'Someone';
        if (myAvatarLabel) myAvatarLabel.html(userName);
        // notify server of updated name
        if (socket && socket.connected) {
            socket.emit('updateUser', { name: userName });
        }
    });

    citySelect = createSelect();
    citySelect.parent(inputsRow);
    citySelect.style('padding', '8px');
    citySelect.option('Where are you?', '', true, true);
    citySelect.option('Los Angeles');
    citySelect.option('New York');
    citySelect.option('London');
    citySelect.option('Paris');
    citySelect.option('Tokyo');
    citySelect.option('Beijing');
    citySelect.option('Other');

    // ready container with two avatar groups
    let readyContainer = createDiv('').parent(center);
    readyContainer.style('display', 'flex');
    readyContainer.style('gap', '40px');
    readyContainer.style('align-items', 'center');
    readyContainer.style('justify-content', 'center');

    // my avatar group
    let myGroup = createAvatarGroup(readyContainer, 'My Avatar', 'my-avatar-container', 'my-status');
    // partner avatar group
    let partnerGroup = createAvatarGroup(readyContainer, 'Partner', 'partner-avatar-container', 'partner-status');

    // store references
    avatarImgWelcome = myGroup.img;
    partnerAvatarImg = partnerGroup.img;
    partnerStatusP = partnerGroup.statusP;
    myAvatarUploadHint = myGroup.hint;
    myAvatarLabel = myGroup.label;
    partnerLabel = partnerGroup.label;
    // clicking my avatar opens the hidden input
    myGroup.container.mouseClicked(() => avatarInputFile.elt.click());

    // small start/ready button
    startButtonWelcome = createButton('Ready');
    startButtonWelcome.parent(center);
    startButtonWelcome.mouseClicked(sendReadySignal);
    startButtonWelcome.style('padding', '10px 20px');
    startButtonWelcome.style('font-size', '1.2em');
    startButtonWelcome.style('border-radius', '6px');
    startButtonWelcome.style('border', '2px solid rgb(0,57,149)');
    startButtonWelcome.style('background', 'white');
    startButtonWelcome.style('color', 'rgb(0,57,149)');

    // hidden file input for avatar upload
    avatarInputFile = createFileInput(handleFileSelect);
    avatarInputFile.parent(center);
    avatarInputFile.style('display', 'none');
    }

// helper to create an avatar group
function createAvatarGroup(parent, labelText, containerId, statusId) {
    let wrap = createDiv('');
    wrap.parent(parent);
    wrap.style('display', 'flex');
    wrap.style('flex-direction', 'column');
    wrap.style('align-items', 'center');

    let container = createDiv('');
    container.id(containerId);
    container.parent(wrap);
    container.style('width', '120px');
    container.style('height', '120px');
    container.style('border-radius', '12px');
    container.style('background-color', 'rgba(240,240,240,0.6)');
    container.style('overflow', 'hidden');
    container.style('display', 'flex');
    container.style('align-items', 'center');
    container.style('justify-content', 'center');
    container.style('position', 'relative');

    let img = createImg('', labelText);
    img.parent(container);
    // position image absolutely so it covers the container and any overlay
    img.style('position', 'absolute');
    img.style('top', '0');
    img.style('left', '0');
    img.style('width', '100%');
    img.style('height', '100%');
    img.style('object-fit', 'cover');
    img.style('z-index', '2');
    // hide image until user uploads one so the background stays gray
    img.hide();

    // upload hint overlay for the local/my avatar only
    let hint = null;
    if (labelText.toLowerCase().includes('my')) {
        hint = createP('Upload your Avatar');
        hint.parent(container);
        hint.style('position', 'absolute');
        hint.style('top', '0');
        hint.style('left', '0');
        hint.style('width', '100%');
        hint.style('height', '100%');
        hint.style('display', 'flex');
        hint.style('justify-content', 'center');
        hint.style('align-items', 'center');
        hint.style('font-size', '0.9em');
        hint.style('color', '#333');
        hint.style('margin', '0');
        hint.id('my-upload-hint');
    }

    let label = createP(labelText);
    label.parent(wrap);
    label.style('margin', '6px 0 2px 0');
    label.style('font-size', '0.95em');

    let statusP = createP('');
    statusP.parent(wrap);
    statusP.id(statusId);
    statusP.style('margin', '0');
    statusP.style('font-size', '0.9em');
    statusP.style('color', '#666');
    // hide the default status text area unless server populates it
    statusP.hide();

    return { container, img, statusP, label, hint };
}

function sendReadySignal() {
    myReadyState = !myReadyState;
    if (myReadyState) {
        startButtonWelcome.html('Waiting...');
        startButtonWelcome.attribute('disabled', true);
    } else {
        startButtonWelcome.html('Ready');
        startButtonWelcome.removeAttribute('disabled');
    }
    if (socket) {
        socket.emit('clientReady', { isReady: myReadyState, name: userName });
    }
}

// rename original startGame logic to startDrawingSession
function startDrawingSession() {
    // show canvas and hide welcome
    welcomeDiv.style('display', 'none');
    drawingDiv.style('display', 'block');
    isDrawing = true;
    select('#display-name').html(userName);
    select('#display-city').html(userCity);
    if (avatarSrc) avatarImgWelcome.attribute('src', avatarSrc).show();
}

// handleFileSelect
function handleFileSelect(file) {
    if (file.type === 'image') {
        avatarSrc = file.data;
        avatarImgWelcome.attribute('src', avatarSrc);
        // ensure the image covers the hint overlay
        avatarImgWelcome.style('position', 'absolute');
        avatarImgWelcome.style('top', '0');
        avatarImgWelcome.style('left', '0');
        avatarImgWelcome.style('z-index', '2');
        avatarImgWelcome.show(); 
        if (myAvatarUploadHint) myAvatarUploadHint.hide();
        // notify server of avatar change
        if (socket && socket.connected) {
            socket.emit('updateUser', { avatar: avatarSrc });
        }
        
    } else {
        alert('Please upload an image file.');
    }
}



// =======================================================
// 1.2. Canvas UI
// =======================================================
function createDrawingUIElements() {
    drawingDiv.style('width', canvasWidth + 'px');
    drawingDiv.style('height', canvasHeight + 'px');

    // Create Canvas
    canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(drawingDiv); 
    canvas.style('border-radius', '10px')
    drawing = createGraphics(canvasWidth, canvasHeight);
    drawing.clear(); 
    drawing.background(255);
    

    // --- Sliders (Left) ---
    let sizeWrapper = createDiv('').parent(drawingDiv).class('p5-ui');
    sizeWrapper.style('position', 'absolute')
        .style('top', 'calc(50% + 10px)')
        .style('left', '-100px') 
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center')
        
    // --- Size Slider ---
    brushSizeSlider = createSlider(1, 50, 10)
        .parent(sizeWrapper)
        .style('width', '150px') 
        .style('transform', 'rotate(-90deg) translateX(-50px)') 
        .style('transform-origin', 'left top') 
        .style('margin', '0')
        .style('order', '-1');

    createP('Size')
        .parent(sizeWrapper)
        .style('position', 'absolute') 
        .style('color', '#333')
        .style('bottom', '-55px') 
        .style('margin', '0')
        .style('left', '-7px');

    // --- Opacity Slider ---
    let opacityWrapper = createDiv('').parent(drawingDiv).class('p5-ui');
    opacityWrapper.style('position', 'absolute')
        .style('top', 'calc(50% + 10px)') 
        .style('left', '-50px') 
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center')

    opacitySlider = createSlider(0, 255, 255)
        .parent(opacityWrapper)
        .style('width', '150px') 
        .style('transform', 'rotate(-90deg) translateX(-50px)')
        .style('transform-origin', 'left top')
        .style('margin', '0')
        .style('order', '-1'); 

    createP('Opacity')
        .parent(opacityWrapper)
        .style('color', '#333')
        .style('position', 'absolute') 
        .style('margin', '0')
        .style('left', '-20px')
        .style('bottom', '-54px'); 


    // --- Toolbar (Right Top) ---
    let toolbar = createDiv('');
    toolbar.parent(drawingDiv);
    toolbar.class('p5-ui');
    toolbar.style('top', '20px');
    toolbar.style('right', '-200px');
    toolbar.style('display', 'flex');
    toolbar.style('gap', '15px');
    toolbar.style('background-color', 'rgba(255, 255, 255, 0.8)');
    toolbar.style('border-radius', '30px');
    toolbar.style('padding', '10px 10px');

    // --- icon URLs ---
    const brushIconURL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/brush.svg';
    const eraserIconURL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/eraser.svg';
    const paletteIconURL = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/palette.svg';

    createToolIcon(toolbar, 'brush', 'brush-icon', () => { currentTool = 'brush'; updateToolHighlight(); }, brushIconURL);
    createToolIcon(toolbar, 'eraser', 'eraser-icon', () => { currentTool = 'eraser'; updateToolHighlight(); }, eraserIconURL);
    createToolIcon(toolbar, 'colorpicker', 'colorpicker-icon', () => {
        if (colorPicker) {
            colorPicker = null;
        } else {
            colorPicker = new SimpleColorPicker(width - 180, 110, 180);
        }
    }, paletteIconURL);
    


    // --- ID (Left Top) ---
    let userInfo = createDiv('');
    userInfo.parent(drawingDiv);
    userInfo.class('p5-ui');
    userInfo.style('top', '20px');
    userInfo.style('left', '-90px');
    
    // --- Avatar ---
    let canvasAvatar = createDiv('');
    canvasAvatar.parent(userInfo);
    canvasAvatar.style('width', '50px');
    canvasAvatar.style('height', '50px');
    canvasAvatar.style('border-radius', '50%');
    canvasAvatar.style('background-color', '#ddd');
    canvasAvatar.style('overflow', 'hidden');
    canvasAvatar.style('border', '2px solid white');
    
    let canvasAvatarImg = createImg('', 'Avatar');
    canvasAvatarImg.id('canvas-avatar-img'); 
    canvasAvatarImg.parent(canvasAvatar);
    canvasAvatarImg.style('width', '100%');
    canvasAvatarImg.style('height', '100%');
    canvasAvatarImg.style('object-fit', 'cover');
    canvasAvatarImg.hide();
    
    // --- Info Box ---
    let details = createDiv('');
    details.parent(userInfo);
    details.id('user-details'); 
    details.style('position', 'absolute');
    details.style('top', '0');
    details.style('left', '60px');
    details.style('background-color', 'rgba(125, 175, 255, 0.8)');
    details.style('color', 'white');
    details.style('padding', '8px 20px');
    details.style('border-radius', '5px');
    details.style('font-size', '11px');
    details.html(`<span id="display-name">${userName}</span><br><span id="display-city">${userCity}</span>`);
    details.hide();
    
    // --- Mouse Hover ---
    userInfo.mouseOver(() => details.show());
    userInfo.mouseOut(() => details.hide());


    // --- Right Bottom ---
    let controls = createDiv('');
    controls.parent(drawingDiv);
    controls.class('p5-ui');
    controls.style('bottom', '20px');
    controls.style('right', '-190px');
    controls.style('display', 'flex');
    controls.style('gap', '15px');
    
    let clearButton = createButton('Clear');
    clearButton.parent(controls).mouseClicked(clearCanvas);
    clearButton.style('padding', '10px 20px').style('border-radius', '5px').style('cursor', 'pointer').style('background-color', '#f44336').style('color', 'white');
    
    let saveButton = createButton('Save');
    saveButton.parent(controls).mouseClicked(saveDrawing);
    saveButton.style('padding', '10px 20px').style('border-radius', '5px').style('cursor', 'pointer').style('background-color', 'rgb(0, 57, 149)').style('color', 'white');
}

// --- Helper Function ---
function createToolIcon(parent, toolName, idName, handler, imgSrc) {
    let icon = createDiv('');
    icon.parent(parent);
    icon.id(idName);
    icon.style('width', '40px');
    icon.style('height', '40px');
    icon.style('border-radius', '50%');
    icon.style('background-color', '#eee');
    icon.style('border', '2px solid #333');
    icon.style('cursor', 'pointer');
    icon.style('display', 'flex');
    icon.style('align-items', 'center');
    icon.style('justify-content', 'center');
    icon.mouseClicked(handler);

    if (imgSrc) {
        let img = createImg(imgSrc, toolName + ' icon');
        img.parent(icon);
        img.style('width', '22px');
        img.style('height', '22px');
        img.style('pointer-events', 'none');
    }

    return icon;
}



// =======================================================
// 2. Draw Loop
// =======================================================
function drawBrushShape(x1, y1, x2, y2) {
    let size = brushSizeSlider.value();
    if (brushType === 'round' || brushType === 'sharp') {
        drawing.noStroke();
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distSeg = Math.sqrt(dx * dx + dy * dy);
        let gap = Math.max(1, size * 0.35);
        let steps = Math.ceil(distSeg / gap);
        let alpha = typeof currentOpacity !== 'undefined' ? currentOpacity : opacitySlider.value();
        drawing.fill(currentColor[0], currentColor[1], currentColor[2], alpha);
        for (let i = 0; i <= steps; i++) {
            let t = steps === 0 ? 0 : i / steps;
            let px = lerp(x1, x2, t);
            let py = lerp(y1, y2, t);
            drawing.ellipse(px, py, size, size);
        }
    } else if (brushType === 'organic') {
        for (let i = 0; i < 5; i++) {
            let offset_x = random(-size / 4, size / 4);
            let offset_y = random(-size / 4, size / 4);
            drawing.point(x2 + offset_x, y2 + offset_y);
        }
    }
}

// --- File Upload Handler (Avatar) ---
function handleFileSelect(file) {
    if (file.type === 'image') {
        avatarSrc = file.data;
        avatarImgWelcome.attribute('src', avatarSrc);
        avatarImgWelcome.show();
    } else {
        alert('Please upload an image file.');
    }
}

function startGame() {
    userName = nameInput.value() || "Someone";
    userCity = citySelect.value() || "Somewhere";

    // **Backend Integration Placeholder: Send user information**
    sendUserDataToServer(userName, userCity); 

    // Switch interface
    welcomeDiv.style('display', 'none');
    drawingDiv.style('display', 'block');
    isDrawing = true;
    
    // Update display info
    select('#display-name').html(userName);
    select('#display-city').html(userCity);
    
    if (avatarSrc) {
        select('#canvas-avatar-img').attribute('src', avatarSrc);
        select('#canvas-avatar-img').show();
    }
}

function clearCanvas() {
    drawing.clear();
    drawing.background(255); 
}

function saveDrawing() {
    saveCanvas(canvas, 'where-lines-meet', 'png');
}

function updateToolHighlight() {
    select('#brush-icon').style('border-color', currentTool === 'brush' ? 'rgb(0, 57, 149)' : '#333');
    select('#eraser-icon').style('border-color', currentTool === 'eraser' ? 'rgb(0, 57, 149)' : '#333');
}

// =======================================================
// 3. Backend Integration Placeholders
// =======================================================

function sendUserDataToServer(name, city) {
    console.log(`[Backend Hook] User login: Name=${name}, City=${city}`);
    // TODO: 实现 fetch API 或 WebSocket 连接来发送用户数据
}

function sendLineSegment(px, py, cx, cy, tool, size, color, opacity) {
    // console.log(`[Backend Hook] Sending line: ${px},${py} to ${cx},${cy}`);
    // TODO: 实时发送线段数据给其他用户
}

function sendDrawingUpdate() {
    // console.log("[Backend Hook] Sending full drawing state...");
    // TODO: 定期发送画布快照
}


// --- Color picker ---
class SimpleColorPicker {
    constructor(x, y, size) {
        this.x = x; this.y = y; this.size = size;
        this.radius = size / 2;
        colorMode(HSB, 255);
        this.h = 0; this.s = 255; this.b = 255;
        // internal state for dragging
        this.dragging = false;
        // slider geometry
        this.sliderW = this.size * 0.75;
        this.sliderH = 12;
        this.sbSpacing = 14;
        // slider areas (computed relative to top-left of picker box)
        this.sliderX = this.x - this.sliderW/2;
        this.sliderY = this.y + this.radius + 16;
        this.activeSlider = null; // 's'|'b' or null
    }

    draw() {
        push();
        colorMode(HSB, 255);
        translate(this.x, this.y);
        noStroke();
        // draw hue ring (simple segmented ring)
        let ringR = this.radius;
        let innerR = ringR * 0.62;
        let steps = 120;
        strokeWeight(ringR - innerR);
        for (let i = 0; i < steps; i++) {
            let a1 = map(i, 0, steps, 0, TWO_PI);
            let a2 = map(i+1, 0, steps, 0, TWO_PI);
            let mid = (a1 + a2) / 2;
            let hh = int(map(mid, 0, TWO_PI, 0, 255));
            stroke(hh, 255, 255);
            let x1 = cos(a1) * (innerR + (ringR - innerR)/2);
            let y1 = sin(a1) * (innerR + (ringR - innerR)/2);
            let x2 = cos(a2) * (innerR + (ringR - innerR)/2);
            let y2 = sin(a2) * (innerR + (ringR - innerR)/2);
            line(x1, y1, x2, y2);
        }

        // draw center circle showing current color
        noStroke();
        fill(this.h, this.s, this.b);
        ellipse(0, 0, innerR * 2, innerR * 2);

        // draw a small indicator for current hue on the ring
        stroke(0);
        strokeWeight(2);
        let angle = map(this.h, 0, 255, 0, TWO_PI);
        let ix = cos(angle) * ((innerR + ringR) / 2);
        let iy = sin(angle) * ((innerR + ringR) / 2);
        fill(0);
        ellipse(ix, iy, 6, 6);

        pop();

        // draw SB sliders
        push();
        // ensure we're in HSB for gradient creation
        colorMode(HSB, 255);
        noStroke();
        // draw saturation gradient from 0 -> hueColor
        let sx = this.sliderX;
        let sy = this.sliderY;
        for (let i = 0; i <= this.sliderW; i++) {
            let t = i / this.sliderW;
            let col = color(this.h, t * 255, this.b);
            stroke(col);
            line(sx + i, sy, sx + i, sy + this.sliderH);
        }

        // brightness slider (black -> hue color at full brightness with current saturation)
        let by = sy + this.sbSpacing;
        for (let i = 0; i <= this.sliderW; i++) {
            let t = i / this.sliderW;
            // lerp in HSB between black (0 brightness) and hue at max brightness
            let col = lerpColor(color(0, 0, 0), color(this.h, this.s, 255), t);
            stroke(col);
            line(sx + i, by, sx + i, by + this.sliderH);
        }

        // draw handles in RGB so white/black handles render straightforwardly
        colorMode(RGB, 255);
        let hx = sx + (this.s / 255) * this.sliderW;
        fill(255); stroke(0); strokeWeight(1);
        rect(hx - 4, sy - 3, 8, this.sliderH + 6);
        let bx = sx + (this.b / 255) * this.sliderW;
        fill(255); stroke(0); strokeWeight(1);
        rect(bx - 4, by - 3, 8, this.sliderH + 6);
        pop();
    }

    // local coords
    hitTest(px, py) {
        let dx = px - this.x;
        let dy = py - this.y;
        let d = Math.sqrt(dx*dx + dy*dy);
        return d <= this.radius && d >= this.radius*0.62;
    }

    centerHit(px, py) {
        let dx = px - this.x;
        let dy = py - this.y;
        let d = Math.sqrt(dx*dx + dy*dy);
        return d <= this.radius*0.62;
    }

    onPressed(px, py) {
        // if clicked on ring -> change hue
        if (this.hitTest(px, py)) {
            let a = atan2(py - this.y, px - this.x);
            if (a < 0) a += TWO_PI;
            this.h = int(map(a, 0, TWO_PI, 0, 255));
            this.applyToCurrentColor();
            this.dragging = 'h';
            return true;
        }
        // check sliders
        // saturation slider
        if (px >= this.sliderX && px <= this.sliderX + this.sliderW && py >= this.sliderY && py <= this.sliderY + this.sliderH) {
            let t = (px - this.sliderX) / this.sliderW;
            this.s = int(constrain(t * 255, 0, 255));
            this.applyToCurrentColor();
            this.activeSlider = 's';
            return true;
        }
        // brightness slider (below saturation)
        let by = this.sliderY + this.sbSpacing;
        if (px >= this.sliderX && px <= this.sliderX + this.sliderW && py >= by && py <= by + this.sliderH) {
            let t = (px - this.sliderX) / this.sliderW;
            this.b = int(constrain(t * 255, 0, 255));
            this.applyToCurrentColor();
            this.activeSlider = 'b';
            return true;
        }
        // center -> toggle saturation/brightness via simple clicks
        if (this.centerHit(px, py)) {
            // on center click cycle through S/B presets for simplicity
            if (this.s === 255 && this.b === 255) { this.s = 200; this.b = 230; }
            else if (this.s === 200) { this.s = 120; this.b = 200; }
            else { this.s = 255; this.b = 255; }
            this.applyToCurrentColor();
            this.dragging = 'c';
            return true;
        }
        return false;
    }

    onDragged(px, py) {
        // hue dragging
        if (this.dragging === 'h') {
            let a = atan2(py - this.y, px - this.x);
            if (a < 0) a += TWO_PI;
            this.h = int(map(a, 0, TWO_PI, 0, 255));
            this.applyToCurrentColor();
            return true;
        }
        // sliders
        if (this.activeSlider === 's') {
            let t = (px - this.sliderX) / this.sliderW;
            this.s = int(constrain(t * 255, 0, 255));
            this.applyToCurrentColor();
            return true;
        }
        if (this.activeSlider === 'b') {
            let t = (px - this.sliderX) / this.sliderW;
            this.b = int(constrain(t * 255, 0, 255));
            this.applyToCurrentColor();
            return true;
        }
        return false;
    }

    onReleased() {
        this.dragging = false;
        this.activeSlider = null;
    }

    applyToCurrentColor() {
        colorMode(HSB, 255);
        let c = color(this.h, this.s, this.b);
        // convert to RGB array for currentColor
        colorMode(RGB, 255);
        let r = red(c), g = green(c), b = blue(c);
        currentColor = [r, g, b];
    }
}

// integrate drawing and mouse handlers
function draw() {
    if (!isDrawing) return;

    // 1. Render the drawing buffer
    image(drawing, 0, 0);

    // 2. Real-time brush preview
    if (currentTool === 'brush' && mouseIsPressed && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        noStroke();
        fill(currentColor[0], currentColor[1], currentColor[2], opacitySlider.value());
        ellipse(mouseX, mouseY, brushSizeSlider.value(), brushSizeSlider.value());
    }

    // draw simple picker if present (on top)
    if (colorPicker) colorPicker.draw();
}

function mousePressed() {
    // allow picker to capture clicks
    if (colorPicker) {
        if (colorPicker.onPressed(mouseX, mouseY)) return;
    }
}

function mouseDragged() {
    // if picker is dragging, let it handle
    if (colorPicker) {
        if (colorPicker.onDragged(mouseX, mouseY)) return;
    }

    if (!isDrawing || mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
        
    drawing.strokeWeight(brushSizeSlider.value());
    drawing.strokeCap(brushType === 'round' ? ROUND : SQUARE);
    drawing.noFill();
    currentOpacity = opacitySlider.value();

    if (currentTool === 'brush') {
        drawing.stroke(currentColor[0], currentColor[1], currentColor[2], currentOpacity);
        drawBrushShape(pmouseX, pmouseY, mouseX, mouseY);
    } else if (currentTool === 'eraser') {
        let a = opacitySlider ? opacitySlider.value() : 255;
        drawing.stroke(255, 255, 255, a);
        drawing.line(pmouseX, pmouseY, mouseX, mouseY);
    }

    // send segment to server for partner(s)
    if (socket && socket.connected) {
        socket.emit('drawing', {
            px: pmouseX, py: pmouseY,
            cx: mouseX, cy: mouseY,
            tool: currentTool,
            size: brushSizeSlider ? brushSizeSlider.value() : 4,
            color: currentColor,
            opacity: currentOpacity
        });
    }
}

function mouseReleased() {
    if (colorPicker) colorPicker.onReleased();
}