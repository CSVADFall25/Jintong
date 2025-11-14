let callsTable;
let tooltipEl = null; // HTML tooltip overlay
let groups = [];
let rects = [];
let hoveredRectIndex = -1;
let hoveredRingIndex = -1;
let hoveredIsCore = false; // true when hovering the flower core (aggregate)
let hoveredSun = false; // true when hovering over the sun
let draggingIndex = -1;
let dragDX = 0;
let dragDY = 0;
let moodColors = {};
let paperTex = null; // old-paper noise overlay
let isCleared = false; // when true, show blank canvas and skip drawing flowers
// Sun visualization state
let sunRays = []; // {day: Date, length: number, color: p5.Color, angle: number}
let sunConfig = { active: false, startDate: null, endDate: null, cx: 0, cy: 0, radius: 0 };
let isDraggingSun = false;
let sunDragDX = 0;
let sunDragDY = 0;
// Stem visualization state
let stems = []; // [{groupIndex, points:[{x,y}], leaves:[{t:number,size:number}]}]
// Cloud visualization state
let clouds = []; // [{timezone, avgTD, daysCount, cx, cy, points:[{dx,dy}], pickR, alpha}]
let hoveredCloudIndex = -1;
let draggingCloudIndex = -1;
let cloudDragDX = 0;
let cloudDragDY = 0;
// Text overlay state
let textItems = []; // {id, x, y, text, size, color, selected}
let activeTextIndex = -1;
let textDragDX = 0;
let textDragDY = 0;
let isResizingText = false;
let resizeStartMouse = {x:0,y:0};
let resizeStartSize = 0;
// Inline text input element (for adding new text directly on canvas)
let activeTextInput = null; // DOM input element when adding text
const TEXT_HANDLE_SIZE = 10;
const TEXT_DELETE_W = 44;
const TEXT_DELETE_H = 18;

// flower sizing (radius)
const MIN_FLOWER_R = 48;
const MAX_FLOWER_R = 160; // reduced to 4/5 of previous 200 per user request
// global scale to shrink or enlarge all flowers (set to 0.5 to make them half-size)
// user requested 1.5x increase from previous 0.5 -> 0.75
const FLOWER_SCALE = 0.85; // slightly larger (+~8%) than 0.7875
// non-linear size emphasis for flowers by total duration
// < 1 makes big totals grow faster (more separation); > 1 compresses big ones
const FLOWER_SIZE_EXP = 0.8;
// vertical scale for ellipses (height scale > 1 makes them taller, < 1 makes them flattened)
const ELLIPSE_V_SCALE = 1.15;
// paper overlay config
const ENABLE_PAPER_OVERLAY = true;
// petal layout config (replacing concentric rings)
const PETAL_MIN_R = 8;              // minimum petal radius
const PETAL_MAX_R_FACTOR = 0.28;    // max petal radius = flower usedR * this factor
const PETAL_SOFT_MIX = 0.25;        // mix toward white for pastel petals
const CORE_R_FACTOR = 0.18;         // central core radius as fraction of used flower radius
const ORBIT_INNER_FACTOR = 0.55;    // base orbit radius relative to used flower radius before adjustment
// Allow some bleed when dragging so petals can cross the canvas edge slightly
const DRAG_EDGE_BLEED = 16; // px
// Shadow configuration
const SHADOW_DX = 3;          // horizontal offset for petal/core shadow
const SHADOW_DY = 2;          // vertical offset for petal/core shadow
const SHADOW_ALPHA_CORE = 40; // opacity for core shadow (lighter)
const SHADOW_ALPHA_PETAL = 28; // opacity for petal shadow (lighter)

function preload() {
  callsTable = loadTable('data/dailyCalls_test.csv', 'csv', 'header');
  // Preload paper texture image
  if (ENABLE_PAPER_OVERLAY) {
    paperTex = loadImage('white-paper-texture.jpg');
  }
  // Expose for other scripts that may expect global access
  if (typeof window !== 'undefined') {
    window.callsTable = callsTable;
  }
}


function setup() {
  let canvas = createCanvas(1125, 750);
  canvas.parent('canvas-panel');
  randomSeed(12345);

  // Create a floating HTML tooltip overlay attached to <body>
  if (!tooltipEl && typeof document !== 'undefined') {
    tooltipEl = document.createElement('div');
    Object.assign(tooltipEl.style, {
      position: 'absolute',
      maxWidth: '420px',
      background: 'rgba(0,0,0,0.86)',
      color: '#fff',
      border: '1px solid #c8c8c8',
      borderRadius: '6px',
      padding: '10px 12px',
      fontSize: '11px',
      lineHeight: '16px',
      fontFamily: 'Arial, sans-serif',
      zIndex: '9999',
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'none',
      whiteSpace: 'normal',
      wordBreak: 'break-word'
    });
    document.body.appendChild(tooltipEl);
  }

  // Initialize mood colors once
  moodColors['sadness'] = color(38, 34, 39);
  moodColors['anxiety'] = color(251, 183, 59);
  moodColors['anger'] = color(246, 91, 66);
  moodColors['longing'] = color(72, 88, 183);
  moodColors['calm'] = color(174, 189, 228);
  moodColors['care'] = color(67, 162, 132);
  moodColors['happiness'] = color(228, 197, 125);
  moodColors['intimacy'] = color(216, 123, 135);
  moodColors['missing'] = color(255, 255, 255, 180);

  // Build initial flowers with a sensible default window from data
  const {minDate, maxDate} = getDataDateBounds();
  let initStart = minDate ? new Date(minDate) : new Date(2025, 6, 1);
  let initEnd = minDate ? new Date(minDate) : new Date(2025, 6, 1);
  if (minDate) { initEnd.setDate(initStart.getDate()+59); if (maxDate && initEnd > maxDate) initEnd = new Date(maxDate); }
  updateFlowers(initStart, initEnd);

  // Initialize UI controls after data is ready
  if (typeof setupUI === 'function') setupUI();

  // Wire up Clear and Save buttons
  const clearBtn = (typeof document !== 'undefined') ? document.getElementById('clear-btn') : null;
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      isCleared = true;
      groups = [];
      rects = [];
      textItems = [];
      stems = [];
      // clear sun state
      sunRays = [];
      sunConfig.active = false;
      // clear clouds
      clouds = [];
      hoveredCloudIndex = -1;
      draggingCloudIndex = -1;
      hoveredRectIndex = -1;
      hoveredRingIndex = -1;
      hoveredIsCore = false;
      draggingIndex = -1;
      if (tooltipEl) tooltipEl.style.display = 'none';
      redraw();
    });
  }
  const saveBtn = (typeof document !== 'undefined') ? document.getElementById('save-btn') : null;
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (tooltipEl) tooltipEl.style.display = 'none'; // HTML overlay not part of canvas
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2,'0');
      const d = String(now.getDate()).padStart(2,'0');
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');
      const fname = `our-garden-${y}${m}${d}-${hh}${mm}${ss}`;
      saveCanvas(fname, 'png');
    });
  }
  const addTextBtn = (typeof document !== 'undefined') ? document.getElementById('add-text-btn') : null;
  if (addTextBtn) {
    addTextBtn.addEventListener('click', () => {
      if (activeTextInput) return; // already open
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      createInlineTextInput(centerX - 80, centerY - 24);
    });
  }

  // Paper texture already loaded in preload()
}// helper to get overall min/max dates from dataset
function getDataDateBounds() {
  let minDate = null, maxDate = null;
  if (!callsTable) return {minDate, maxDate};
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    const ds = callsTable.getString(r, 'date');
    if (!ds) continue;
    const parts = ds.split('/');
    if (parts.length < 3) continue;
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    if (!minDate || dt < minDate) minDate = dt;
    if (!maxDate || dt > maxDate) maxDate = dt;
  }
  return {minDate, maxDate};
}

// Create an inline input box for adding text directly on the canvas.
function createInlineTextInput(x, y) {
  if (typeof document === 'undefined') return;
  const panel = document.getElementById('canvas-panel');
  if (!panel) return;
  // Convert canvas coordinates to page coordinates (panel is positioned relative)
  const canvasEl = panel.querySelector('canvas');
  if (!canvasEl) return;
  const rect = canvasEl.getBoundingClientRect();
  // page position
  const pageX = rect.left + window.scrollX + x;
  const pageY = rect.top + window.scrollY + y;

  const input = document.createElement('input');
  activeTextInput = input;
  Object.assign(input.style, {
    position: 'absolute',
    left: pageX + 'px',
    top: pageY + 'px',
    width: '160px',
    padding: '6px 8px',
    fontSize: '20px',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #444',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.92)',
    color: '#111',
    zIndex: '10000'
  });
  input.placeholder = 'Type and Enter...';
  panel.appendChild(input);
  input.focus();

  const commit = () => {
    if (!activeTextInput) return;
    const val = activeTextInput.value.trim();
    const localX = x; // already in canvas coords
    const localY = y;
    activeTextInput.remove();
    activeTextInput = null;
    if (val) {
      textItems.push({
        id: Date.now(),
        x: localX,
        y: localY,
        text: val,
        size: 28,
        color: '#111',
        selected: false
      });
      isCleared = false;
      redraw();
    } else {
      redraw();
    }
  };
  const cancel = () => {
    if (!activeTextInput) return;
    activeTextInput.remove();
    activeTextInput = null;
    redraw();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => { commit(); });
}

// Regenerate flowers for a given date range; 5-day grouping with remainder
function updateFlowers(startDate, endDate) {
  isCleared = false; // generating content un-clears the canvas
  function isoKey(d) { return `${d.getFullYear()}-${nf(d.getMonth()+1,2)}-${nf(d.getDate(),2)}`; }

  // Build per-day entries within range
  let dateMap = {};
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    const ds = callsTable.getString(r, 'date');
    if (!ds) continue;
    const ps = ds.split('/');
    if (ps.length < 3) continue;
    const m = int(ps[0]);
    const d = int(ps[1]);
    const y = int(ps[2]);
    const dt = new Date(y, m - 1, d);
    if (dt < startDate || dt > endDate) continue;
  const dur = parseFloat(String(callsTable.getString(r, 'duration_min') || '0').trim());
  const td = parseFloat(String(callsTable.getString(r, 'time_difference_hours') || '0').trim());
  const mood = String(callsTable.getString(r, 'mood') || '').trim().toLowerCase();
  const notes = String(callsTable.getString(r, 'notes') || '').trim();
  const dayTimeSelf = String(callsTable.getString(r, 'day_time_self') || '').trim();
  const initiator = String(callsTable.getString(r, 'initiator') || '').trim().toLowerCase();
    const k = isoKey(dt);
    if (!dateMap[k]) dateMap[k] = [];
  dateMap[k].push({date: dt, duration: isNaN(dur)?0:dur, timeDiff: isNaN(td)?0:td, mood, notes, dayTime: dayTimeSelf, initiator});
  }

  // 5-day groups
  groups = [];
  const dayCount = Math.floor((endDate - startDate) / (1000*60*60*24)) + 1;
  const groupsCount = Math.ceil(dayCount / 5);
  for (let gi = 0; gi < groupsCount; gi++) {
    const gdays = [];
    const daysThis = (gi === groupsCount-1 && dayCount % 5 !== 0) ? (dayCount % 5) : 5;
    for (let di = 0; di < daysThis; di++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + gi*5 + di);
      if (d > endDate) break;
      const k = isoKey(d);
      const entries = dateMap[k] ? dateMap[k].slice() : [];
      gdays.push({date: d, entries});
    }
    groups.push(gdays);
  }

  // Totals and placements
  const totals = groups.map(g => g.reduce((s, day) => s + day.entries.reduce((ss, e) => ss + e.duration, 0), 0));
  const maxTotal = max(totals.length ? totals : [1]);
  rects = [];
  const BOUNDARY_MARGIN = 20;
  const PLACEMENT_PADDING = 8;
  const TOP_FORBIDDEN_Y = height / 6; // keep flowers in lower 5/6 of canvas

  function placeCircle(radius) {
    const scales = [1.0, 0.95, 0.9, 0.85, 0.8];
    const triesPerScale = 1500;
    for (let scale of scales) {
      let r = radius * scale;
      let tries = 0;
      while (tries < triesPerScale) {
        let x = random(BOUNDARY_MARGIN + r, width - BOUNDARY_MARGIN - r);
        // restrict Y to lower 5/6 (account for ellipse vertical radius)
        let minY = max(TOP_FORBIDDEN_Y + r * ELLIPSE_V_SCALE, BOUNDARY_MARGIN + r * ELLIPSE_V_SCALE);
        let y = random(minY, height - BOUNDARY_MARGIN - r * ELLIPSE_V_SCALE);
        let ok = true;
        for (let p of rects) {
          let minDist = r + p.r + PLACEMENT_PADDING;
          if (dist(x, y, p.cx, p.cy) < minDist) { ok = false; break; }
        }
        if (ok) return {x, y, usedRadius: r};
        tries++;
      }
    }
    return null;
  }

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const all = [];
    for (let day of g) for (let e of day.entries) all.push(e);
  // Sort by date ascending so earliest dates will become inner rings later
  all.sort((a,b) => a.date - b.date);
  const total = totals[i] || 0;

  // Size by total duration with an optional non-linear emphasis
  let norm = (maxTotal > 0) ? (total / maxTotal) : 0;
  let eased = Math.pow(norm, FLOWER_SIZE_EXP);
  let rBase = MIN_FLOWER_R + eased * (MAX_FLOWER_R - MIN_FLOWER_R);
  let r = constrain(rBase, MIN_FLOWER_R, MAX_FLOWER_R) * FLOWER_SCALE;
    const pos = placeCircle(r);
    let cx, cy, usedR = r;
    if (pos) { cx = pos.x; cy = pos.y; usedR = pos.usedRadius || r; }
    else {
      // coarse fallback search
      let best = null, bestOverlap = Infinity;
      for (let gx = BOUNDARY_MARGIN; gx <= width - BOUNDARY_MARGIN; gx += 50) {
        for (let gy = max(TOP_FORBIDDEN_Y + r * ELLIPSE_V_SCALE, BOUNDARY_MARGIN + r * ELLIPSE_V_SCALE); gy <= height - BOUNDARY_MARGIN; gy += 50) {
          let tooEdge = (gx < BOUNDARY_MARGIN + r) || (gx > width - BOUNDARY_MARGIN - r) || (gy < BOUNDARY_MARGIN + r*ELLIPSE_V_SCALE) || (gy > height - BOUNDARY_MARGIN - r*ELLIPSE_V_SCALE);
          if (tooEdge) continue;
          let overlap = 0;
          for (let p of rects) {
            let d = dist(gx, gy, p.cx, p.cy);
            let minDist = r + p.r + PLACEMENT_PADDING;
            if (d < minDist) overlap += (minDist - d);
          }
          if (overlap < bestOverlap) { bestOverlap = overlap; best = {x: gx, y: gy}; }
        }
      }
      if (best) { cx = best.x; cy = best.y; }
      else { cx = width/2; cy = max(height/2, TOP_FORBIDDEN_Y + r * ELLIPSE_V_SCALE + 10); }
    }
  rects.push({cx, cy, r: usedR, groupIndex: i, entries: all, total});
    // Precompute petal layout (angles & petal radii) for hover detection and drawing.
    const fRef = rects[rects.length - 1];
    const nEntries = all.length;
    fRef.petals = [];
    if (nEntries > 0) {
      const durationsLocal = all.map(e => (isNaN(e.duration)?0:e.duration));
      const minDurLocal = durationsLocal.reduce((m,v)=> v<m? v : m, durationsLocal[0]);
      const maxDurLocal = durationsLocal.reduce((m,v)=> v>m? v : m, durationsLocal[0]);
      const maxPetalRAbs = usedR * PETAL_MAX_R_FACTOR;
      for (let pi = 0; pi < nEntries; pi++) {
        let durVal = durationsLocal[pi];
        let petalR;
        if (Math.abs(maxDurLocal - minDurLocal) < 0.0001) petalR = (PETAL_MIN_R + maxPetalRAbs) * 0.5; else {
          petalR = map(durVal, minDurLocal, maxDurLocal, PETAL_MIN_R, maxPetalRAbs);
        }
        // angle evenly distributed; earliest date (index 0) at top (-PI/2)
        const angle = -HALF_PI + TWO_PI * (pi / nEntries);
        fRef.petals.push({angle, petalR, entryIndex: pi});
      }
      // Adjust orbit radius so petals fit inside flower bounding radius
      const maxPetalRCurrent = fRef.petals.reduce((m,p)=> p.petalR>m? p.petalR:m, 0);
      let orbitR = usedR * ORBIT_INNER_FACTOR;
      if (orbitR + maxPetalRCurrent > usedR) orbitR = usedR - maxPetalRCurrent - 2; // keep inside with small gap
      fRef.orbitR = max(orbitR, maxPetalRCurrent + 4);
      fRef.coreR = usedR * CORE_R_FACTOR;
    } else {
      fRef.orbitR = 0;
      fRef.coreR = usedR * CORE_R_FACTOR * 0.6;
    }
  }

  loop(); // ensure interaction
}


function draw() {
  // If cleared, show blank canvas and exit early
  if (isCleared) {
    background(255);
    if (tooltipEl) tooltipEl.style.display = 'none';
    return;
  }
  // ensure draw's random calls are deterministic as well
  randomSeed(12345);
  // Draw a gradient background with four colors
  let c1 = color(146, 171, 210); // blue
  let c2 = color(255, 255, 255); // white
  let c3 = color(248, 182, 67); // yellow
  let c4 = color(124, 146, 108); // green
  
  for (let y = 0; y < height; y++){
    let inter = map(y, 0, height, 0, 1);
    let c;
    if (inter < 0.33) {
      // blend from c1 to c2
      let t = map(inter, 0, 0.33, 0, 1);
      c = lerpColor(c1, c2, t);
    } else if (inter < 0.67) {
      // blend from c2 to c3
      let t = map(inter, 0.33, 0.67, 0, 1);
      c = lerpColor(c2, c3, t);
    } else {
      // blend from c3 to c4
      let t = map(inter, 0.67, 1, 0, 1);
      c = lerpColor(c3, c4, t);
    }
    stroke(c);
    line(0, y, width, y);
  }
  // Draw sun (behind flowers) if active
  if (sunConfig.active) {
    drawSun();
  }
  // Draw stems (behind flowers, above background/sun)
  if (stems.length) {
    drawStems();
  }
  // Draw clouds (above stems, below flowers)
  if (clouds.length) {
    drawClouds();
  }
 
  // draw flowers (petal layout)
  noStroke();

  for (let i = 0; i < rects.length; i++) {
    let f = rects[i];
    let g = groups[f.groupIndex];
    if (!g) continue;
  // Collect entries sorted by date ascending (stored in f.entries)
  let entriesAll = f.entries || [];
  let n = entriesAll.length;
    if (n === 0) {
      // empty group placeholder
      fill(240);
      ellipse(f.cx, f.cy, f.r * 0.5, f.r * 0.5);
      continue;
    }
  // Draw central core (solid black per user request)
  // Core shadow
  noStroke();
  fill(0,0,0,SHADOW_ALPHA_CORE);
  ellipse(f.cx + SHADOW_DX, f.cy + SHADOW_DY, f.coreR*2, f.coreR*2);
  // Core
  fill(0);
  ellipse(f.cx, f.cy, f.coreR*2, f.coreR*2);
    // Draw petals
    for (let p of (f.petals || [])) {
      const entry = entriesAll[p.entryIndex];
      const moodCol = moodColors[entry.mood] || color(170);
      const petalColor = lerpColor(moodCol, color(255), PETAL_SOFT_MIX);
      const px = f.cx + f.orbitR * Math.cos(p.angle);
      const py = f.cy + f.orbitR * Math.sin(p.angle);
      // Petal shadow
      noStroke();
      fill(0,0,0,SHADOW_ALPHA_PETAL);
      ellipse(px + SHADOW_DX, py + SHADOW_DY, p.petalR*2, p.petalR*2);
      // Petal fill
      fill(petalColor);
      ellipse(px, py, p.petalR*2, p.petalR*2);
    }
  }
  
  // Overlay old-paper texture on top of artwork with 30% transparency
  if (ENABLE_PAPER_OVERLAY && paperTex) {
    push();
    // Use canvas context directly for reliable alpha control
    drawingContext.globalAlpha = 0.3;
    image(paperTex, 0, 0, width, height);
    pop();
  }

  // Draw tooltip if hovering over a flower
  displayTooltip();

  // Draw text overlays on top
  if (textItems.length) {
    push();
    textAlign(LEFT, TOP);
    for (let i = 0; i < textItems.length; i++) {
      const t = textItems[i];
      push();
      noStroke();
      fill(0);
      textSize(t.size || 24);
      // text bounding
      const tw = textWidth(t.text || '');
      const th = (t.size || 24) * 1.2;
      // draw text
      fill(t.color || '#111');
      text(t.text, t.x, t.y);
      // selection outline and resize handle
      if (t.selected) {
        noFill();
        stroke(60, 60, 60);
        strokeWeight(1);
        rect(t.x - 4, t.y - 4, tw + 8, th + 8);
        // handle at bottom-right
        const hx = t.x + tw + 6;
        const hy = t.y + th + 6;
        noStroke();
        fill(60);
        rect(hx - TEXT_HANDLE_SIZE/2, hy - TEXT_HANDLE_SIZE/2, TEXT_HANDLE_SIZE, TEXT_HANDLE_SIZE);
        // delete button at top-right
        const dx = t.x + tw + 6;
        const dy = t.y - (TEXT_DELETE_H + 6);
        fill(200, 50, 50);
        rect(dx, dy, TEXT_DELETE_W, TEXT_DELETE_H, 3);
        fill(255);
        textSize(10);
        textAlign(CENTER, CENTER);
        text('Delete', dx + TEXT_DELETE_W/2, dy + TEXT_DELETE_H/2);
        // restore text align for main loop
        textAlign(LEFT, TOP);
      }
      pop();
    }
    pop();
  }
}

function mouseMoved() {
  // If dragging, suppress hover updates to avoid flicker
  if (draggingIndex !== -1 || activeTextIndex !== -1 || isResizingText) {
    if (tooltipEl) tooltipEl.style.display = 'none';
    return false;
  }
  // Cursor hint for sun dragging
  if (sunConfig.active) {
    const withinSun = dist(mouseX, mouseY, sunConfig.cx, sunConfig.cy) <= sunConfig.radius && mouseY <= sunConfig.cy;
    if (withinSun) {
      cursor('move');
    }
    hoveredSun = withinSun; // track hover state for tooltip
  }
  // Check if mouse is over any petal
  hoveredRectIndex = -1;
  hoveredRingIndex = -1;
  hoveredIsCore = false;
  hoveredCloudIndex = -1;

  // Cloud hover detection (approximate with bounding radius)
  if (clouds.length) {
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const pr = c.pickR || 50;
      if (dist(mouseX, mouseY, c.cx, c.cy) <= pr) { hoveredCloudIndex = i; break; }
    }
  }
  
  for (let i = 0; i < rects.length; i++) {
    let f = rects[i];
    // Quick bounding check (circular) to skip far groups
    const distCenter = dist(mouseX, mouseY, f.cx, f.cy);
    if (distCenter > f.r + 40) continue;
    // precise petal hit test
    let hitPetal = false;
    if (f.petals && f.petals.length) {
      for (let p of f.petals) {
        const px = f.cx + f.orbitR * Math.cos(p.angle);
        const py = f.cy + f.orbitR * Math.sin(p.angle);
        if (dist(mouseX, mouseY, px, py) <= p.petalR) {
          hoveredRectIndex = i;
          hoveredRingIndex = p.entryIndex; // per-petal entry index
          hitPetal = true;
          break;
        }
      }
      if (hitPetal) break;
    }
    // Core hover (aggregate) if not on a petal but inside core circle
    if (!hitPetal && dist(mouseX, mouseY, f.cx, f.cy) <= f.coreR) {
      hoveredRectIndex = i;
      hoveredRingIndex = -1; // indicates aggregate
      hoveredIsCore = true;
      break;
    }
  }
  // Update cursor when hovering text handle/box
  let overSomething = false;
  for (let i = textItems.length - 1; i >= 0; i--) {
    const t = textItems[i];
    const sz = t.size || 24;
    textSize(sz);
    const tw = textWidth(t.text || '');
    const th = sz * 1.2;
    const withinBox = mouseX >= t.x && mouseX <= t.x + tw && mouseY >= t.y && mouseY <= t.y + th;
    const hx = t.x + tw + 6;
    const hy = t.y + th + 6;
    const withinHandle = Math.abs(mouseX - hx) <= TEXT_HANDLE_SIZE/2 && Math.abs(mouseY - hy) <= TEXT_HANDLE_SIZE/2;
    const dx = t.x + tw + 6;
    const dy = t.y - (TEXT_DELETE_H + 6);
    const withinDelete = t.selected && mouseX >= dx && mouseX <= dx + TEXT_DELETE_W && mouseY >= dy && mouseY <= dy + TEXT_DELETE_H;
    if (withinDelete) { cursor('pointer'); overSomething = true; break; }
    if (t.selected && withinHandle) { cursor('nwse-resize'); overSomething = true; break; }
    if (withinBox) { cursor('move'); overSomething = true; break; }
  }
  if (!overSomething) cursor('default');
  return false;
}

function mousePressed() {
  // First, check text items for selection/drag/resize (topmost first)
  for (let i = textItems.length - 1; i >= 0; i--) {
    const t = textItems[i];
    const sz = t.size || 24;
    textSize(sz);
    const tw = textWidth(t.text || '');
    const th = sz * 1.2;
    // delete button
    const dx = t.x + tw + 6;
    const dy = t.y - (TEXT_DELETE_H + 6);
    const inDelete = t.selected && mouseX >= dx && mouseX <= dx + TEXT_DELETE_W && mouseY >= dy && mouseY <= dy + TEXT_DELETE_H;
    if (inDelete) {
      textItems.splice(i, 1);
      activeTextIndex = -1;
      isResizingText = false;
      if (tooltipEl) tooltipEl.style.display = 'none';
      return;
    }
    const hx = t.x + tw + 6;
    const hy = t.y + th + 6;
    const withinHandle = Math.abs(mouseX - hx) <= TEXT_HANDLE_SIZE/2 && Math.abs(mouseY - hy) <= TEXT_HANDLE_SIZE/2;
    const withinBox = mouseX >= t.x && mouseX <= t.x + tw && mouseY >= t.y && mouseY <= t.y + th;
    if (withinHandle) {
      // select and start resizing
      textItems.forEach(it => it.selected = false);
      t.selected = true;
      activeTextIndex = i;
      isResizingText = true;
      resizeStartMouse = {x: mouseX, y: mouseY};
      resizeStartSize = sz;
      if (tooltipEl) tooltipEl.style.display = 'none';
      return;
    }
    if (withinBox) {
      // select and start dragging
      textItems.forEach(it => it.selected = false);
      t.selected = true;
      activeTextIndex = i;
      textDragDX = t.x - mouseX;
      textDragDY = t.y - mouseY;
      if (tooltipEl) tooltipEl.style.display = 'none';
      return;
    }
  }

  // Sun drag pick (after text, before flowers)
  if (sunConfig.active) {
    const withinSun = dist(mouseX, mouseY, sunConfig.cx, sunConfig.cy) <= sunConfig.radius && mouseY <= sunConfig.cy;
    if (withinSun) {
      isDraggingSun = true;
      sunDragDX = sunConfig.cx - mouseX;
      sunDragDY = sunConfig.cy - mouseY;
      if (tooltipEl) tooltipEl.style.display = 'none';
      hoveredSun = false; // disable hover while dragging
      return;
    }
  }

  // Cloud drag pick (after sun, before flowers)
  if (clouds.length) {
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      const pr = c.pickR || 50;
      if (dist(mouseX, mouseY, c.cx, c.cy) <= pr) {
        draggingCloudIndex = i;
        cloudDragDX = c.cx - mouseX;
        cloudDragDY = c.cy - mouseY;
        if (tooltipEl) tooltipEl.style.display = 'none';
        return;
      }
    }
  }

  // pick topmost flower under mouse (iterate from end)
  for (let i = rects.length - 1; i >= 0; i--) {
    const f = rects[i];
    // For petal layout, use symmetric circle hit for picking
    const dCircle = dist(mouseX, mouseY, f.cx, f.cy);
    if (dCircle <= f.r) {
      draggingIndex = i;
      dragDX = f.cx - mouseX;
      dragDY = f.cy - mouseY;
      if (tooltipEl) tooltipEl.style.display = 'none';
      break;
    }
  }
}

function mouseDragged() {
  // drag/resize text first
  if (activeTextIndex !== -1) {
    const t = textItems[activeTextIndex];
    if (isResizingText) {
      const distStart = dist(resizeStartMouse.x, resizeStartMouse.y, t.x, t.y);
      const distNow = dist(mouseX, mouseY, t.x, t.y);
      const delta = distNow - distStart;
      t.size = constrain(resizeStartSize + delta * 0.5, 10, 200);
    } else {
      // keep full text box inside canvas
      const sz = t.size || 24;
      textSize(sz);
      const tw = textWidth(t.text || '');
      const th = sz * 1.2;
      t.x = constrain(mouseX + textDragDX, 0, max(0, width - tw));
      t.y = constrain(mouseY + textDragDY, 0, max(0, height - th));
    }
    return false;
  }

  // Drag sun if picked
  if (isDraggingSun && sunConfig.active) {
    const r = sunConfig.radius || (width * 0.18);
    sunConfig.cx = constrain(mouseX + sunDragDX, r, width - r);
    sunConfig.cy = constrain(mouseY + sunDragDY, r, height - r);
    return false;
  }

  if (draggingIndex !== -1) {
    const f = rects[draggingIndex];
    // Use actual visual extent of petals (orbit radius + max petal) for boundary, not the flower bounding r.
    // This lets the center move closer to edge while keeping petals visible.
    const petalExtent = (f.orbitR || 0) + (f.petals && f.petals.length ? f.petals.reduce((m,p)=>p.petalR>m?p.petalR:m,0) : 0);
    const pad = max(0, petalExtent + 2 - DRAG_EDGE_BLEED); // allow slight edge bleed
    f.cx = constrain(mouseX + dragDX, pad, width - pad);
    f.cy = constrain(mouseY + dragDY, pad, height - pad);
    return false;
  }

  // Drag cloud if picked
  if (draggingCloudIndex !== -1) {
    const c = clouds[draggingCloudIndex];
    c.cx = constrain(mouseX + cloudDragDX, 0, width);
    c.cy = constrain(mouseY + cloudDragDY, 0, height);
    return false;
  }
}

function mouseReleased() {
  draggingIndex = -1;
  isResizingText = false;
  isDraggingSun = false;
  draggingCloudIndex = -1;
  // recompute sun hover state on release
  if (sunConfig.active) {
    hoveredSun = (dist(mouseX, mouseY, sunConfig.cx, sunConfig.cy) <= sunConfig.radius && mouseY <= sunConfig.cy);
  }
  // if released without moving off text, keep selection
}

function displayTooltip() {
  if (!tooltipEl) return;
  // Sun tooltip has priority if hovering over sun
  if (sunConfig.active && hoveredSun) {
    const counts = sunConfig.counts || {morning:0,noon:0,afternoon:0,evening:0,night:0,other:0};
    const total = counts.morning + counts.noon + counts.afternoon + counts.evening + counts.night + (counts.other||0);
    const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    tooltipEl.innerHTML = `
      <div><strong>Time-of-day counts</strong></div>
      <div><strong>Total calls:</strong> ${esc(total)}</div>
      <div><strong>Morning:</strong> ${esc(counts.morning)}</div>
      <div><strong>Noon:</strong> ${esc(counts.noon)}</div>
      <div><strong>Afternoon:</strong> ${esc(counts.afternoon)}</div>
      <div><strong>Evening:</strong> ${esc(counts.evening)}</div>
      <div><strong>Night:</strong> ${esc(counts.night)}</div>
      ${counts.other ? `<div><strong>Other:</strong> ${esc(counts.other)}</div>` : ''}
    `;
    const rect = (this && this._renderer && this._renderer.elt) ? this._renderer.elt.getBoundingClientRect() : (document.querySelector('#canvas-panel canvas') || {getBoundingClientRect:()=>({left:0,top:0})}).getBoundingClientRect();
    let pageX = rect.left + window.scrollX + mouseX + 15;
    let pageY = rect.top + window.scrollY + mouseY - 10;
    if (pageX < 4) pageX = 4;
    if (pageY < 4) pageY = 4;
    tooltipEl.style.left = pageX + 'px';
    tooltipEl.style.top = pageY + 'px';
    tooltipEl.style.display = 'block';
    return;
  }
  // Cloud tooltip if not over a flower and a cloud is hovered
  if ((hoveredRectIndex === -1 || (hoveredRingIndex === -1 && !hoveredIsCore)) && hoveredCloudIndex !== -1 && clouds[hoveredCloudIndex]) {
    const c = clouds[hoveredCloudIndex];
    const escC = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    tooltipEl.innerHTML = `
      <div><strong>Timezone:</strong> ${escC(c.timezone)}</div>
      <div><strong>Days:</strong> ${escC(c.daysCount)}</div>
      <div><strong>Time Diff (max/avg):</strong> ${escC((c.maxTD||0).toFixed(1))} h / ${escC((c.avgTD||0).toFixed(2))} h</div>
    `;
    const rect = (this && this._renderer && this._renderer.elt) ? this._renderer.elt.getBoundingClientRect() : (document.querySelector('#canvas-panel canvas') || {getBoundingClientRect:()=>({left:0,top:0})}).getBoundingClientRect();
    let pageX = rect.left + window.scrollX + mouseX + 15;
    let pageY = rect.top + window.scrollY + mouseY - 10;
    if (pageX < 4) pageX = 4;
    if (pageY < 4) pageY = 4;
    tooltipEl.style.left = pageX + 'px';
    tooltipEl.style.top = pageY + 'px';
    tooltipEl.style.display = 'block';
    return;
  }
  if (hoveredRectIndex === -1 || (hoveredRingIndex === -1 && !hoveredIsCore)) {
    tooltipEl.style.display = 'none';
    return;
  }
  
  let f = rects[hoveredRectIndex];
  let entriesAll = f.entries || [];
  
  // Build HTML tooltip content (escape HTML)
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if (hoveredIsCore) {
    let totalStr = (f.total || 0).toFixed(2);
    let callsCount = entriesAll.length;
    // initiator breakdown
    let himCalls = 0, meCalls = 0;
    for (let e of entriesAll) {
      const who = String(e.initiator || '').toLowerCase();
      if (who === 'him') himCalls++; else if (who === 'me') meCalls++;
    }
    tooltipEl.innerHTML = `
      <div><strong>Total Duration:</strong> ${esc(totalStr)} min</div>
      <div><strong>Calls:</strong> ${esc(callsCount)}</div>
      <div><strong>Call Initiation:</strong> Him ${esc(himCalls)} vs Me ${esc(meCalls)}</div>
    `;
  } else {
    if (hoveredRingIndex >= entriesAll.length) { tooltipEl.style.display = 'none'; return; }
    let entry = entriesAll[hoveredRingIndex];
    let dateStr = entry.date ? entry.date.toLocaleDateString('en-US') : 'N/A';
    // Extract day_time_self from original CSV row if available
    let timeStr = 'N/A';
    if (entry.rawTime) {
      timeStr = entry.rawTime;
    } else if (entry.dayTime){
      timeStr = entry.dayTime;
    }
    let durationStr = entry.duration ? entry.duration.toFixed(2) : '0';
    let moodStr = entry.mood ? entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1) : 'N/A';
    let notesStr = entry.notes && entry.notes.trim() ? entry.notes.trim() : 'No notes';
    tooltipEl.innerHTML = `
      <div><strong>Date:</strong> ${esc(dateStr)}</div>
      <div><strong>Time:</strong> ${esc(timeStr)}</div>
      <div><strong>Duration:</strong> ${esc(durationStr)} min</div>
      <div><strong>Mood:</strong> ${esc(moodStr)}</div>
      <div><strong>Notes:</strong> ${esc(notesStr)}</div>
    `;
  }

  // Position near mouse in page coordinates so it can extend beyond canvas freely
  const rect = (this && this._renderer && this._renderer.elt) ? this._renderer.elt.getBoundingClientRect() : (document.querySelector('#canvas-panel canvas') || {getBoundingClientRect:()=>({left:0,top:0})}).getBoundingClientRect();
  let pageX = rect.left + window.scrollX + mouseX + 15;
  let pageY = rect.top + window.scrollY + mouseY - 10;
  if (pageX < 4) pageX = 4;
  if (pageY < 4) pageY = 4;
  tooltipEl.style.left = pageX + 'px';
  tooltipEl.style.top = pageY + 'px';
  tooltipEl.style.display = 'block';
}

// Generate stems from each flower center toward off-canvas with random curvature.
function generateStem() {
  if (!rects || rects.length === 0) return;
  stems = [];
  // build stems per flower group
  for (let i = 0; i < rects.length; i++) {
    const f = rects[i];
    const g = groups[f.groupIndex] || [];

    // Only downward directions: straight down, down-left, or down-right
  const margin = 30; // shorter stems overall
  const ty = height + margin; // exit near bottom edge
    // choose target x with bias left/center/right
    const choice = floor(random(3)); // 0:left-down,1:down,2:right-down
    let tx;
    if (choice === 0) {
      tx = random(-margin, f.cx - width*0.15);
    } else if (choice === 2) {
      tx = random(f.cx + width*0.15, width + margin);
    } else {
      tx = random(f.cx - width*0.05, f.cx + width*0.05);
    }

    // Build polyline points from start(0,0) to target relative to flower center with curvature
    const start = {x: 0, y: 0};
    const end = {x: tx - f.cx, y: ty - f.cy};
    const segs = 5; // number of segments
    const pts = [];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      // base along straight line
      let px = lerp(start.x, end.x, t);
      let py = lerp(start.y, end.y, t);
      // perpendicular jitter for curvature
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len; // normal vector
      const ny = dx / len;
      const amp = (1 - Math.abs(0.5 - t) * 2) * 60; // bell-shaped amplitude, max mid
      const jitter = (noise(i*7.1 + s*2.33) - 0.5) * 2; // -1..1
      px += nx * amp * jitter;
      py += ny * amp * jitter;
      pts.push({x: px, y: py});
    }

    // initiator counts
    let countHim = 0, countMe = 0;
    for (let day of g) {
      for (let e of (day.entries||[])) {
        const who = String(e.initiator || '').trim().toLowerCase();
        if (who === 'him') countHim++; else if (who === 'me') countMe++;
      }
    }
    // Build leaves arrays: left side for 'him' (black), right side for 'me' (green)
  const leaves = [];
  const tStart = 0.2, tEnd = 0.7; // shift leaves upward, closer to petals (same span 0.5)
    if (countHim > 0) {
      for (let li = 0; li < countHim; li++) {
        const t = lerp(tStart, tEnd, countHim===1 ? 0.5 : li/(countHim-1));
        leaves.push({t, size: 24, side: 'left', col: color(0)});
      }
    }
    if (countMe > 0) {
      for (let li = 0; li < countMe; li++) {
        const t = lerp(tStart, tEnd, countMe===1 ? 0.5 : li/(countMe-1));
        leaves.push({t, size: 24, side: 'right', col: color(70,170,90)});
      }
    }

    stems.push({groupIndex: f.groupIndex, points: pts, leaves});
  }
  isCleared = false;
}

function drawStems() {
  push();
  noFill();
  stroke(0); // black stem
  strokeWeight(2.2);
  for (let s of stems) {
    // find current anchor based on group index -> rect
    const rectIdx = rects.findIndex(r => r.groupIndex === s.groupIndex);
    if (rectIdx === -1) continue;
    const f = rects[rectIdx];
    // draw curved stem using curveVertex
    beginShape();
    // add extra endpoints for curve smoothness
    const pts = s.points;
    // offset by current center
    const ax = f.cx, ay = f.cy;
    // duplicate first and last for curveVertex smoothing
    const first = pts[0];
    const last = pts[pts.length-1];
    curveVertex(ax + first.x, ay + first.y);
    for (let p of pts) {
      curveVertex(ax + p.x, ay + p.y);
    }
    curveVertex(ax + last.x, ay + last.y);
    endShape();

    // draw leaves along the polyline
    for (let lf of (s.leaves || [])) {
      const t = constrain(lf.t, 0, 1);
      const idx = floor(t * (pts.length - 1));
      const tseg = t * (pts.length - 1) - idx;
      const p0 = pts[Math.max(0, idx)];
      const p1 = pts[Math.min(pts.length - 1, idx + 1)];
  const lx = ax + lerp(p0.x, p1.x, tseg);
  const ly = ay + lerp(p0.y, p1.y, tseg);
  const ang = Math.atan2((ay + p1.y) - (ay + p0.y), (ax + p1.x) - (ax + p0.x));
  // keep base on stem; tilt leaf to left/right side
  const sideSign = lf.side === 'left' ? -1 : 1;
  const sideAngle = 0.45; // ~26 degrees tilt
  drawLeaf(lx, ly, ang + sideSign * sideAngle, lf.size || 16, lf.col || color(0));
    }
  }
  pop();
}

function drawLeaf(cx, cy, angle, size, fillCol) {
  push();
  translate(cx, cy);
  rotate(angle);
  // simple symmetric leaf: two bezier lobes
  const c = fillCol || color(0);
  fill(c);
  stroke(c);
  strokeWeight(1);
  const w = size * 0.45;
  const h = size;
  beginShape();
  vertex(0, 0);
  bezierVertex(w*0.6, -h*0.15, w*0.8, -h*0.55, 0, -h);
  bezierVertex(-w*0.8, -h*0.55, -w*0.6, -h*0.15, 0, 0);
  endShape(CLOSE);
  // leaf vein
  stroke(255);
  line(0, 0, 0, -h*0.95);
  pop();
}

// Generate sun rays based on day_time_self aggregated durations per day
function generateSun(startDate, endDate) {
  if (!callsTable) return;
  sunRays = [];
  sunConfig.active = true;
  sunConfig.startDate = startDate;
  sunConfig.endDate = endDate;
  // initialize default position and radius at top center
  sunConfig.radius = width * 0.18;
  sunConfig.cx = width / 2;
  sunConfig.cy = sunConfig.radius + 6;
  sunConfig.counts = {morning:0,noon:0,afternoon:0,evening:0,night:0,other:0};

  // Color mapping for times of day
  const timeColors = {
    morning: color(255,255,255), // white
    noon: color(255,165,0),      // orange
    afternoon: color(255,215,0), // gold
    evening: color(50,80,160),   // blue-ish
    night: color(0,0,0)          // black
  };
  const defaultColor = color(180);

  // Build per-date entries in range
  function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  const perDateEntries = {};
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    const ds = callsTable.getString(r, 'date');
    if (!ds) continue;
    const ps = ds.split('/');
    if (ps.length < 3) continue;
    const m = parseInt(ps[0],10);
    const dd = parseInt(ps[1],10);
    const y = parseInt(ps[2],10);
    const dt = new Date(y, m-1, dd);
    if (dt < startDate || dt > endDate) continue;
    const dayTime = String(callsTable.getString(r, 'day_time_self')||'').trim().toLowerCase();
    const dur = parseFloat(String(callsTable.getString(r, 'duration_min')||'0').trim());
    const k = iso(dt);
    if (!perDateEntries[k]) perDateEntries[k] = [];
    perDateEntries[k].push({dayTime, duration: isNaN(dur)?0:dur});
    // increment call count per bucket (by occurrence, not duration)
    if (dayTime === 'morning' || dayTime === 'noon' || dayTime === 'afternoon' || dayTime === 'evening' || dayTime === 'night') {
      sunConfig.counts[dayTime] = (sunConfig.counts[dayTime] || 0) + 1;
    } else {
      sunConfig.counts.other = (sunConfig.counts.other || 0) + 1;
    }
  }

  // Generate list of days (inclusive)
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
    days.push(new Date(d));
  }
  const totalDays = days.length;
  // Angles spanning a top fan from ~200° to ~340° (i.e., leaning downward into the canvas)
  const startAngle = radians(200);
  const endAngle = radians(340);

  const raysTmp = [];
  for (let i=0;i<days.length;i++) {
    const d = days[i];
    const k = iso(d);
    const entries = perDateEntries[k]||[];
    // sum durations by bucket
    const byBucket = {};
    for (let e of entries) {
      const b = e.dayTime || 'other';
      byBucket[b] = (byBucket[b]||0) + e.duration;
    }
    const bucketKeys = Object.keys(byBucket);
    const baseAngle = totalDays<=1 ? (startAngle+endAngle)/2 : lerp(startAngle, endAngle, i/(totalDays-1));
    const spread = radians(10);
    if (bucketKeys.length === 0) {
      // no data for the day: still draw a faint ray to keep cadence
      const length = max(width, height) * 1.2; // extend beyond canvas
      const col = color(200,200,200,120);
      raysTmp.push({day: new Date(d), length, color: col, angle: baseAngle});
    } else {
      for (let bi=0; bi<bucketKeys.length; bi++) {
        const bk = bucketKeys[bi];
        // fixed long rays: extend out of the canvas regardless of duration
        const length = max(width, height) * 1.2; // extend beyond canvas
        let col = timeColors[bk] || defaultColor;
        if (bk !== 'night') col = lerpColor(col, color(255), 0.15);
        const angleOffset = bucketKeys.length>1 ? map(bi, 0, bucketKeys.length-1, -spread/2, spread/2) : 0;
        raysTmp.push({day: new Date(d), length, color: col, angle: baseAngle + angleOffset});
      }
    }
  }
  sunRays = raysTmp;
  isCleared = false; // ensure canvas is not blank
}

function drawSun() {
  // Sun semi-circle parameters (use current state)
  const sunRadius = sunConfig.radius || (width * 0.18);
  const cx = sunConfig.cx || (width/2);
  const cy = sunConfig.cy || (sunRadius + 6); // slight margin from top

  // Draw semi-circle with a simple radial gradient
  noStroke();
  for (let rStep = sunRadius; rStep >= 1; rStep--) {
    const t = rStep / sunRadius;
    const col = lerpColor(color(255,230,140), color(255,180,60), 1 - t);
    fill(col);
    arc(cx, cy, rStep*2, rStep*2, PI, TWO_PI, PIE);
  }

  // Rays from sun perimeter outward
  strokeWeight(2);
  for (let ray of sunRays) {
    stroke(ray.color);
    const ax = cx + Math.cos(ray.angle) * (sunRadius - 2);
    const ay = cy + Math.sin(ray.angle) * (sunRadius - 2);
    const bx = cx + Math.cos(ray.angle) * (sunRadius + ray.length);
    const by = cy + Math.sin(ray.angle) * (sunRadius + ray.length);
    line(ax, ay, bx, by);
  }
}

// CLOUD VISUALIZATION FUNCTIONS
function generateClouds(startDate, endDate) {
  if (!callsTable) return;
  clouds = [];
  hoveredCloudIndex = -1;
  const tzMap = {};
  const daySetPerTZ = {};
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    const ds = callsTable.getString(r, 'date');
    if (!ds) continue;
    const ps = ds.split('/');
    if (ps.length < 3) continue;
    const m = parseInt(ps[0],10);
    const d = parseInt(ps[1],10);
    const y = parseInt(ps[2],10);
    const dt = new Date(y, m-1, d);
    if (dt < startDate || dt > endDate) continue;
    const tz = String(callsTable.getString(r, 'time_zone')||'Unknown').trim();
    const td = parseFloat(String(callsTable.getString(r, 'time_difference_hours')||'0').trim());
    if (!tzMap[tz]) tzMap[tz] = {sum:0,count:0,max:0};
    const tdVal = isNaN(td)?0:td;
    tzMap[tz].sum += tdVal;
    tzMap[tz].count += 1;
    tzMap[tz].max = Math.max(tzMap[tz].max, tdVal);
    const dayKey = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (!daySetPerTZ[tz]) daySetPerTZ[tz] = new Set();
    daySetPerTZ[tz].add(dayKey);
  }
  const tzKeys = Object.keys(tzMap);
  if (!tzKeys.length) { isCleared = false; return; }
  const topBandY = height * 0.18; // slightly lower for larger clouds
  const spacingX = width / (tzKeys.length + 1);
  for (let i = 0; i < tzKeys.length; i++) {
    const tz = tzKeys[i];
    const stats = tzMap[tz];
    const avgTD = stats.count ? (stats.sum / stats.count) : 0; // used only for tooltip now
    const maxTD = stats.max || 0;
    const alpha = computeCloudAlpha(maxTD);
    // Blob shape parameters independent of data (varied slightly per cloud only)
    const baseR = 96 * random(0.95, 1.25); // overall size decoupled from data
    const noiseAmp = 0.16 * random(0.9, 1.15); // puffiness
    const noiseFreq = 1.2 * random(0.9, 1.1); // complexity
    const cx = spacingX * (i+1);
    const cy = topBandY + random(-18, 18);
    // Sample outline points
    const pts = [];
    const steps = 140;
    const stretchX = 1.6; // horizontal elongation for cloud
    const flatBottom = 0.25; // bottom flatten factor
    const seed = random(1000);
    for (let s = 0; s < steps; s++) {
      const ang = (s / steps) * TWO_PI;
      const n = noise(Math.cos(ang) * noiseFreq + seed, Math.sin(ang) * noiseFreq + seed*0.37);
      let r = baseR * (1 + (n - 0.5) * 2 * noiseAmp);
      let dx = Math.cos(ang) * r * stretchX;
      let dy = Math.sin(ang) * r;
      // gently flatten the bottom hemisphere
      if (dy > r * flatBottom) dy = lerp(dy, r * flatBottom, 0.6);
      pts.push({dx, dy});
    }
    const pickR = baseR * 1.6; // generous pick radius for dragging/hover
    clouds.push({timezone: tz, avgTD, maxTD, daysCount: (daySetPerTZ[tz]?.size)||0, cx, cy, points: pts, pickR, alpha});
  }
  isCleared = false;
}

// Map time difference (hours) to desired opacity points:
// 0h->50%, 2h->70%, 3h->80%, 12h->100%
function computeCloudAlpha(tdHours) {
  const t = constrain(tdHours, 0, 12);
  const stops = [
    {h: 0,  o: 0.50},
    {h: 2,  o: 0.70},
    {h: 3,  o: 0.80},
    {h: 12, o: 1.00}
  ];
  // exact match
  for (let i = 0; i < stops.length; i++) {
    if (abs(t - stops[i].h) < 1e-6) return Math.round(stops[i].o * 255);
  }
  // find segment
  let prev = stops[0], next = stops[stops.length-1];
  for (let i = 1; i < stops.length; i++) {
    if (t < stops[i].h) { next = stops[i]; prev = stops[i-1]; break; }
  }
  const u = (t - prev.h) / (next.h - prev.h);
  const op = lerp(prev.o, next.o, u);
  return Math.round(op * 255);
}

function drawClouds() {
  push();
  noStroke();
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    // Pure white cloud fill (no gradient tint)
    fill(255,255,255,c.alpha);
    if (c.points && c.points.length) {
      beginShape();
      vertex(c.cx + c.points[0].dx, c.cy + c.points[0].dy);
      for (let k = 1; k < c.points.length; k++) {
        const p = c.points[k];
        vertex(c.cx + p.dx, c.cy + p.dy);
      }
      endShape(CLOSE);
    }
  }
  pop();
}

