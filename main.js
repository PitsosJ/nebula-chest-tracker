// main.js (replace existing)

// ---------- helpers ----------
function pad(n){ return String(n).padStart(2,'0'); }

function createSpawnEl(sp){
  const div = document.createElement('div');
  div.className = 'spawn';
  div.textContent = `${sp.location} (${sp.type})`;
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `<strong>${sp.location}</strong><br>Type: ${sp.type}<br>Hour CET: ${pad(sp.hourCET)}:00`;
  div.appendChild(popup);
  return div;
}

// ---------- CET clock (single, robust) ----------
function ensureCETClock() {
  // try existing element first (user HTML might already have it)
  let el = document.getElementById('cet-clock');
  if (el) return el;

  // otherwise create it above the grid (inside .container if exists)
  const container = document.querySelector('.container') || document.body;
  el = document.createElement('div');
  el.id = 'cet-clock';
  el.style.textAlign = 'center';
  el.style.margin = '8px 0';
  el.style.color = 'var(--accent)';
  el.style.fontSize = '13px';
  container.insertBefore(el, container.firstChild);
  return el;
}

function updateCETClockElem(el) {
  // use Intl so DST is handled correctly
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  el.textContent = `CET: ${fmt.format(now)}`;
}

// ---------- compute previous/current/next (per-hour) ----------
function getSpawnsByHour(spawnData) {
  // get "now" in CET
  const now = new Date();
  const nowCETstr = now.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' });
  const nowCET = new Date(nowCETstr);
  const hour = nowCET.getHours();

  // get current day name matching your spawnData keys
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = days[nowCET.getDay()];
  const tomorrowName = days[(nowCET.getDay()+1)%7];

  const todaySpawns = (spawnData && spawnData[todayName]) ? spawnData[todayName] : [];
  const tomorrowSpawns = (spawnData && spawnData[tomorrowName]) ? spawnData[tomorrowName] : [];

  const prevHour = (hour === 0) ? 23 : hour - 1;
  const nextHour = (hour === 23) ? 0 : hour + 1;

  const previous = todaySpawns.filter(s => s.hourCET === prevHour);
  const current  = todaySpawns.filter(s => s.hourCET === hour);
  const next = nextHour === 0 ? tomorrowSpawns.filter(s => s.hourCET === 0)
                              : todaySpawns.filter(s => s.hourCET === nextHour);

  console.debug('getSpawnsByHour', { nowCET: nowCET.toString(), hour, prevHour, nextHour,
                                    counts: { previous: previous.length, current: current.length, next: next.length }});
  return { previous, current, next };
}

// ---------- render ----------
function renderColumnSpawns(containerId, spawnsArr){
  const container = document.getElementById(containerId);
  if(!container){
    console.warn('Missing container', containerId);
    return;
  }
  container.innerHTML = '';
  if(!spawnsArr || spawnsArr.length === 0){
    const empty = document.createElement('div');
    empty.className = 'muted-small';
    empty.textContent = 'No spawns';
    container.appendChild(empty);
    return;
  }
  spawnsArr.forEach(s => container.appendChild(createSpawnEl(s)));
}

function setTimeLabel(labelId, hourCETArr){
  // hourCETArr is an array of spawns for that hour; we show the hour range based on first spawn if exists
  const el = document.getElementById(labelId);
  if(!el) return;
  if(!hourCETArr || hourCETArr.length === 0){
    el.textContent = '—';
    return;
  }
  const h = hourCETArr[0].hourCET;
  el.textContent = `${pad(h)}:00 — ${pad(h)}:40 CET`;
}

// ---------- main update ----------
function updateAll() {
  if (typeof spawnData === 'undefined') {
    console.error('spawnData not found — make sure spawns.js is loaded before main.js');
    return;
  }

  const cetClockEl = ensureCETClock();
  // update clock
  updateCETClockElem(cetClockEl);

  // get spawns
  const { previous, current, next } = getSpawnsByHour(spawnData);

  // render
  renderColumnSpawns('spawns-previous', previous);
  renderColumnSpawns('spawns-current', current);
  renderColumnSpawns('spawns-next', next);

  // set time labels (use arrays to get hour)
  setTimeLabel('time-previous', previous);
  setTimeLabel('time-current', current);
  setTimeLabel('time-next', next);

  // now-indicator: only one small label near current column (no duplicate clocks)
  const nowInd = document.getElementById('now-indicator');
  if(nowInd){
    if(current && current.length > 0) nowInd.textContent = 'ACTIVE NOW';
    else nowInd.textContent = 'Upcoming';
  }
}

// ---------- init on DOM ready ----------
document.addEventListener('DOMContentLoaded', () => {
  // run immediately and schedule updates
  try {
    updateAll();
    setInterval(updateAll, 1000);
  } catch (err) {
    console.error('updateAll failed', err);
  }
});
