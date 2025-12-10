// main.js

/*
  Αυτό το script διαβάζει το spawnData από spawns.js
  και εμφανίζει Previous / Current / Next dynamically.
*/

function two(n) { return String(n).padStart(2,'0'); }

// Βρίσκει τα spawn για συγκεκριμένη ημέρα και ώρα UTC
function getSpawns(day, hourUTC) {
  return spawnData.filter(s => s.day === day && s.hourUTC === hourUTC);
}

function formatRangeUTC(hour) {
  const now = new Date();
  const startUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0));
  const endUtc   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, 40));
  const s = startUtc.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const e = endUtc.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  return `${s} — ${e}`;
}

function clearChildren(el){ while(el.firstChild) el.removeChild(el.firstChild); }

function makeSpawnElement(spawn) {
  const wrap = document.createElement('div');
  wrap.className = 'spawn';
  wrap.textContent = `${spawn.location} (${spawn.type})`;

  if (spawn.image) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    const img = document.createElement('img');
    img.src = spawn.image;
    img.alt = spawn.location;
    popup.appendChild(img);
    wrap.appendChild(popup);
  }

  return wrap;
}

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

  return { active, prev: prevHourUTC, current: currentHourUTC, next: nextHourUTC };
}

function renderAll() {
  const day = 'Wednesday'; // για αρχή μόνο Τετάρτη
  const w = computeWindows();

  // Previous
  const prevTimeEl = document.getElementById('time-previous');
  const prevSpawnsEl = document.getElementById('spawns-previous');
  prevTimeEl.textContent = formatRangeUTC(w.prev);
  clearChildren(prevSpawnsEl);
  getSpawns(day, w.prev).forEach(s => prevSpawnsEl.appendChild(makeSpawnElement(s)));

  // Current
  const curTimeEl = document.getElementById('time-current');
  const curSpawnsEl = document.getElementById('spawns-current');
  const nowInd = document.getElementById('now-indicator');
  if (w.active && w.current !== null) {
    curTimeEl.textContent = formatRangeUTC(w.current);
    nowInd.textContent = 'ACTIVE NOW';
    nowInd.style.color = 'var(--accent)';
    clearChildren(curSpawnsEl);
    getSpawns(day, w.current).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  } else {
    const upcomingHour = w.next;
    curTimeEl.textContent = formatRangeUTC(upcomingHour);
    nowInd.textContent = 'No active spawn — Upcoming';
    nowInd.style.color = '#d0cfcf';
    clearChildren(curSpawnsEl);
    getSpawns(day, upcomingHour).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  }

  // Next
  const nextTimeEl = document.getElementById('time-next');
  const nextSpawnsEl = document.getElementById('spawns-next');
  nextTimeEl.textContent = formatRangeUTC(w.next);
  clearChildren(nextSpawnsEl);
  getSpawns(day, w.next).forEach(s => nextSpawnsEl.appendChild(makeSpawnElement(s)));
}

renderAll();
setInterval(renderAll, 20000);