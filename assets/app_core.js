/* ============ HOMEMADE BETTING — core ============ */
'use strict';
const HMB = { VER: 1, KEY: 'hmb_state_v1' };

/* ---- tiny DOM helpers ---- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function uid(p = 'id') { return p + '_' + Math.random().toString(36).slice(2, 9); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

/* ---- numbers / money / odds ---- */
function fmtMoney(n) {
  n = Math.round(Number(n) || 0);
  return n.toLocaleString('ru-RU');
}
function fmtSigned(n) {
  n = Math.round(Number(n) || 0);
  return (n > 0 ? '+' : '') + n.toLocaleString('ru-RU');
}
function fmtOdd(n) { return (Number(n) || 0).toFixed(2); }

/* ---- persistence ---- */
const DEFAULT_PIN = '4554';
function migrateState(s) {
  s.settings = s.settings || {};
  if (s.settings.theme === undefined) s.settings.theme = '';
  // защита админки по умолчанию: если PIN не задан и защиту не убирали осознанно
  if (!s.settings.adminPin && !s.settings.noPin) s.settings.adminPin = DEFAULT_PIN;
  return s;
}
function loadState() {
  try {
    const raw = localStorage.getItem(HMB.KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.match) return migrateState(s); }
  } catch (e) {}
  return migrateState(seedState());
}
function saveState() {
  try { localStorage.setItem(HMB.KEY, JSON.stringify(S)); } catch (e) {}
}

/* ---- base64url encode/decode of JSON (serverless sharing) ---- */
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encObj(o) { return b64urlEncode(JSON.stringify(o)); }
function decObj(s) { try { return JSON.parse(b64urlDecode(s)); } catch (e) { return null; } }

/* ---- default match (из постера) ---- */
function nextWednesday21() {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  const day = d.getDay();               // 0..6, среда = 3
  let add = (3 - day + 7) % 7;
  if (add === 0 && Date.now() > d.getTime()) add = 7;
  d.setDate(d.getDate() + add);
  return d.toISOString();
}
function seedState() {
  const A = { name: 'Сергей', sub: 'BORN TO WIN', color: 'a' };
  const B = { name: 'Максим', sub: 'DOMINATE', color: 'b' };
  const match = {
    id: uid('match'),
    title: 'Матч — Сергей vs Максим',
    sport: 'Настольный теннис',
    playerA: A, playerB: B,
    format: 'BEST OF 7', winsTarget: 4,
    dateISO: nextWednesday21(),
    venueText: 'Домашний матч',
    commissionPct: 5,
    oddsMode: 'fixed',                   // 'fixed' | 'dynamic'
    status: 'open',                      // 'open' | 'closed' | 'finished'
    result: null,                        // { outcomes:{marketId:selId}, score:'4:2' }
    markets: seedMarkets(),
    createdAt: Date.now()
  };
  return { ver: HMB.VER, match, bets: [], history: [], settings: { theme: '', adminPin: '' } };
}
function seedMarkets() {
  return [
    {
      id: 'winner', name: 'Матч — победитель', kind: 'winner',
      selections: [
        { id: 'w_a', label: 'Сергей', odd: 2.25, side: 'a' },
        { id: 'w_b', label: 'Максим', odd: 1.80, side: 'b' }
      ]
    },
    {
      id: 'score', name: 'Точный счёт (Best of 7)', kind: 'score', cols: 4,
      selections: [
        { id: 's_a40', label: 'Сергей 4:0', odd: 18.00, side: 'a' },
        { id: 's_a41', label: 'Сергей 4:1', odd: 8.50, side: 'a' },
        { id: 's_a42', label: 'Сергей 4:2', odd: 6.50, side: 'a' },
        { id: 's_a43', label: 'Сергей 4:3', odd: 6.20, side: 'a' },
        { id: 's_b40', label: 'Максим 4:0', odd: 12.00, side: 'b' },
        { id: 's_b41', label: 'Максим 4:1', odd: 6.30, side: 'b' },
        { id: 's_b42', label: 'Максим 4:2', odd: 5.30, side: 'b' },
        { id: 's_b43', label: 'Максим 4:3', odd: 5.60, side: 'b' }
      ]
    },
    {
      id: 'blowout', name: 'Разгром в партии (перевес > 5 очков)', kind: 'custom',
      selections: [
        { id: 'bl_yes', label: 'Да', odd: 2.40 },
        { id: 'bl_no', label: 'Нет', odd: 1.50 }
      ]
    }
  ];
}

/* ============ ODDS ENGINE ============ */
/* Возвращает актуальный кэф выбора в зависимости от режима матча. */
const DYN_ANCHOR = 200; // «инерция» стартовых кэфов (в виртуальных единицах)

function marketStakes(marketId) {
  const map = {};
  let pool = 0;
  S.bets.forEach(bet => bet.picks.forEach(p => {
    if (p.marketId !== marketId) return;
    map[p.selectionId] = (map[p.selectionId] || 0) + (Number(p.stake) || 0);
    pool += (Number(p.stake) || 0);
  }));
  return { map, pool };
}
/* Динамический кэф: eff-pool модель. Больше денег на выбор → ниже кэф. */
function dynamicOdds(market) {
  const comm = (S.match.commissionPct || 0) / 100;
  const { map } = marketStakes(market.id);
  const eff = {}; let total = 0;
  market.selections.forEach(sel => {
    const base = 1 / Math.max(1.01, sel.odd || 2);   // базовая «вероятность» из постера
    eff[sel.id] = base * DYN_ANCHOR + (map[sel.id] || 0);
    total += eff[sel.id];
  });
  const out = {};
  market.selections.forEach(sel => {
    const p = eff[sel.id] / total;
    out[sel.id] = Math.max(1.01, Math.round(((1 - comm) / p) * 100) / 100);
  });
  return out;
}
function oddOf(market, sel) {
  if (S.match.oddsMode === 'dynamic') return dynamicOdds(market)[sel.id];
  return sel.odd;
}
/* кэф для конкретного пика при расчёте итогов */
function settleOdd(pick) {
  const m = S.match.markets.find(x => x.id === pick.marketId);
  const sel = m && m.selections.find(x => x.id === pick.selectionId);
  if (!m || !sel) return pick.oddAtBet || 1;
  return S.match.oddsMode === 'dynamic' ? dynamicOdds(m)[sel.id] : (pick.oddAtBet || sel.odd);
}

/* ============ AGGREGATES ============ */
function totalBank() {
  let s = 0;
  S.bets.forEach(b => b.picks.forEach(p => s += (Number(p.stake) || 0)));
  return s;
}
function betsCount() { return S.bets.reduce((n, b) => n + b.picks.length, 0); }
function participants() {
  const set = new Map();
  S.bets.forEach(b => set.set(b.participant.toLowerCase(), b.participant));
  return Array.from(set.values());
}
function findBet(name) {
  const key = (name || '').trim().toLowerCase();
  return S.bets.find(b => b.participant.trim().toLowerCase() === key);
}
/* Итог по одному пику (только для рассчитанных рынков). */
function pickResult(pick) {
  const res = S.match.result;
  if (!res || !res.outcomes) return { settled: false, win: false, profit: 0 };
  const outcome = res.outcomes[pick.marketId];
  if (outcome == null || outcome === '') return { settled: false, win: false, profit: 0 };
  const win = outcome === pick.selectionId;
  const odd = settleOdd(pick);
  const stake = Number(pick.stake) || 0;
  return { settled: true, win, odd, stake, profit: win ? stake * (odd - 1) : -stake };
}
/* Сводка по участнику (по текущему матчу). */
function betSummary(bet) {
  let staked = 0, returned = 0, profit = 0, settled = 0, won = 0;
  bet.picks.forEach(p => {
    const st = Number(p.stake) || 0; staked += st;
    const r = pickResult(p);
    if (r.settled) { settled++; if (r.win) { won++; returned += st * r.odd; } profit += r.profit; }
  });
  return { staked, returned, profit, settled, won, picks: bet.picks.length };
}
function leaderboard() {
  return S.bets.map(b => ({ bet: b, name: b.participant, ...betSummary(b) }))
    .sort((x, y) => y.profit - x.profit || y.won - x.won || x.staked - y.staked);
}
