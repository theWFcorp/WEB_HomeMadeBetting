/* ============ HOMEMADE BETTING — cloud sync (общая база, jsonblob) ============ */
/* Все устройства работают с одной «комнатой» = общий JSON в интернете.
   Чтение — опросом каждые несколько секунд; запись — read-modify-write с If-Match,
   чтобы одновременные ставки не затирали друг друга. Настройка не требуется. */
const CLOUD = {
  BASE: 'https://jsonblob.com/api/jsonBlob',
  DEFAULT_ROOM: '019fd144-e350-712c-926c-b4a568ca454f',
  ROOM: (localStorage.getItem('hmb_room') || '').trim(),
  etag: null,
  status: 'init',        // init | online | sync | offline
  pendingRender: false,
  pushing: false,
  fails: 0
};
function cloudFail() { CLOUD.fails++; if (CLOUD.fails >= 3) setSyncStatus('offline'); }
function cloudOk() { CLOUD.fails = 0; setSyncStatus('online'); }
async function fetchRoomDoc() {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(readURL(), { headers: { 'Accept': 'application/json' }, cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error('http-' + res.status);
    return await res.json();
  } finally { clearTimeout(to); }
}
function activeRoom() { return CLOUD.ROOM || CLOUD.DEFAULT_ROOM; }
function cloudOn() { return CLOUD.status !== 'disabled' && !!activeRoom(); }
function roomURL() { return CLOUD.BASE + '/' + activeRoom(); }
function readURL() { return roomURL() + '?cb=' + Date.now() + '_' + Math.floor(performance.now()); } // обход кэша при чтении

function setRoom(id) {
  id = (id || '').trim();
  CLOUD.ROOM = id; CLOUD.etag = null;
  if (id) localStorage.setItem('hmb_room', id);
}

/* ---- статус связи (бейдж в шапке) ---- */
function setSyncStatus(s) { CLOUD.status = s; updateSyncBadge(); }
function syncBadgeHTML() {
  const map = {
    online: ['var(--win)', 'Онлайн'], sync: ['var(--gold)', 'Синхр.'],
    offline: ['var(--faint)', 'Локально'], init: ['var(--faint)', '…'], disabled: ['var(--faint)', 'Локально']
  };
  const [c, t] = map[CLOUD.status] || map.init;
  const cloud = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.8 3.8 0 0 1 18 18H7z"/></svg>';
  return '<button id="sync-badge" class="pill" data-act="sync-info" title="Общая база данных" ' +
    'style="color:' + c + ';border-color:currentColor;cursor:pointer">' +
    cloud + '<span style="font-size:11px">' + t + '</span></button>';
}
function updateSyncBadge() {
  const el = document.getElementById('sync-badge');
  if (el) el.outerHTML = syncBadgeHTML();
}

/* ---- применить облачный документ к локальному состоянию ---- */
function applyDoc(doc) {
  if (!doc || !doc.match) return false;
  // не откатываемся на устаревшую версию (защита от гонок опрос/запись)
  if (typeof doc.rev === 'number' && typeof S._rev === 'number' && doc.rev < S._rev) return false;
  S.match = doc.match;
  S.bets = Array.isArray(doc.bets) ? doc.bets : [];
  S.history = Array.isArray(doc.history) ? doc.history : [];
  S._rev = doc.rev || 0;
  saveState();
  return true;
}
function stateFingerprint(o) {
  return JSON.stringify({ m: o.match, b: o.bets, h: o.history });
}
function safeRender() {
  const ae = document.activeElement;
  const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
  const modal = (document.getElementById('modal-root').innerHTML || '').trim() !== '';
  if (typing || modal) { CLOUD.pendingRender = true; return; }
  CLOUD.pendingRender = false;
  render();
}

/* ---- чтение (опрос) ---- */
async function cloudPull(force) {
  if (!cloudOn() || CLOUD.pushing) return;
  // ETag у jsonblob стабилен → всегда читаем полностью с обходом кэша; короткий ретрай сглаживает эпизодические сбои
  let doc = null;
  for (let i = 0; i < 2 && doc === null; i++) {
    try { doc = await fetchRoomDoc(); }
    catch (e) { if (i === 0) await new Promise(r => setTimeout(r, 700)); }
  }
  if (doc === null) { cloudFail(); return; }
  const before = stateFingerprint(S);
  const applied = applyDoc(doc);
  cloudOk();
  if (applied && (stateFingerprint(S) !== before || CLOUD.pendingRender)) safeRender();
}

/* ---- запись (read-modify-write + If-Match, retry при конфликте) ---- */
async function cloudPush(mutator) {
  CLOUD.pushing = true;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(readURL(), { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
      if (!res.ok) throw new Error('get-' + res.status);
      const etag = res.headers.get('ETag');
      const doc = await res.json();
      mutator(doc);
      doc.rev = (doc.rev || 0) + 1;
      const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (etag) h['If-Match'] = etag;
      const put = await fetch(roomURL(), { method: 'PUT', headers: h, body: JSON.stringify(doc) });
      if (put.ok) {
        CLOUD.etag = put.headers.get('ETag') || null;
        S._rev = doc.rev;            // фиксируем версию до applyDoc, чтобы опрос не откатил
        applyDoc(doc);
        return doc;
      }
      if (put.status === 412 || put.status === 409) continue; // конфликт — перечитать и повторить
      throw new Error('put-' + put.status);
    }
    throw new Error('conflict');
  } finally { CLOUD.pushing = false; }
}

/* ---- единая точка изменения состояния ----
   mutator(target) применяет изменение к {match,bets,history}.
   Оффлайн — сразу к локальному S; онлайн — оптимистично локально + запись в облако. */
function commit(mutator) {
  if (!cloudOn()) { mutator(S); saveState(); render(); return; }
  setSyncStatus('sync');
  mutator(S); saveState(); render();          // мгновенный отклик
  cloudPush(mutator)
    .then(() => { cloudOk(); render(); })
    .catch(() => { setSyncStatus('offline'); toast('Нет связи — сохранено локально'); });
}

/* ---- запуск синхронизации ---- */
function startCloudSync() {
  if (!cloudOn()) { setSyncStatus('disabled'); return; }
  setSyncStatus('init');
  cloudPull(true);
  setInterval(cloudPull, 8000);
}
