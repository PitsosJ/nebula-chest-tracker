// main.js

// Πάρε την τρέχουσα μέρα
const now = new Date();
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const today = days[now.getDay()]; // π.χ. 'Wednesday'

// Πάρε τα spawns για τη σημερινή μέρα
const todaysSpawns = spawnData[today] || [];

/* ---------- Helpers ---------- */
function two(n){ return String(n).padStart(2,'0'); }

function formatRangeUTC(hour) {
  // επιστρέφει  "HH:MM - HH:MM" σε τοπική ώρα (string)
  const now = new Date();
  const startUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0));
  const endUtc   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, 40, 0));
  const s = startUtc.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const e = endUtc.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  return `${s} — ${e}`;
}

function getSpawnsForHour(hour) {
  return todaysSpawns.filter(s => s.hourUTC === hour);
}

/* ---------- Main logic: determine previous/current/next ---------- */
function computeWindows() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();

  const active = utcM < 40;
  let currentHourUTC, prevHourUTC, nextHourUTC;

  if (active) {
    currentHourUTC = utcH;
    prevHourUTC = (utcH + 23) % 24;
    nextHourUTC = (utcH + 1) % 24;
  } else {
    prevHourUTC = utcH;
    currentHourUTC = null;
    nextHourUTC = (utcH + 1) % 24;
  }

  return {
    active,
    prev: prevHourUTC,
    current: currentHourUTC,
    next: nextHourUTC
  };
}

/* ---------- Render ---------- */
function clearChildren(el){ while(el.firstChild) el.removeChild(el.firstChild); }

function makeSpawnElement(spawn) {
  const wrap = document.createElement('div');
  wrap.className = 'spawn';
  wrap.textContent = `${spawn.type} — ${spawn.location}`;

  const popup = document.createElement('div');
  popup.className = 'popup';

  if(spawn.image) {
    const img = document.createElement('img');
    img.alt = spawn.location;
    img.src = spawn.image;
    popup.appendChild(img);
  }

  wrap.appendChild(popup);
  return wrap;
}

function renderAll() {
  const w = computeWindows();

  // previous
  const prevTimeEl = document.getElementById('time-previous');
  const prevSpawnsEl = document.getElementById('spawns-previous');
  prevTimeEl.textContent = formatRangeUTC(w.prev);
  clearChildren(prevSpawnsEl);
  getSpawnsForHour(w.prev).forEach(s => prevSpawnsEl.appendChild(makeSpawnElement(s)));

  // current
  const curTimeEl = document.getElementById('time-current');
  const curSpawnsEl = document.getElementById('spawns-current');
  const nowInd = document.getElementById('now-indicator');
  if (w.active && w.current !== null) {
    curTimeEl.textContent = formatRangeUTC(w.current);
    nowInd.textContent = 'ACTIVE NOW';
    nowInd.style.color = 'var(--accent)';
    clearChildren(curSpawnsEl);
    getSpawnsForHour(w.current).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  } else {
    const upcomingHour = w.next;
    curTimeEl.textContent = formatRangeUTC(upcomingHour);
    nowInd.textContent = 'No active spawn — Upcoming';
    nowInd.style.color = '#d0cfcf';
    clearChildren(curSpawnsEl);
    getSpawnsForHour(upcomingHour).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  }

  // next
  const nextTimeEl = document.getElementById('time-next');
  const nextSpawnsEl = document.getElementById('spawns-next');
  nextTimeEl.textContent = formatRangeUTC(w.next);
  clearChildren(nextSpawnsEl);
  getSpawnsForHour(w.next).forEach(s => nextSpawnsEl.appendChild(makeSpawnElement(s)));
}

/* Initial render */
renderAll();

/* Refresh every 20 seconds */
setInterval(renderAll, 20000);