// UI wiring: date range selection with dataset-aware constraints and flower generation

function setupUI() {
  const startDateSelect = document.getElementById('start-date-select');
  const endDateSelect = document.getElementById('end-date-select');
  const generateBtn = document.getElementById('generate-flower');
  const headerSelect = document.getElementById('header-select');
  const genSunBtn = document.getElementById('generate-sun');
  const genStemBtn = document.getElementById('generate-stem');
  const genCloudBtn = document.getElementById('generate-cloud');

  // Ensure data is loaded before initializing.
  // BUG FIX: top-level `let callsTable` in sketch.js is NOT on window, so `window.callsTable` was undefined.
  // Use the lexical variable directly.
  if (!callsTable || callsTable.getRowCount() === 0) {
    setTimeout(setupUI, 200);
    return;
  }

  // Determine min/max dates from data and collect all valid dates
  let minDate = null, maxDate = null;
  let validDates = new Set();
  for (let r = 0; r < callsTable.getRowCount(); r++) {
    const ds = callsTable.getString(r, 'date');
    if (!ds) continue;
    const parts = ds.split('/');
    if (parts.length < 3) continue;
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    const fmt = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  validDates.add(fmt);
    if (!minDate || dt < minDate) minDate = dt;
    if (!maxDate || dt > maxDate) maxDate = dt;
  }

  if (startDateSelect && endDateSelect && minDate && maxDate) {
    // sort valid dates ascending
    const validArr = Array.from(validDates).sort(); // YYYY-MM-DD strings sort lexicographically
    // populate selects
    startDateSelect.innerHTML = '';
    endDateSelect.innerHTML = '';
    for (const d of validArr) {
      const opt1 = document.createElement('option'); opt1.value = d; opt1.textContent = d;
      const opt2 = document.createElement('option'); opt2.value = d; opt2.textContent = d;
      startDateSelect.appendChild(opt1);
      endDateSelect.appendChild(opt2);
    }
    // default: start at first, end at last within 60 days window
    const first = new Date(validArr[0] + 'T00:00:00');
    const windowEnd = new Date(first); windowEnd.setDate(windowEnd.getDate() + 59);
    let endIndex = validArr.length - 1;
    for (let i = 0; i < validArr.length; i++) {
      const d = new Date(validArr[i] + 'T00:00:00');
      if (d > windowEnd) { endIndex = Math.max(0, i - 1); break; }
    }
    startDateSelect.selectedIndex = 0;
    endDateSelect.selectedIndex = Math.max(0, endIndex);

    // expose for validation
    window.validDatesSet = new Set(validArr);
  }

  if (generateBtn) generateBtn.addEventListener('click', onGenerateClicked);

  // Populate category select and wire buttons
  if (headerSelect) {
    // Clear and add options
    headerSelect.innerHTML = '';
    const options = [
      { label: 'Time of day', value: 'day_time_self' },
      { label: 'Initiator', value: 'initiator' },
      { label: 'Time difference (hours)', value: 'time_difference_hours' },
    ];
    for (const opt of options) {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      headerSelect.appendChild(el);
    }
    headerSelect.value = 'day_time_self';
  }

  // Enable Sun generation only when category is day_time_self
  function refreshButtonsByCategory() {
    const cat = headerSelect ? headerSelect.value : '';
    const cloudBtn = document.getElementById('generate-cloud');
    // default all disabled states first
    if (genSunBtn) { genSunBtn.disabled = true; genSunBtn.title = ''; }
    if (genStemBtn) { genStemBtn.disabled = true; genStemBtn.title = ''; }
    if (cloudBtn) { cloudBtn.disabled = true; cloudBtn.title = ''; }
    // Sun gating
    if (cat === 'day_time_self') {
      if (genSunBtn) { genSunBtn.disabled = false; genSunBtn.title = ''; }
      if (genStemBtn) { genStemBtn.disabled = true; genStemBtn.title = 'Disabled for current category'; }
      if (cloudBtn) { cloudBtn.disabled = true; cloudBtn.title = 'Disabled for current category'; }
    } else if (cat === 'initiator') {
      if (genStemBtn) { genStemBtn.disabled = false; genStemBtn.title = ''; }
      if (genSunBtn) { genSunBtn.disabled = true; genSunBtn.title = 'Disabled for current category'; }
      if (cloudBtn) { cloudBtn.disabled = true; cloudBtn.title = 'Disabled for current category'; }
    } else if (cat === 'time_difference_hours') {
      if (cloudBtn) { cloudBtn.disabled = false; cloudBtn.title = ''; }
      if (genSunBtn) { genSunBtn.disabled = true; genSunBtn.title = 'Disabled for current category'; }
      if (genStemBtn) { genStemBtn.disabled = true; genStemBtn.title = 'Disabled for current category'; }
    } else {
      // Unknown category (should not happen) -> disable all
      if (genSunBtn) { genSunBtn.disabled = true; genSunBtn.title = 'Select "Time of day"'; }
      if (genStemBtn) { genStemBtn.disabled = true; genStemBtn.title = 'Select "Initiator"'; }
      if (cloudBtn) { cloudBtn.disabled = true; cloudBtn.title = 'Select "Time difference"'; }
    }
  }
  if (headerSelect) headerSelect.addEventListener('change', refreshButtonsByCategory);
  refreshButtonsByCategory();

  if (genSunBtn) {
    genSunBtn.addEventListener('click', () => {
      const sv = startDateSelect?.value;
      const ev = endDateSelect?.value;
      if (!sv || !ev) { alert('Please select both start and end dates'); return; }
      const startDate = new Date(sv + 'T00:00:00');
      const endDate = new Date(ev + 'T00:00:00');
      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) { alert('Invalid date range'); return; }
      const diffDays = Math.floor((endDate - startDate) / (1000*60*60*24));
      if (diffDays > 62) { alert('Maximum date range is 2 months (≤62 days).'); return; }
      if (typeof generateSun === 'function') {
        generateSun(startDate, endDate);
      } else {
        console.warn('generateSun is not available');
      }
    });
  }
  if (genStemBtn) {
    genStemBtn.addEventListener('click', () => {
      // Stem relies on existing flowers; ensure some groups exist
      if (typeof generateStem === 'function') {
        generateStem();
      } else {
        console.warn('generateStem is not available');
      }
    });
  }
  if (genCloudBtn) {
    genCloudBtn.addEventListener('click', () => {
      const startDateSelect = document.getElementById('start-date-select');
      const endDateSelect = document.getElementById('end-date-select');
      const sv = startDateSelect?.value;
      const ev = endDateSelect?.value;
      if (!sv || !ev) { alert('Please select both start and end dates'); return; }
      const startDate = new Date(sv + 'T00:00:00');
      const endDate = new Date(ev + 'T00:00:00');
      if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) { alert('Invalid date range'); return; }
      const diffDays = Math.floor((endDate - startDate) / (1000*60*60*24));
      if (diffDays > 62) { alert('Maximum date range is 2 months (≤62 days).'); return; }
      if (typeof generateClouds === 'function') {
        generateClouds(startDate, endDate);
      } else {
        console.warn('generateClouds is not available');
      }
    });
  }
}

function onGenerateClicked() {
  const startDateSelect = document.getElementById('start-date-select');
  const endDateSelect = document.getElementById('end-date-select');
  if (!startDateSelect || !endDateSelect) return;

  const sv = startDateSelect.value;
  const ev = endDateSelect.value;
  if (!sv || !ev) { alert('Please select both start and end dates'); return; }
  
  const startDate = new Date(sv + 'T00:00:00');
  const endDate = new Date(ev + 'T00:00:00');
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) { alert('Invalid date range'); return; }
  
  // Check that at least one date has data
  const validDates = window.validDatesSet;
  if (validDates) {
    let hasData = false;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (validDates.has(fmt)) { hasData = true; break; }
    }
    if (!hasData) { alert('Selected date range contains no data from the dataset.'); return; }
  }
  
  const diffDays = Math.floor((endDate - startDate) / (1000*60*60*24));
  if (diffDays > 62) { alert('Maximum date range is 2 months (≤62 days).'); return; }
  if (typeof updateFlowers === 'function') updateFlowers(startDate, endDate);
}

