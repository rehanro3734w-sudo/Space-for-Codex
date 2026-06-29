import './styles.css';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const OPENF1 = 'https://api.openf1.org/v1';
const currentYear = new Date().getUTCFullYear();
const state = { season: currentYear, query: '', races: [], standings: [], drivers: [], sessions: [], round: 'last', results: [], status: 'Loading free F1 data…' };
const fallbackDrivers = [
  ['Max Verstappen','VER','Red Bull Racing',1,'NED'], ['Lando Norris','NOR','McLaren',4,'GBR'], ['Charles Leclerc','LEC','Ferrari',16,'MON'], ['Lewis Hamilton','HAM','Ferrari',44,'GBR']
].map(([full_name,name_acronym,team_name,driver_number,country_code]) => ({ full_name,name_acronym,team_name,driver_number,country_code }));

const icon = name => ({calendar:'📅',flag:'🏁',driver:'👤',activity:'📡',trophy:'🏆',history:'🕰️',spark:'✨',shield:'🛡️',gauge:'🏎️',clock:'⏱️'}[name] || '•');
async function getJson(url){ const r = await fetch(url); if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); }
function formatDate(value){ if(!value || Number.isNaN(new Date(value))) return 'TBC'; return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)); }
function raceDate(race){ if(!race) return null; const date = race.FirstPractice?.date || race.Qualifying?.date || race.date; const time = race.FirstPractice?.time || race.Qualifying?.time || race.time || '00:00:00Z'; return new Date(`${date}T${time}`); }
function html(strings,...vals){ return strings.map((s,i)=>s+(vals[i] ?? '')).join(''); }
function esc(v=''){ return String(v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function loadSeason(){
  state.status = 'Loading season calendar, standings, and live-session metadata…'; render();
  const [calendar, table, sessionData, driverData] = await Promise.allSettled([
    getJson(`${JOLPICA}/${state.season}.json?limit=100`), getJson(`${JOLPICA}/${state.season}/driverStandings.json?limit=100`), getJson(`${OPENF1}/sessions?year=${state.season}`), getJson(`${OPENF1}/drivers?session_key=latest`)
  ]);
  state.races = calendar.value?.MRData?.RaceTable?.Races || [];
  state.standings = table.value?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  state.sessions = sessionData.value || [];
  state.drivers = driverData.value?.length ? driverData.value : fallbackDrivers;
  state.round = state.races.find(r => raceDate(r) >= new Date())?.round || 'last';
  state.status = calendar.status === 'rejected' ? 'Using partial data: calendar API unavailable.' : 'Live dashboard ready.';
  await loadResults(); render();
}
async function loadResults(){
  state.results = [];
  try { const data = await getJson(`${JOLPICA}/${state.season}/${state.round}/results.json?limit=100`); state.results = data.MRData?.RaceTable?.Races?.[0]?.Results || []; } catch { state.results = []; }
}
function panel(title, ic, body){ return `<section class="panel"><div class="panel-title"><span>${icon(ic)}</span><h2>${title}</h2></div>${body}</section>`; }
function empty(text){ return `<p class="empty">${text}</p>`; }
function render(){
  const now = new Date(); const completed = state.races.filter(r => raceDate(r) < now).length; const nextRace = state.races.find(r => raceDate(r) >= now) || state.races.at(-1);
  const upcoming = state.races.filter(r => raceDate(r) >= now).slice(0,5);
  const drivers = state.drivers.filter(d => [d.full_name,d.name_acronym,d.team_name,d.country_code].join(' ').toLowerCase().includes(state.query.toLowerCase())).slice(0,12);
  const sessions = [...state.sessions].sort((a,b)=>new Date(b.date_start)-new Date(a.date_start)).slice(0,8);
  document.getElementById('root').innerHTML = html`<main><section class="hero"><nav><span class="brand">${icon('gauge')} Apex Free</span><span class="pill">${icon('shield')} Free APIs • no paywall</span></nav><div class="hero-grid"><div><p class="eyebrow">${icon('spark')} Box Box Club-inspired, open-data F1 hub</p><h1>Live, scheduled, and historical Formula 1 data in one clean fan app.</h1><p class="lede">Track race weekends, browse driver profiles, inspect standings, and replay results using free community APIs: Jolpica for full historical records and OpenF1 for session/timing metadata.</p><div class="controls"><label>Season <input id="season" type="number" min="1950" max="${currentYear+1}" value="${state.season}" /></label><label class="search">🔎 <input id="query" placeholder="Search drivers or teams" value="${esc(state.query)}" /></label></div></div><div class="next-card"><p class="eyebrow">${icon('clock')} Next up</p><h2>${esc(nextRace?.raceName || 'Schedule loading')}</h2><p>${esc(nextRace?.Circuit?.circuitName || '')}</p><strong>${formatDate(raceDate(nextRace))}</strong><span>${esc(nextRace?.Circuit?.Location?.locality || '')}, ${esc(nextRace?.Circuit?.Location?.country || '')}</span></div></div><div class="stats">${[['Season races',state.races.length||'—','calendar'],['Completed',completed,'flag'],['Drivers tracked',state.drivers.length||fallbackDrivers.length,'driver'],['Open sessions',state.sessions.length||'—','activity']].map(s=>`<article><span>${icon(s[2])}</span><b>${s[1]}</b><small>${s[0]}</small></article>`).join('')}</div></section><section class="grid two">${panel('Upcoming race weekends','calendar', upcoming.length ? upcoming.map(r=>`<article class="race"><b>Round ${r.round}</b><h3>${esc(r.raceName)}</h3><span>${esc(r.Circuit.circuitName)}</span><em>${formatDate(raceDate(r))}</em></article>`).join('') : empty('No future rounds found for this season.'))}${panel('Current driver standings','trophy', state.standings.slice(0,8).map(r=>`<div class="standing"><b>#${r.position}</b><span>${esc(r.Driver.givenName)} ${esc(r.Driver.familyName)}</span><em>${r.points} pts</em></div>`).join('') || empty('Standings are not available yet.'))}</section><section class="grid two">${panel('Driver profiles','driver', drivers.map(d=>`<article class="driver"><div class="avatar">${esc(d.name_acronym || d.full_name?.slice(0,3))}</div><div><h3>${esc(d.full_name)}</h3><p>#${d.driver_number || '—'} • ${esc(d.team_name || 'Independent')}</p><span>${esc(d.country_code || 'F1')}</span></div></article>`).join(''))}${panel('Live & recent sessions','activity', sessions.length ? sessions.map(s=>`<div class="session"><b>${esc(s.session_name)}</b><span>${esc(s.location)} • ${esc(s.country_name)}</span><em>${formatDate(s.date_start)}</em></div>`).join('') : empty('OpenF1 sessions are not available right now.'))}</section><section class="panel wide"><div class="panel-title"><span>${icon('history')}</span><h2>Historical results explorer</h2></div><div class="controls"><label>Round <select id="round"><option value="last">Latest completed</option>${state.races.map(r=>`<option value="${r.round}" ${String(r.round)===String(state.round)?'selected':''}>${r.round}. ${esc(r.raceName)}</option>`).join('')}</select></label></div><div class="results">${state.results.length ? state.results.slice(0,12).map(r=>`<div class="result"><b>P${r.position}</b><span>${esc(r.Driver.givenName)} ${esc(r.Driver.familyName)}</span><em>${esc(r.Constructor.name)}</em><strong>${esc(r.Time?.time || r.status)}</strong></div>`).join('') : empty('Select a completed round to load classified results.')}</div></section><footer>${esc(state.status)} Data attribution: Jolpica-F1 and OpenF1 community APIs.</footer></main>`;
  document.getElementById('season')?.addEventListener('change', e => { state.season = e.target.value; loadSeason(); });
  document.getElementById('query')?.addEventListener('input', e => { state.query = e.target.value; render(); });
  document.getElementById('round')?.addEventListener('change', async e => { state.round = e.target.value; await loadResults(); render(); });
}
loadSeason();
