/* ============ HOMEMADE BETTING — cloud sync (общая база, jsonblob) ============ */
/* Все устройства работают с одной «комнатой» = общий JSON в интернете.
   Чтение — опросом; запись — read-modify-write с ретраями и очередью на дослать,
   чтобы одиночные сбои сети не теряли ставки и не пугали пользователя. */
const CLOUD = {
  BASE: 'https://jsonblob.com/api/jsonBlob',
  DEFAULT_ROOM: '019fd144-e350-712c-926c-b4a568ca454f',
  ROOM: (localStorage.getItem('hmb_room') || '').trim(),
  etag: null,
  status: 'init',        // init | online | sync | offline
  pendingRender: false,
  pushing: false,
  fails: 0,
  queue: []              // ожидающие отправки изменения (mutator-функции)
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function activeRoom() { return CLOUD.ROOM || CLOUD.DEFAULT_ROOM; }
function cloudOn() { return CLOUD.status !== 'disabled' && !!activeRoom(); }
function roomURL() { return CLOUD.BASE + '/' + activeRoom(); }
function readURL() { return roomURL() + '?cb=' + Date.now() + '_' + Math.floor(performance.now()); } // обход кэша

function setRoom(id) {
  id = (id || '').trim();
  CLOUD.ROOM = id; CLOUD.etag = null;
  if (id) localStorage.setItem('hmb_room', id);
}

/* ---- индикатор связи ---- */
function setSyncStatus(s) { CLOUD.status = s; updateSyncBadge(); }
function cloudFail() { CLOUD.fails++; if (CLOUD.fails >= 3 && !CLOUD.queue.length) setSyncStatus('offline'); }
function cloudOk() { CLOUD.fails = 0; setSyncStatus(CLOUD.queue.length ? 'sync' : 'online'); }
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
  if (typeof doc.rev === 'number' && typeof S._rev === 'number' && doc.rev < S._rev) return false; // не откат
  S.match = doc.match;
  S.bets = Array.isArray(doc.bets) ? doc.bets : [];
  S.history = Array.isArray(doc.history) ? doc.history : [];
  S._rev = doc.rev || 0;
  saveState();
  return true;
}
function stateFingerprint(o) { return JSON.stringify({ m: o.match, b: o.bets, h: o.history }); }
function safeRender() {
  const ae = document.activeElement;
  const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
  const modal = (document.getElementById('modal-root').innerHTML || '').trim() !== '';
  if (typing || modal) { CLOUD.pendingRender = true; return; }
  CLOUD.pendingRender = false;
  render();
}

/* ---- fetch с таймаутом (даём серверу больше времени) ---- */
async function fetchTO(url, opts, ms) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms || 15000);
  try { return await fetch(url, Object.assign({ signal: ctrl.signal }, opts)); }
  finally { clearTimeout(to); }
}

/* ---- чтение (опрос) с коротким ретраем; 429 (лимит) — не считаем обрывом ---- */
async function cloudPull() {
  if (!cloudOn() || CLOUD.pushing || document.hidden) return;   // фоновую вкладку не опрашиваем
  let doc = null, rate = false;
  for (let i = 0; i < 2 && doc === null; i++) {
    try {
      const res = await fetchTO(readURL(), { headers: { 'Accept': 'application/json' }, cache: 'no-store' }, 12000);
      if (res.status === 429) { rate = true; break; }           // превышен лимит — просто пропустим тик
      if (res.ok) doc = await res.json();
    } catch (e) {}
    if (doc === null && !rate && i === 0) await sleep(700);
  }
  if (doc === null) {
    if (rate && CLOUD.status === 'init') setSyncStatus('online'); // связь есть, только лимит
    else if (!rate) cloudFail();
    return;
  }
  const before = stateFingerprint(S);
  const applied = applyDoc(doc);
  cloudOk();
  if (applied && (stateFingerprint(S) !== before || CLOUD.pendingRender)) safeRender();
}

/* ---- запись: read-modify-write, ретраи на любую ошибку/конфликт с backoff ---- */
async function cloudPush(mutator) {
  CLOUD.pushing = true;
  try {
    let lastErr, rate = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      rate = false;
      try {
        const res = await fetchTO(readURL(), { headers: { 'Accept': 'application/json' }, cache: 'no-store' }, 15000);
        if (res.status === 429) { rate = true; throw new Error('rate'); }
        if (!res.ok) throw new Error('get-' + res.status);
        const etag = res.headers.get('ETag');
        const doc = await res.json();
        mutator(doc);
        doc.rev = (doc.rev || 0) + 1;
        const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (etag) h['If-Match'] = etag;
        const put = await fetchTO(roomURL(), { method: 'PUT', headers: h, body: JSON.stringify(doc) }, 15000);
        if (put.ok) { CLOUD.etag = put.headers.get('ETag') || null; S._rev = doc.rev; applyDoc(doc); return doc; }
        if (put.status === 429) rate = true;
        lastErr = new Error('put-' + put.status);
      } catch (e) { lastErr = e; if (e.message === 'rate') rate = true; }
      // при лимите (429) ждём заметно дольше, иначе обычный backoff
      await sleep((rate ? 2000 : 600) * (attempt + 1));
    }
    throw lastErr || new Error('push-failed');
  } finally { CLOUD.pushing = false; }
}

/* ---- очередь на дослать: изменения не теряются при сбоях сети ---- */
async function flushQueue() {
  if (!cloudOn() || CLOUD.pushing || !CLOUD.queue.length) return;
  const batch = CLOUD.queue.slice();
  try {
    await cloudPush(doc => batch.forEach(m => m(doc)));
    CLOUD.queue = CLOUD.queue.slice(batch.length);   // убрать отправленные
    CLOUD.queue.forEach(m => m(S)); saveState();      // сохранить оставшиеся оптимистично
    cloudOk(); render();
  } catch (e) {
    setSyncStatus('sync');                            // не пугаем — повторим в фоне
  }
}

/* ---- единая точка изменения состояния ---- */
function commit(mutator) {
  if (!cloudOn()) { mutator(S); saveState(); render(); return; }
  mutator(S); saveState(); render();                  // мгновенный отклик
  CLOUD.queue.push(mutator);
  setSyncStatus('sync');
  flushQueue();
}

/* ---- запуск синхронизации ---- */
function startCloudSync() {
  if (!cloudOn()) { setSyncStatus('disabled'); return; }
  setSyncStatus('init');
  cloudPull();
  setInterval(cloudPull, 12000);                      // реже опрос → меньше шанс упереться в лимит по IP
  setInterval(flushQueue, 4000);                      // очередь дожимаем чаще (запросы шлёт только когда есть что дослать)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { cloudPull(); flushQueue(); } });
  window.addEventListener('online', () => { cloudPull(); flushQueue(); });
}
