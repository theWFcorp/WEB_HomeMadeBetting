/* ============ HOMEMADE BETTING — render ============ */
let S = loadState();
const UI = {
  view: 'match',
  slip: [],                 // [{marketId, selectionId, stake}]
  name: localStorage.getItem('hmb_name') || '',
  adminUnlocked: sessionStorage.getItem('hmb_admin') === '1',
  editingBetId: null
};

/* ---- icons ---- */
const IC = {
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" opacity=".5"/></svg>',
  paddle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.5a6.5 6.5 0 0 0-9.2 9.2l-2.6 2.6a2 2 0 0 0 0 2.8l2.2 2.2a2 2 0 0 0 2.8 0l2.6-2.6a6.5 6.5 0 0 0 9.2-9.2l-1.6-1.6zM7 15l2 2"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  bet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2M9 12h6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 15h6M8 20h8M12 15v5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V1a2 2 0 0 1 4 0v.1A1.7 1.7 0 0 0 17 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3zm2 2v3h3V5zM14 3h7v7h-7zm2 2v3h3V5zM3 14h7v7H3zm2 2v3h3v-3zM14 14h2v2h-2zm3 0h2v2h-2v3h-2v-2h-3v-2h3zm0 3h2v2h-2zm2-3h2v5h-2z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5 10 17 19 7"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17v3z"/><path d="M13.5 7.5 16.5 10.5"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V4M4 20h16M8 20v-6M12 20v-9M16 20v-4"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4M12 8v4l3 2"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  fire: '🔥'
};
function icon(n) { return IC[n] || ''; }

/* ---- toast ---- */
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
function copyText(txt) {
  const ok = () => toast('Скопировано ✓');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(ok).catch(() => fallbackCopy(txt, ok));
  } else fallbackCopy(txt, ok);
}
function fallbackCopy(txt, ok) {
  const ta = document.createElement('textarea'); ta.value = txt;
  ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta);
  ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {}
  document.body.removeChild(ta);
}

/* ---- modal ---- */
function openModal(html) {
  const r = $('#modal-root');
  r.innerHTML = '<div class="modal-back" data-act="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">' +
    '<div style="display:flex;justify-content:flex-end;margin:-6px -6px 0"><button class="icon-btn" data-act="close-modal" aria-label="Закрыть">' + icon('close') + '</button></div>' +
    html + '</div></div>';
}
function closeModal() { $('#modal-root').innerHTML = ''; }

/* ---- status meta ---- */
function statusInfo() {
  const m = { open: ['open', 'Приём открыт'], closed: ['closed', 'Приём закрыт'], finished: ['finished', 'Матч завершён'] };
  return m[S.match.status] || m.open;
}
function isAdmin() { return UI.adminUnlocked; }

/* ---- topbar & botnav ---- */
function renderChrome() {
  const [cls, label] = statusInfo();
  $('#topbar').innerHTML =
    '<div class="brand">' +
      '<span class="logo" style="color:var(--cyan)">' + icon('paddle') + '</span>' +
      '<span><small>HOMEMADE</small><b>BETTING</b></span>' +
    '</div>' +
    '<span class="pill ' + cls + '"><span class="dot"></span>' + esc(label) + '</span>' +
    '<span class="spacer"></span>' +
    '<button class="icon-btn" data-act="theme" aria-label="Сменить тему">' + icon(themeIsDark() ? 'sun' : 'moon') + '</button>';

  const tabs = [
    ['match', 'Матч', 'home'],
    ['bet', 'Прогноз', 'bet'],
    ['leaders', 'Рейтинг', 'trophy'],
    ['history', 'История', 'history'],
    ['admin', 'Админ', 'gear']
  ];
  $('#botnav').innerHTML = tabs.map(([v, t, ic]) =>
    '<button data-act="go" data-view="' + v + '" class="' + (UI.view === v ? 'on' : '') + '">' +
    icon(ic) + '<span>' + t + '</span></button>').join('');
}

/* ============ VIEW: MATCH ============ */
function viewMatch() {
  const m = S.match;
  return poster(m) + statStrip() +
    '<div class="section-title">' + icon('chart') + ' Рынки и коэффициенты <span class="line"></span>' +
      '<span class="chip">Режим: <b>' + (m.oddsMode === 'dynamic' ? 'динамич.' : 'фикс.') + '</b></span></div>' +
    (m.status === 'open'
      ? '<p class="hint" style="margin:0 2px 8px">Нажми на исход — он добавится в твой прогноз. Затем перейди во вкладку «Прогноз».</p>'
      : '<p class="hint" style="margin:0 2px 8px">Приём прогнозов закрыт. Ниже — рынки и итоги.</p>') +
    m.markets.map(mk => marketBlock(mk)).join('') +
    slipBar() + disclaimer();
}

function poster(m) {
  const dt = new Date(m.dateISO);
  const dateStr = dt.toLocaleDateString('ru-RU', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  const winMk = m.markets.find(x => x.kind === 'winner');
  const oddA = winMk ? fmtOdd(oddOf(winMk, winMk.selections[0])) : '';
  const oddB = winMk ? fmtOdd(oddOf(winMk, winMk.selections[1])) : '';
  const av = (p) => esc((p.name || '?').trim().charAt(0).toUpperCase());
  return '' +
  '<div class="poster"><div class="bg"></div><div class="grid-fx"></div><div class="split"></div><div class="poster-in">' +
    '<div class="poster-top">' +
      '<span class="sport-tag">' + icon('paddle') + ' ' + esc(m.sport) + '</span>' +
      '<div class="bo-badge">' + esc(m.format) + '</div>' +
      '<div class="bo-sub">до ' + m.winsTarget + ' побед</div>' +
    '</div>' +
    '<div class="vs-row">' +
      '<div class="player a">' +
        '<div class="ava">' + av(m.playerA) + '</div>' +
        '<div class="pname">' + esc(m.playerA.name) + '</div>' +
        '<div class="psub">' + esc(m.playerA.sub || '') + '</div>' +
        (oddA ? '<div class="odd-mini">Кэф ' + oddA + '</div>' : '') +
      '</div>' +
      '<div class="vs-badge"><span class="fire">' + IC.fire + '</span><span class="versus">VERSUS</span><span class="fire">' + IC.fire + '</span></div>' +
      '<div class="player b">' +
        '<div class="ava">' + av(m.playerB) + '</div>' +
        '<div class="pname">' + esc(m.playerB.name) + '</div>' +
        '<div class="psub">' + esc(m.playerB.sub || '') + '</div>' +
        (oddB ? '<div class="odd-mini">Кэф ' + oddB + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="meta-row">' +
      '<div class="m"><b>' + esc(dateStr) + '</b><span>Начало</span></div>' +
      '<div class="m"><b>' + esc(m.venueText || '—') + '</b><span>Площадка</span></div>' +
      '<div class="m"><b>Комиссия ' + m.commissionPct + '%</b><span>с выигрыша</span></div>' +
    '</div>' +
    '<div class="row" style="justify-content:center;margin-top:16px">' +
      '<button class="btn gold sm" data-act="open-invite">' + icon('qr') + ' Пригласить / QR</button>' +
      (S.match.status === 'open' ? '<button class="btn primary sm" data-act="go" data-view="bet">' + icon('bet') + ' Сделать прогноз</button>' : '') +
    '</div>' +
  '</div></div>';
}

function statStrip() {
  const bank = totalBank();
  return '<div class="stat-strip">' +
    stat('Ставок', fmtMoney(betsCount()), false) +
    stat('Банк (усл.)', fmtMoney(bank), true) +
    stat('Участников', fmtMoney(participants().length), false) +
    '<div class="stat" id="countdown-stat"><div class="k">До начала</div><div class="v num" id="countdown">—</div></div>' +
  '</div>';
}
function stat(k, v, accent) {
  return '<div class="stat ' + (accent ? 'accent' : '') + '"><div class="k">' + esc(k) + '</div><div class="v num">' + v + '</div></div>';
}

/* ---- market block ---- */
function marketBlock(mk) {
  const res = S.match.result && S.match.result.outcomes ? S.match.result.outcomes[mk.id] : null;
  const cols = mk.cols === 4 ? 'cols-4' : (mk.selections.length <= 2 ? 'cols-1' : '');
  const dyn = S.match.oddsMode === 'dynamic' ? dynamicOdds(mk) : null;
  const sels = mk.selections.map(sel => {
    const inSlip = UI.slip.some(p => p.marketId === mk.id && p.selectionId === sel.id);
    const odd = dyn ? dyn[sel.id] : sel.odd;
    const isWin = res && res === sel.id;
    const dim = res && res !== sel.id;
    const cls = ['sel', inSlip ? 'picked' : '', isWin ? 'win' : '', dim ? 'dim' : ''].join(' ');
    const clickable = S.match.status === 'open';
    return '<button class="' + cls + '" ' + (sel.side ? 'data-side="' + sel.side + '"' : '') +
      (clickable ? ' data-act="pick" data-market="' + mk.id + '" data-sel="' + sel.id + '"' : ' disabled') + '>' +
      '<span class="lbl">' + esc(sel.label) + (isWin ? ' ' + icon('check') : '') + '</span>' +
      '<span class="odd">' + fmtOdd(odd) + '</span></button>';
  }).join('');
  return '<div class="market card pad">' +
    '<div class="market-head"><span class="mt">' + esc(mk.name) + '</span>' +
      '<span class="badge">' + (mk.kind === 'winner' ? 'Победитель' : mk.kind === 'score' ? 'Точный счёт' : 'Спецставка') + '</span></div>' +
    '<div class="sel-grid ' + cols + '">' + sels + '</div></div>';
}

/* ---- slip bar (сводка выбранного, кнопка перейти) ---- */
function slipBar() {
  if (!UI.slip.length || UI.view !== 'match') return '';
  return '<div class="card pad" style="position:sticky;bottom:78px;margin-top:14px;border-color:var(--gold)">' +
    '<div class="row" style="align-items:center"><div><b>' + UI.slip.length + '</b> исх. в прогнозе</div>' +
    '<button class="btn gold" data-act="go" data-view="bet">Оформить прогноз →</button></div></div>';
}

function disclaimer() {
  return '<div class="disclaimer">HomeMade Betting — сервис для <b>домашних дружеских</b> соревнований. ' +
    'Это <b>не букмекерская контора</b>: сервис не принимает и не хранит денежные средства, не производит выплат и не является ' +
    'организатором азартных игр. Все суммы и коэффициенты — виртуальные и служат только для автоматического расчёта результатов между друзьями.</div>';
}
