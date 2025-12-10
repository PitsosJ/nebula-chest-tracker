/*
  main.js
  Λειτουργεί με spawnData μορφής:
  const spawnData = {
    Monday: [ {hourUTC:0, location:'Shrine', type:'C'}, ... ],
    Tuesday: [...],
    ...
  };
*/

// Όρισε τις μέρες για wrap-around
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// CET offset (UTC+1)
const CET_OFFSET = 1;

// Helpers
function two(n){ return String(n).padStart(2,'0'); }

function formatRangeCET(day, hour) {
  // start CET hour
  const start = new Date();
  start.setUTCHours(hour + CET_OFFSET, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(40); // μέχρι :40
  return `${two(start.getHours())}:${two(start.getMinutes())} — ${two(end.getHours())}:${two(end.getMinutes())}`;
}

function getSpawns(day, hour) {
  if (!spawnData[day]) return [];
  return spawnData[day].filter(s => s.hourUTC === hour);
}

// Υπολογισμός previous/current/next
function computeWindows() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  
  // CET hour
  let hourCET = (utcHour + CET_OFFSET) % 24;
  let active = utcMinute < 40;

  // Βρες current day
  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay()-1; // JS: 0=Sunday, εμείς 0=Monday
  let currentDay = days[currentDayIndex];

  let prevDay = currentDay;
  let nextDay = currentDay;

  let prevHour, currentHour, nextHour;

  if (active) {
    currentHour = hourCET;
    prevHour = (hourCET + 23) % 24;
    nextHour = (hourCET + 1) % 24;

    // υπολογισμός ημέρας αν wrap-around
    if (currentHour === 0) prevDay = days[(currentDayIndex + 6) % 7]; // προηγούμενη μέρα
    if (nextHour === 0) nextDay = days[(currentDayIndex + 1) % 7];
  } else {
    // επόμενο spawn ως upcoming
    currentHour = null;
    prevHour = hourCET;
    nextHour = (hourCET + 1) % 24;

    if (nextHour === 0) nextDay = days[(currentDayIndex + 1) % 7];
    if (prevHour === 23) prevDay = days[(currentDayIndex + 6) % 7];
  }

  return {
    active,
    prev: {day: prevDay, hour: prevHour},
    current: currentHour !== null ? {day: currentDay, hour: currentHour} : null,
    next: {day: nextDay, hour: nextHour}
  };
}

// Render
function clearChildren(el){ while(el.firstChild) el.removeChild(el.firstChild); }

function makeSpawnElement(spawn){
  const wrap = document.createElement('div');
  wrap.className = 'spawn';
  wrap.textContent = `${spawn.location} (${spawn.type})`;

  if (spawn.image){
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

function renderAll(){
  const w = computeWindows();

  // Previous
  const prevTimeEl = document.getElementById('time-previous');
  const prevSpawnsEl = document.getElementById('spawns-previous');
  prevTimeEl.textContent = `${w.prev.day} ${formatRangeCET(w.prev.day, w.prev.hour)}`;
  clearChildren(prevSpawnsEl);
  getSpawns(w.prev.day, w.prev.hour).forEach(s => prevSpawnsEl.appendChild(makeSpawnElement(s)));

  // Current
  const curTimeEl = document.getElementById('time-current');
  const curSpawnsEl = document.getElementById('spawns-current');
  const nowInd = document.getElementById('now-indicator');

  if (w.active && w.current){
    curTimeEl.textContent = `${w.current.day} ${formatRangeCET(w.current.day, w.current.hour)}`;
    nowInd.textContent = 'ACTIVE NOW';
    nowInd.style.color = 'var(--accent)';
    clearChildren(curSpawnsEl);
    getSpawns(w.current.day, w.current.hour).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  } else {
    // upcoming
    curTimeEl.textContent = `${w.next.day} ${formatRangeCET(w.next.day, w.next.hour)}`;
    nowInd.textContent = 'No active spawn — Upcoming';
    nowInd.style.color = '#d0cfcf';
    clearChildren(curSpawnsEl);
    getSpawns(w.next.day, w.next.hour).forEach(s => curSpawnsEl.appendChild(makeSpawnElement(s)));
  }

  // Next
  const nextTimeEl = document.getElementById('time-next');
  const nextSpawnsEl = document.getElementById('spawns-next');
  nextTimeEl.textContent = `${w.next.day} ${formatRangeCET(w.next.day, w.next.hour)}`;
  clearChildren(nextSpawnsEl);
  getSpawns(w.next.day, w.next.hour).forEach(s => nextSpawnsEl.appendChild(makeSpawnElement(s)));
}

// Initial render
renderAll();
setInterval(renderAll, 20000);
