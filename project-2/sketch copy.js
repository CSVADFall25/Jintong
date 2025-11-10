


let callsTable;
let tooltipGraphics;
let groups = [];
let rects = [];

// Configuration: visual mapping ranges (scaled down to reduce overlap)
const MIN_RECT_W = 28;   // was 40
const MAX_RECT_W = 48;   // was 80
const MIN_RECT_H = 30;   // was 50
const MAX_RECT_H = 216;  // was 360
const MIN_HALO = 12;     // was 20
const MAX_HALO = 132;    // was 220
// flower sizing (radius)
const MIN_FLOWER_R = 48;
const MAX_FLOWER_R = 200; // increased so flowers are larger per user request
// global scale to shrink or enlarge all flowers (set to 0.5 to make them half-size)
// user requested 1.5x increase from previous 0.5 -> 0.75
const FLOWER_SCALE = 0.75;
// vertical scale for ellipses (height scale > 1 makes them taller, < 1 makes them flattened)
const ELLIPSE_V_SCALE = 1.15;

function preload() {
  callsTable = loadTable('data/dailyCalls_test.csv', 'csv', 'header');
}


function setup() {
  createCanvas(1920, 1080);
  tooltipGraphics = createGraphics(2000, 400);
  // make randomness deterministic so the generated layout is reproducible
  randomSeed(12345);

  // --- build date map for 2025-07-01 .. 2025-09-30 ---
  let startDate = new Date(2025, 6, 1); // July 1, 2025
  let endDate = new Date(2025, 8, 30);  // Sept 30, 2025

  function isoKey(d) { return `${d.getFullYear()}-${nf(d.getMonth()+1,2)}-${nf(d.getDate(),2)}`; }

  // gather entries per date
  let dateMap = {};
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    let dateStr = callsTable.getString(r, 'date');
    if (!dateStr) continue;
    let parts = dateStr.split('/');
    if (parts.length < 3) continue;
    let m = int(parts[0]);
    let d = int(parts[1]);
    let y = int(parts[2]);
    let rowDate = new Date(y, m - 1, d);
    if (rowDate < startDate || rowDate > endDate) continue;

    let dur = parseFloat(String(callsTable.getString(r, 'duration_min') || '0').trim());
    if (isNaN(dur)) dur = 0;
    let td = parseFloat(String(callsTable.getString(r, 'time_difference_hours') || '0').trim());
    if (isNaN(td)) td = 0;
    let mood = String(callsTable.getString(r, 'mood') || '').trim().toLowerCase();

    let k = isoKey(rowDate);
    if (!dateMap[k]) dateMap[k] = [];
    dateMap[k].push({date: rowDate, duration: dur, timeDiff: td, mood: mood});
  }

  // build 18 groups of 5 consecutive days each starting from startDate
  groups = [];
  let groupsCount = 18;
  for (let gi = 0; gi < groupsCount; gi++) {
    let groupDays = [];
    for (let di = 0; di < 5; di++) {
      let d = new Date(startDate);
      d.setDate(startDate.getDate() + gi * 5 + di);
      if (d > endDate) break;
      let k = isoKey(d);
      let entries = dateMap[k] ? dateMap[k].slice() : [];
      groupDays.push({date: d, entries: entries});
    }
    groups.push(groupDays);
  }

  // compute totals for size mapping
  let totals = groups.map(g => g.reduce((s, day) => s + day.entries.reduce((ss, e) => ss + e.duration, 0), 0));
  let maxTotal = max(totals.length ? totals : [1]);

  // layout: place flowers randomly within canvas, non-overlapping, keep at least 10px from edges
  rects = [];
  const BOUNDARY_MARGIN = 20; // ensure flower edge >= 20px from canvas edge
  const PLACEMENT_PADDING = 8; // space between flowers (bigger to reduce overlap)

  // helper: try to place a circle of radius r without overlapping placed ones
  // Will attempt several reduced-size scales if a full-size placement fails.
  function placeCircle(radius) {
    const scales = [1.0, 0.95, 0.9, 0.85, 0.8];
    const triesPerScale = 4000;
    for (let scale of scales) {
      let r = radius * scale;
      let tries = 0;
      while (tries < triesPerScale) {
        // respect ellipse vertical scaling for y-bounds
        let x = random(BOUNDARY_MARGIN + r, width - BOUNDARY_MARGIN - r);
        let y = random(BOUNDARY_MARGIN + r * ELLIPSE_V_SCALE, height - BOUNDARY_MARGIN - r * ELLIPSE_V_SCALE);
        let ok = true;
        for (let p of rects) {
          let minDist = r + p.r + PLACEMENT_PADDING;
          if (dist(x, y, p.cx, p.cy) < minDist) { ok = false; break; }
        }
        if (ok) return {x: x, y: y, usedRadius: r};
        tries++;
      }
    }
    return null;
  }

  for (let i = 0; i < groups.length; i++) {
    let g = groups[i];
    // flatten all entries in the 5-day group and sort by duration desc
    let allEntries = [];
    for (let day of g) for (let e of day.entries) allEntries.push(e);
    allEntries.sort((a,b) => b.duration - a.duration);
    let total = totals[i] || 0;
    // avg time difference across entries in group
    let tdSum = 0, tdCount = 0;
    for (let day of g) for (let e of day.entries) { tdSum += e.timeDiff; tdCount++; }
    let avgTd = tdCount ? tdSum / tdCount : 0;

  let r = map(total, 0, maxTotal, MIN_FLOWER_R, MAX_FLOWER_R);
  r = constrain(r, MIN_FLOWER_R, MAX_FLOWER_R);
  // apply global scale requested by user (e.g., 0.5 to shrink by half)
  r = r * FLOWER_SCALE;

    // attempt random non-overlapping placement; if a reduced radius is used, store that usedRadius
    let pos = placeCircle(r);
    let cx, cy, usedR = r;
    if (pos) {
      cx = pos.x; cy = pos.y; usedR = pos.usedRadius || r;
    } else {
      // fallback: try to force-place by searching a coarse grid for minimum overlap position
      let best = null; let bestOverlap = Infinity;
      for (let gx = BOUNDARY_MARGIN; gx <= width - BOUNDARY_MARGIN; gx += 20) {
        for (let gy = BOUNDARY_MARGIN; gy <= height - BOUNDARY_MARGIN; gy += 20) {
          let tooCloseToEdge = (gx < BOUNDARY_MARGIN + r) || (gx > width - BOUNDARY_MARGIN - r) || (gy < BOUNDARY_MARGIN + r * ELLIPSE_V_SCALE) || (gy > height - BOUNDARY_MARGIN - r * ELLIPSE_V_SCALE);
          if (tooCloseToEdge) continue;
          let overlap = 0;
          for (let p of rects) {
            let d = dist(gx, gy, p.cx, p.cy);
            let minDist = r + p.r + PLACEMENT_PADDING;
            if (d < minDist) overlap += (minDist - d);
          }
          if (overlap < bestOverlap) { bestOverlap = overlap; best = {x: gx, y: gy}; }
          if (bestOverlap === 0) break;
        }
        if (bestOverlap === 0) break;
      }
      if (best) {
        cx = best.x; cy = best.y;
      } else {
        // last resort: center
        cx = width/2; cy = height/2;
      }
      console.warn('Could not place flower', i, 'without overlap; used fallback placement (overlap minimized)');
    }

    let halo = map(avgTd, 0, 24, MIN_HALO, MAX_HALO);
    rects.push({cx: cx, cy: cy, r: usedR, halo: halo, groupIndex: i, entries: allEntries, total: total});
  }
  // stop continuous redraw — render once and stay static
  noLoop();

  // --- diagnostic logs to verify grouping correctness ---
  console.log('Groups built:', groups.length);
  for (let gi = 0; gi < groups.length; gi++) {
    let gd = groups[gi];
    if (!gd || gd.length === 0) { console.log('Group', gi, 'empty'); continue; }
    let first = gd[0].date;
    let last = gd[gd.length-1].date;
    // count entries in this group
    let cnt = 0; let sumDur = 0;
    for (let day of gd) { cnt += day.entries.length; for (let e of day.entries) sumDur += e.duration; }
    console.log(`Group ${gi}: ${first.toDateString()} → ${last.toDateString()} | days:${gd.length} entries:${cnt} totalDuration:${sumDur}`);
  }
}


function draw() {
  // ensure draw's random calls are deterministic as well
  randomSeed(12345);
  // Draw a gradient background
  let c1 = color(255, 255, 255); // white
  let c2 = color(248, 182, 67); // light yellow
  for (let y = 0; y < height; y++){
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
 
  // draw flowers
  noStroke();

  const moodColors = {
    // placeholder; actual values set below after helper declaration
  };

  // helper: convert HSL (h in degrees, s and l in percent) to RGB 0-255
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  // build moodColors using the values provided (interpret >255 first value as HSL)
  (function buildMoodColors() {
    // sadness - blue (45,14,112)
    moodColors['sadness'] = color(45, 14, 112);
    // anxiety - black(0,0,0)
    moodColors['anxiety'] = color(0, 0, 0);
    // anger - red（207，61，85）
    moodColors['anger'] = color(207, 61, 85);
    // longing - yellow(216,186,88)
    moodColors['longing'] = color(216, 186, 88);
    // calm - blue（78，128，223）
    moodColors['calm'] = color(78, 128, 223);
  // care - warm yellow/gold similar to reference
  moodColors['care'] = color(240, 210, 70);
    // happiness - grey pink(200,187,197)
    moodColors['happiness'] = color(200, 187, 197);
    // intimacy - pink（251，81，107）
    moodColors['intimacy'] = color(251, 81, 107);
    // missing - 半透明(255，255，255，100)
    moodColors['missing'] = color(255, 255, 255, 50);
  })();

  for (let i = 0; i < rects.length; i++) {
    let f = rects[i];
    let g = groups[f.groupIndex];
    if (!g) continue;
    // New flower rendering: collect all entries sorted by duration (we stored them in f.entries)
    let entriesAll = f.entries || [];
    let n = entriesAll.length;
    if (n === 0) {
      // draw a faint small circle for empty groups
      fill(240);
      ellipse(f.cx, f.cy, f.r * 0.6, f.r * 0.6 * ELLIPSE_V_SCALE);
      continue;
    }

    // compute ring thickness per entry proportional to duration
    let outerR = f.r;
    // soften colors by mixing toward white for pastel look
    let softMix = 0.28;
    let softColors = entriesAll.map(e => {
      let base = moodColors[e.mood] || color(200);
      return lerpColor(base, color(255), softMix);
    });

    // draw a soft blurred halo using an offscreen graphics buffer for a smoother '晕染' effect
    let haloColor = softColors[0] || color(255);
    // create a graphics buffer sized relative to flower radius
    let haloPad = 2.5; // how much larger than the flower the halo area is
    let gw = ceil((f.r * haloPad) * 2);
    let gh = ceil((f.r * haloPad) * 2 * ELLIPSE_V_SCALE);
    let gbuf = createGraphics(gw, gh);
    gbuf.clear();
    gbuf.noStroke();
    // draw a solid ellipse in the buffer with the halo color and moderate alpha
    let hc = color(red(haloColor), green(haloColor), blue(haloColor), 220);
    gbuf.fill(hc);
    gbuf.ellipse(gw/2, gh/2, f.r * 2 * 1.4, f.r * 2 * ELLIPSE_V_SCALE * 1.4);
    // blur amount scaled with flower size
    let blurAmt = map(f.r, MIN_FLOWER_R * FLOWER_SCALE, MAX_FLOWER_R * FLOWER_SCALE, 6, 30);
    blurAmt = constrain(blurAmt, 4, 40);
    gbuf.filter(BLUR, blurAmt);
    imageMode(CENTER);
    image(gbuf, f.cx, f.cy);

    let steps = 36; // more steps for a smoother transition
    for (let j = 0; j < n; j++) {
      let entry = entriesAll[j];
      // thickness proportional to entry duration relative to group total
      let thickness = (f.total > 0) ? (entry.duration / f.total) * f.r : (f.r / n);
      // ensure a minimum visible thickness
      thickness = max(thickness, f.r * 0.03);
      let innerR = outerR - thickness;
      if (innerR < 0) innerR = 0;
      let outerColor = softColors[j] || (moodColors[entry.mood] || color(200));
      // inner color: next entry's soft color or white
      let innerColor = (j + 1 < n) ? (softColors[j+1] || color(240)) : color(255);

      // draw gradient band between outerR and innerR with alpha blending
      for (let s = 0; s < steps; s++) {
        let t = s / (steps - 1);
        let baseCol = lerpColor(outerColor, innerColor, t);
        // slightly reduce alpha toward inner to soften overlaps
        let a = map(t, 0, 1, 230, 160);
        fill(red(baseCol), green(baseCol), blue(baseCol), a);
        let rad = outerR - t * (outerR - innerR);
        noStroke();
        ellipse(f.cx, f.cy, rad * 2, rad * 2 * ELLIPSE_V_SCALE);
      }

      outerR = innerR; // next inner band
    }
  }
}
