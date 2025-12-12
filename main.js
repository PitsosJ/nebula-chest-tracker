// main.js (replace existing)

// ---------- helpers ----------
function pad(n){ return String(n).padStart(2,'0'); }

function createSpawnEl(sp){
  const div = document.createElement('div');
  div.className = 'spawn';

  let imgSrc = '';
  if (sp.type === 'M') imgSrc = 'images/stone.webp';     // πέτρα
  else if (sp.type === 'C') imgSrc = 'images/chest.webp'; // chest

  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = sp.type;
  img.className = 'spawn-icon';

  div.appendChild(img);
  const popup = document.createElement('div')
  popup.className = 'popup'
  popup.innerHTML = `${sp.type === 'M' ? 'Moonstone' : 'Chest'}`
  div.appendChild(popup);


  // --- text (location) ---
  const text = document.createElement('span');
  text.textContent = sp.location;
  div.appendChild(text);

  return div;
}


// ---------- CET clock (single, robust) ----------
function ensureCETClock() {
  let el = document.getElementById('cet-clock');
  if (el) return el;

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
  const now = new Date();

  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'long',
    hour: 'numeric',
    hour12: false
  });

  const parts = dtf.formatToParts(now);
  const todayName = parts.find(p => p.type === 'weekday').value;
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const tomorrowName = days[(days.indexOf(todayName)+1)%7];
  const yesterdayName = days[(days.indexOf(todayName)+6)%7];

  const todaySpawns = spawnData[todayName] || [];
  const tomorrowSpawns = spawnData[tomorrowName] || [];
  const yesterdaySpawns = spawnData[yesterdayName] || [];

  const prevHour = (hour === 0) ? 23 : hour - 1;
  const nextHour = (hour === 23) ? 0 : hour + 1;

  const previous = prevHour === 23 ? yesterdaySpawns.filter(s => s.hourCET === 23)
                                   : todaySpawns.filter(s => s.hourCET === prevHour);
  const current  = todaySpawns.filter(s => s.hourCET === hour);
  const next     = nextHour === 0 ? tomorrowSpawns.filter(s => s.hourCET === 0)
                                  : todaySpawns.filter(s => s.hourCET === nextHour);

  return {
    previous: { spawns: previous, day: prevHour === 23 ? yesterdayName : todayName },
    current:  { spawns: current,  day: todayName },
    next:     { spawns: next,     day: nextHour === 0 ? tomorrowName : todayName }
  };
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
  spawnsArr.sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === 'M' ? -1 : 1;
  });
  spawnsArr.forEach(s => container.appendChild(createSpawnEl(s)));
}

function setTimeLabel(labelId, spawnsObj){
  const el = document.getElementById(labelId);
  if(!el) return;
  const spawnsArr = spawnsObj.spawns;
  const day = spawnsObj.day;
  if(!spawnsArr || spawnsArr.length === 0){
    el.textContent = '—';
    return;
  }
  const h = spawnsArr[0].hourCET;
  el.textContent = `${day} • ${pad(h)}:00 — ${pad(h)}:40`;
}

// ---------- main update ----------
function updateAll() {
  if (typeof spawnData === 'undefined') {
    console.error('spawnData not found — make sure spawns.js is loaded before main.js');
    return;
  }

  const cetClockEl = ensureCETClock();
  updateCETClockElem(cetClockEl);

  const { previous, current, next } = getSpawnsByHour(spawnData);

  renderColumnSpawns('spawns-previous', previous.spawns);
  renderColumnSpawns('spawns-current', current.spawns);
  renderColumnSpawns('spawns-next', next.spawns);

  setTimeLabel('time-previous', previous);
  setTimeLabel('time-current', current);
  setTimeLabel('time-next', next);
}

// ---------- init on DOM ready ----------
document.addEventListener('DOMContentLoaded', () => {
  try {
    updateAll();
    setInterval(updateAll, 1000);
  } catch (err) {
    console.error('updateAll failed', err);
  }
});
