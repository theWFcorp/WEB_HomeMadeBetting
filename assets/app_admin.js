/* ============ HOMEMADE BETTING — admin / modals / sharing / init ============ */

/* ============ VIEW: ADMIN ============ */
function viewAdmin() {
  const pinSet = !!(S.settings.adminPin || '').length;
  if (pinSet && !UI.adminUnlocked) {
    return '<div class="section-title">' + icon('lock') + ' Вход администратора <span class="line"></span></div>' +
      '<div class="card pad"><label class="field"><span class="cap">PIN</span>' +
      '<input id="admin-pin" type="password" inputmode="numeric" placeholder="••••" autocomplete="off"></label>' +
      '<button class="btn primary block" data-act="admin-unlock">Войти</button></div>';
  }
  const m = S.match;
  let h = '<div class="section-title">' + icon('gear') + ' Панель администратора <span class="line"></span></div>';

  // приём
  h += '<div class="card pad"><div class="market-head"><span class="mt">Приём прогнозов</span>' +
    '<span class="pill ' + statusInfo()[0] + '"><span class="dot"></span>' + statusInfo()[1] + '</span></div>' +
    '<div class="row" style="margin-top:10px">' +
      (m.status === 'open'
        ? '<button class="btn gold" data-act="set-status" data-status="closed">Закрыть приём</button>'
        : '<button class="btn green" data-act="set-status" data-status="open">Открыть приём</button>') +
      '<button class="btn primary" data-act="open-result">' + icon('trophy') + ' Ввести результат</button>' +
    '</div></div>';

  // режим коэффициентов
  h += '<div class="card pad" style="margin-top:12px"><div class="market-head"><span class="mt">Коэффициенты</span></div>' +
    '<div class="toggle" style="margin-top:8px">' +
      '<button class="' + (m.oddsMode === 'fixed' ? 'on' : '') + '" data-act="set-mode" data-mode="fixed">Фиксированные</button>' +
      '<button class="' + (m.oddsMode === 'dynamic' ? 'on' : '') + '" data-act="set-mode" data-mode="dynamic">Динамические</button>' +
    '</div>' +
    '<p class="hint">' + (m.oddsMode === 'dynamic'
      ? 'Динамический режим: чем больше суммы прогнозов идёт на исход, тем ниже его коэффициент. Пересчёт автоматический.'
      : 'Фиксированный режим: коэффициенты заданы вручную (как на постере).') + '</p></div>';

  // матч
  h += '<div class="card pad" style="margin-top:12px"><div class="market-head"><span class="mt">Параметры матча</span>' +
    '<button class="btn ghost sm" data-act="edit-match">' + icon('edit') + ' Изменить</button></div>' +
    '<div class="row" style="margin-top:6px"><div class="chip">' + esc(m.playerA.name) + ' vs ' + esc(m.playerB.name) + '</div>' +
    '<div class="chip">' + esc(m.format) + ' · до ' + m.winsTarget + '</div>' +
    '<div class="chip">Комиссия ' + m.commissionPct + '%</div></div></div>';

  // рынки
  h += '<div class="section-title">Рынки и спецставки <span class="line"></span>' +
    '<button class="btn ghost sm" data-act="add-market">' + icon('plus') + ' Рынок</button></div>';
  h += m.markets.map(adminMarket).join('');

  // участники
  h += '<div class="section-title">Участники (' + S.bets.length + ') <span class="line"></span>' +
    '<button class="btn ghost sm" data-act="open-import">' + icon('dl') + ' Импорт кода</button></div>';
  if (!S.bets.length) h += '<p class="empty">Прогнозов ещё нет.</p>';
  else h += '<div class="tbl-wrap"><table><thead><tr><th>Участник</th><th class="num">Исходов</th><th class="num">Сумма</th><th></th></tr></thead><tbody>' +
    S.bets.map(b => '<tr><td><b>' + esc(b.participant) + '</b></td><td class="num">' + b.picks.length + '</td><td class="num">' + fmtMoney(betSummary(b).staked) + '</td>' +
      '<td class="num"><button class="btn danger sm" data-act="del-bet" data-id="' + b.id + '">Удалить</button></td></tr>').join('') +
    '</tbody></table></div>';

  // детализация: кто на что ставил
  if (S.bets.length) h += '<div class="section-title">Кто на что ставил <span class="line"></span></div>' +
    S.bets.map(b => betCoupon(b, false)).join('');

  // экспорт / прочее
  h += '<div class="section-title">Экспорт и завершение <span class="line"></span></div>' +
    '<div class="card pad"><div class="row">' +
      '<button class="btn ghost" data-act="export-json">' + icon('dl') + ' JSON</button>' +
      '<button class="btn ghost" data-act="export-csv">' + icon('dl') + ' CSV</button>' +
      '<button class="btn ghost" data-act="results-link">' + icon('share') + ' Ссылка на результаты</button>' +
    '</div>' +
    '<div class="row" style="margin-top:10px">' +
      '<button class="btn ghost" data-act="set-pin">' + icon('lock') + ' ' + (pinSet ? 'Сменить PIN' : 'Задать PIN') + '</button>' +
      '<button class="btn gold" data-act="new-match">Новый матч (текущий → в историю)</button>' +
    '</div></div>';
  return h;
}

function adminMarket(mk) {
  const rows = mk.selections.map(sel =>
    '<div class="row" style="align-items:center;margin-top:6px">' +
      '<input value="' + esc(sel.label) + '" data-act="sel-label" data-market="' + mk.id + '" data-sel="' + sel.id + '" style="flex:2" aria-label="Название">' +
      '<input type="number" step="0.01" min="1.01" value="' + fmtOdd(sel.odd) + '" data-act="sel-odd" data-market="' + mk.id + '" data-sel="' + sel.id + '" style="flex:1" aria-label="Коэффициент">' +
      '<button class="icon-btn" data-act="del-sel" data-market="' + mk.id + '" data-sel="' + sel.id + '" aria-label="Удалить">' + icon('close') + '</button>' +
    '</div>').join('');
  return '<div class="card pad" style="margin-top:10px"><div class="market-head"><span class="mt" style="font-size:15px">' + esc(mk.name) + '</span>' +
    '<button class="btn danger sm" data-act="del-market" data-market="' + mk.id + '">Удалить рынок</button></div>' +
    rows +
    '<button class="btn ghost sm" data-act="add-sel" data-market="' + mk.id + '" style="margin-top:8px">' + icon('plus') + ' Исход</button></div>';
}

/* ============ MODALS ============ */
function matchConfig() {
  const m = JSON.parse(JSON.stringify(S.match));
  delete m.result;
  return { t: 'hmb-match', v: HMB.VER, match: m };
}
function inviteURL() {
  if (cloudOn()) return location.origin + location.pathname + '#room=' + activeRoom();
  return location.origin + location.pathname + '#i=' + encObj(matchConfig());
}
function resultsURL() {
  if (cloudOn()) return inviteURL();
  return location.origin + location.pathname + '#r=' + encObj({ t: 'hmb-res', v: HMB.VER, match: S.match, bets: S.bets });
}
function modalSync() {
  const labels = { online: 'Онлайн', sync: 'Синхронизация', offline: 'Нет связи', init: 'Подключение', disabled: 'Локально' };
  openModal('<h3>Общая база</h3>' +
    '<p class="hint">' + (cloudOn()
      ? 'Онлайн-режим включён. Прогнозы всех участников хранятся в общей базе в интернете и синхронизируются между устройствами автоматически — как на обычном сайте.'
      : 'Онлайн-режим выключен: данные хранятся только на этом устройстве.') + '</p>' +
    '<div class="row" style="margin-top:12px">' +
      '<div class="chip">Статус: <b>' + (labels[CLOUD.status] || '—') + '</b></div>' +
      '<div class="chip">Комната: <b>' + esc(activeRoom().slice(0, 8)) + '…</b></div>' +
    '</div>' +
    '<div class="row" style="margin-top:14px">' +
      '<button class="btn primary" data-act="open-invite">' + icon('qr') + ' Пригласить / QR</button>' +
      '<button class="btn ghost" data-act="cloud-refresh">Обновить сейчас</button>' +
    '</div>');
}

function modalInvite() {
  const url = inviteURL();
  let qr = '';
  try {
    const q = qrcode(0, 'L'); q.addData(url); q.make();
    qr = q.createImgTag(4, 8);
  } catch (e) { qr = '<p class="hint">Ссылка длинновата для QR — используйте кнопку «Копировать ссылку».</p>'; }
  openModal('<h3>Пригласить участников</h3><p class="hint">Отправьте ссылку друзьям — они откроют этот же матч и сделают прогноз. Все прогнозы автоматически появятся у всех: общая база синхронизируется между устройствами.</p>' +
    '<div class="qr-box" style="margin:14px 0">' + qr + '</div>' +
    '<div class="code-box" id="invite-url">' + esc(url) + '</div>' +
    '<div class="row" style="margin-top:12px">' +
      '<button class="btn primary" data-act="copy" data-copy="invite-url">' + icon('copy') + ' Копировать ссылку</button>' +
      (navigator.share ? '<button class="btn ghost" data-act="native-share" data-url="invite">' + icon('share') + ' Поделиться</button>' : '') +
    '</div>');
}

function modalTicket(bet) {
  const code = 'HMB1:' + encObj({ participant: bet.participant, picks: bet.picks, matchId: S.match.id });
  openModal('<h3>Код прогноза</h3><p class="hint">Скопируйте код и отправьте администратору. Он импортирует его в общий список.</p>' +
    '<div class="code-box" id="ticket-code" style="margin:12px 0">' + esc(code) + '</div>' +
    '<button class="btn primary block" data-act="copy" data-copy="ticket-code">' + icon('copy') + ' Копировать код</button>');
}

function modalImport() {
  openModal('<h3>Импорт кодов прогнозов</h3><p class="hint">Вставьте один или несколько кодов (каждый с новой строки), полученных от участников.</p>' +
    '<textarea id="import-area" rows="6" placeholder="HMB1:..." style="margin:10px 0"></textarea>' +
    '<button class="btn primary block" data-act="import-save">Импортировать</button>');
}

function modalResult() {
  const m = S.match;
  const opts = (mk) => '<option value="">— не определён —</option>' +
    mk.selections.map(s => '<option value="' + s.id + '"' + (m.result && m.result.outcomes && m.result.outcomes[mk.id] === s.id ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('');
  const blocks = m.markets.map(mk => '<label class="field"><span class="cap">' + esc(mk.name) + '</span><select id="res_' + mk.id + '">' + opts(mk) + '</select></label>').join('');
  openModal('<h3>Результат матча</h3><p class="hint">Укажите победивший исход в каждом рынке. Расчёт произойдёт автоматически.</p>' +
    '<label class="field"><span class="cap">Итоговый счёт (для постера)</span><input id="final_score" placeholder="например 4:2" value="' + esc(m.result ? (m.result.scoreText || '') : '') + '"></label>' +
    blocks +
    '<div class="row" style="margin-top:8px">' +
      (m.status === 'finished' ? '<button class="btn ghost" data-act="reopen">Вернуть в приём</button>' : '') +
      '<button class="btn green" data-act="save-result">' + icon('check') + ' Рассчитать и завершить</button>' +
    '</div>');
}

function modalMatchEditor() {
  const m = S.match;
  const f = (id, cap, val, type) => '<label class="field"><span class="cap">' + cap + '</span><input id="' + id + '" ' + (type ? 'type="' + type + '"' : '') + ' value="' + esc(val) + '"></label>';
  const off = matchTzOff(m);
  const dateVal = matchWall(m).toISOString().slice(0, 16);   // «настенное» время в поясе соревнования
  const tzOpts = TZ_LIST.map(z => '<option value="' + z.off + '"' + (z.off === off ? ' selected' : '') + '>' + esc(z.label) + '</option>').join('');
  openModal('<h3>Параметры матча</h3>' +
    '<div class="grid-2">' + f('e_pa', 'Игрок A', m.playerA.name) + f('e_pb', 'Игрок B', m.playerB.name) + '</div>' +
    '<div class="grid-2">' + f('e_sa', 'Подпись A', m.playerA.sub || '') + f('e_sb', 'Подпись B', m.playerB.sub || '') + '</div>' +
    f('e_sport', 'Вид спорта', m.sport) +
    '<div class="grid-2">' + f('e_fmt', 'Формат', m.format) + f('e_wins', 'До скольких побед', m.winsTarget, 'number') + '</div>' +
    '<div class="grid-2">' + f('e_venue', 'Площадка', m.venueText || '') + f('e_comm', 'Комиссия, %', m.commissionPct, 'number') + '</div>' +
    '<div class="grid-2">' +
      '<label class="field"><span class="cap">Дата и время начала</span><input id="e_date" type="datetime-local" value="' + dateVal + '"></label>' +
      '<label class="field"><span class="cap">Часовой пояс соревнования</span><select id="e_tz">' + tzOpts + '</select></label>' +
    '</div>' +
    '<p class="hint">Время указывается в выбранном поясе. Обратный отсчёт на главной идёт именно до этого момента.</p>' +
    '<button class="btn primary block" data-act="save-match">Сохранить</button>');
}

function modalAddMarket() {
  openModal('<h3>Новый рынок</h3>' +
    '<label class="field"><span class="cap">Название рынка</span><input id="nm_name" placeholder="например Тотал партий"></label>' +
    '<label class="field"><span class="cap">Тип</span><select id="nm_kind"><option value="custom">Спецставка</option><option value="winner">Победитель</option><option value="score">Точный счёт</option></select></label>' +
    '<p class="hint">Исходы добавите после создания.</p>' +
    '<button class="btn primary block" data-act="add-market-save">Создать</button>');
}

function modalSetPin() {
  openModal('<h3>PIN администратора</h3><p class="hint">По умолчанию вход в админку защищён PIN-кодом. Введите новый код или оставьте поле пустым, чтобы полностью убрать защиту.</p>' +
    '<label class="field"><span class="cap">Новый PIN</span><input id="new-pin" type="password" inputmode="numeric" autocomplete="off"></label>' +
    '<button class="btn primary block" data-act="save-pin">Сохранить</button>');
}

/* ============ EXPORT ============ */
function downloadFile(filename, text, mime) {
  try {
    if (window.claude && window.claude.downloads && typeof window.claude.downloads.save === 'function') {
      window.claude.downloads.save({ filename, data: text }); toast('Файл сохранён'); return;
    }
  } catch (e) {}
  try {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Файл выгружен');
  } catch (e) { toast('Не удалось выгрузить'); }
}
function exportJSON() { downloadFile('homemade-betting.json', JSON.stringify(S, null, 2), 'application/json'); }
function exportCSV() {
  const rows = [['Участник', 'Рынок', 'Исход', 'Кэф', 'Сумма', 'Результат', 'Прибыль']];
  S.bets.forEach(b => b.picks.forEach(p => {
    const { m, sel } = selInfo(p.marketId, p.selectionId);
    const r = pickResult(p);
    rows.push([b.participant, m ? m.name : p.marketId, sel ? sel.label : p.selectionId,
      fmtOdd(r.settled ? r.odd : oddOf(m, sel)), p.stake,
      r.settled ? (r.win ? 'Выигрыш' : 'Проигрыш') : 'В игре',
      r.settled ? Math.round(r.profit) : '']);
  }));
  const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  downloadFile('homemade-betting.csv', csv, 'text/csv;charset=utf-8');
}

/* ============ ACTIONS ============ */
function togglePick(marketId, selectionId) {
  const i = UI.slip.findIndex(p => p.marketId === marketId && p.selectionId === selectionId);
  if (i >= 0) UI.slip.splice(i, 1);
  else {
    // один исход на рынок
    UI.slip = UI.slip.filter(p => p.marketId !== marketId);
    UI.slip.push({ marketId, selectionId, stake: 100 });
    toast('Добавлено в прогноз');
  }
}
function submitBet() {
  const name = (getVal('#bet-name') || UI.name || '').trim();
  if (!name) { toast('Введите имя'); return; }
  if (!UI.slip.length) { toast('Выберите хотя бы один исход'); return; }
  const picks = UI.slip.filter(p => (Number(p.stake) || 0) > 0).map(p => {
    const { m, sel } = selInfo(p.marketId, p.selectionId);
    return { marketId: p.marketId, selectionId: p.selectionId, stake: Number(p.stake) || 0, oddAtBet: sel ? sel.odd : 1 };
  });
  if (!picks.length) { toast('Укажите суммы прогнозов'); return; }
  setName(name);
  const key = name.trim().toLowerCase();
  UI.slip = []; UI.editingBetId = null;
  commit(t => {
    const ex = t.bets.find(b => b.participant.trim().toLowerCase() === key);
    if (ex) { ex.picks = picks; ex.editedAt = Date.now(); }
    else t.bets.push({ id: uid('bet'), participant: name, picks, createdAt: Date.now() });
  });
  toast('Прогноз сохранён ✓'); go('me');
}
function loadMyBet() {
  const name = (getVal('#bet-name') || getVal('#me-name') || UI.name || '').trim();
  if (!name) { toast('Введите имя'); return; }
  const bet = findBet(name);
  if (!bet) { toast('Прогноз не найден'); return; }
  setName(name);
  UI.slip = bet.picks.map(p => ({ marketId: p.marketId, selectionId: p.selectionId, stake: p.stake }));
  go('bet');
}
function saveResult() {
  const outcomes = {};
  S.match.markets.forEach(mk => { const v = getVal('#res_' + mk.id); if (v) outcomes[mk.id] = v; });
  const scoreText = getVal('#final_score') || '';
  closeModal();
  commit(t => { t.match.result = { outcomes, scoreText }; t.match.status = 'finished'; });
  toast('Матч рассчитан ✓'); go('leaders');
}
async function newMatch() {
  if (!confirm('Текущий матч будет перенесён в историю, начнётся новый. Продолжить?')) return;
  if (cloudOn()) await cloudPull(true);            // свежие данные перед архивацией
  const snap = (S.match.status === 'finished' || S.bets.length) ? buildHistorySnapshot() : null;
  const players = { a: { ...S.match.playerA }, b: { ...S.match.playerB } };
  const mode = S.match.oddsMode, comm = S.match.commissionPct;
  const markets = JSON.parse(JSON.stringify(S.match.markets));
  commit(t => {
    if (snap) t.history.push(snap);
    const f = seedState().match;
    f.playerA = players.a; f.playerB = players.b;
    f.oddsMode = mode; f.commissionPct = comm;
    f.markets = markets; f.result = null; f.status = 'open';
    t.match = f; t.bets = [];
  });
  toast('Новый матч создан'); go('match');
}
function buildHistorySnapshot() {
  const winMk = S.match.markets.find(x => x.kind === 'winner');
  const winSel = winMk && S.match.result && S.match.result.outcomes ? winMk.selections.find(s => s.id === S.match.result.outcomes[winMk.id]) : null;
  const lb = leaderboard().map(r => ({ name: r.name, profit: Math.round(r.profit), won: r.won, settled: r.settled }));
  return {
    title: S.match.title, playerA: S.match.playerA.name, playerB: S.match.playerB.name,
    dateStr: new Date(S.match.dateISO).toLocaleDateString('ru-RU'),
    winner: winSel ? winSel.label : '—',
    scoreText: S.match.result ? S.match.result.scoreText : '',
    bank: totalBank(), participants: participants().length, leaderboard: lb
  };
}

/* ============ delegated events ============ */
function getVal(sel) { const el = $(sel); return el ? el.value : ''; }
function setName(n) { UI.name = n; localStorage.setItem('hmb_name', n); }

function onClick(e) {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, d = t.dataset;
  switch (a) {
    case 'go': go(d.view); break;
    case 'theme': toggleTheme(); break;
    case 'pick': togglePick(d.market, d.sel); render(); break;
    case 'quick-stake': UI.slip.forEach(p => p.stake = Number(d.val)); render(); break;
    case 'slip-remove': UI.slip.splice(Number(d.idx), 1); render(); break;
    case 'submit-bet': submitBet(); break;
    case 'load-my-bet': loadMyBet(); break;
    case 'my-ticket': { const b = findBet(UI.name); if (b) modalTicket(b); break; }
    case 'del-my-bet': { const key = (UI.name || '').trim().toLowerCase(); if (findBet(UI.name) && confirm('Удалить ваш прогноз?')) commit(t => { t.bets = t.bets.filter(b => b.participant.trim().toLowerCase() !== key); }); break; }
    case 'open-invite': modalInvite(); break;
    case 'open-import': modalImport(); break;
    case 'import-save': doImport(); break;
    case 'close-modal': closeModal(); break;
    case 'modal-backdrop': if (e.target === t) closeModal(); break;
    case 'copy': { const el = $('#' + d.copy); copyText(el ? (el.value || el.textContent) : ''); break; }
    case 'native-share': if (navigator.share) navigator.share({ title: 'HomeMade Betting', url: inviteURL() }).catch(() => {}); break;
    case 'sync-info': modalSync(); break;
    case 'cloud-refresh': cloudPull(true); toast('Обновлено'); closeModal(); break;
    case 'admin-unlock': if (getVal('#admin-pin') === S.settings.adminPin) { UI.adminUnlocked = true; sessionStorage.setItem('hmb_admin', '1'); render(); } else toast('Неверный PIN'); break;
    case 'set-status': { const st = d.status; commit(t => { t.match.status = st; }); toast(st === 'open' ? 'Приём открыт' : 'Приём закрыт'); break; }
    case 'set-mode': { const md = d.mode; commit(t => { t.match.oddsMode = md; }); break; }
    case 'edit-match': modalMatchEditor(); break;
    case 'save-match': saveMatch(); break;
    case 'open-result': modalResult(); break;
    case 'save-result': saveResult(); break;
    case 'reopen': closeModal(); commit(t => { t.match.status = 'open'; t.match.result = null; }); break;
    case 'add-market': modalAddMarket(); break;
    case 'add-market-save': addMarket(); break;
    case 'del-market': { const mid = d.market; if (confirm('Удалить рынок?')) commit(t => { t.match.markets = t.match.markets.filter(m => m.id !== mid); }); break; }
    case 'add-sel': addSel(d.market); break;
    case 'del-sel': delSel(d.market, d.sel); break;
    case 'del-bet': { const id = d.id; if (confirm('Удалить прогноз участника?')) commit(t => { t.bets = t.bets.filter(b => b.id !== id); }); break; }
    case 'export-json': exportJSON(); break;
    case 'export-csv': exportCSV(); break;
    case 'results-link': showLink('Ссылка на результаты', resultsURL()); break;
    case 'set-pin': modalSetPin(); break;
    case 'save-pin': { const pin = (getVal('#new-pin') || '').trim(); S.settings.adminPin = pin; S.settings.noPin = !pin; UI.adminUnlocked = true; sessionStorage.setItem('hmb_admin', '1'); saveState(); closeModal(); render(); toast(pin ? 'PIN обновлён' : 'Защита снята'); break; }
    case 'new-match': newMatch(); break;
  }
}
function onInput(e) {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, d = t.dataset;
  if (a === 'slip-stake') { const i = Number(d.idx); if (UI.slip[i]) UI.slip[i].stake = Number(t.value) || 0; }
  else if (a === 'sel-odd') { const s = findSel(d.market, d.sel); if (s) { s.odd = Math.max(1.01, Number(t.value) || 1.01); saveState(); } }
  else if (a === 'sel-label') { const s = findSel(d.market, d.sel); if (s) { s.label = t.value; saveState(); } }
}
function onChange(e) {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, mid = t.dataset.market, sid = t.dataset.sel;
  if (a === 'me-name') { setName(t.value.trim()); render(); }
  else if (a === 'slip-stake') render();
  else if (a === 'sel-odd') { const val = Math.max(1.01, Number(t.value) || 1.01); commit(x => { const m = x.match.markets.find(y => y.id === mid); const s = m && m.selections.find(y => y.id === sid); if (s) s.odd = val; }); }
  else if (a === 'sel-label') { const val = t.value; commit(x => { const m = x.match.markets.find(y => y.id === mid); const s = m && m.selections.find(y => y.id === sid); if (s) s.label = val; }); }
}
function findSel(mid, sid) { const m = S.match.markets.find(x => x.id === mid); return m && m.selections.find(x => x.id === sid); }
function addSel(mid) {
  const sel = { id: uid('sel'), label: 'Новый исход', odd: 2.00 };
  commit(t => { const m = t.match.markets.find(x => x.id === mid); if (m) m.selections.push(sel); });
}
function delSel(mid, sid) {
  commit(t => { const m = t.match.markets.find(x => x.id === mid); if (m) m.selections = m.selections.filter(s => s.id !== sid); });
}
function addMarket() {
  const name = getVal('#nm_name').trim(); if (!name) { toast('Введите название'); return; }
  const kind = getVal('#nm_kind') || 'custom';
  const mk = { id: uid('mk'), name, kind, selections: [] };
  closeModal();
  commit(t => { t.match.markets.push(mk); });
}
function saveMatch() {
  const cur = S.match;
  const v = {
    pa: getVal('#e_pa') || cur.playerA.name, pb: getVal('#e_pb') || cur.playerB.name,
    sa: getVal('#e_sa'), sb: getVal('#e_sb'),
    sport: getVal('#e_sport') || cur.sport, fmt: getVal('#e_fmt') || cur.format,
    wins: Number(getVal('#e_wins')) || cur.winsTarget, venue: getVal('#e_venue'),
    comm: clamp(Number(getVal('#e_comm')) || 0, 0, 50), date: getVal('#e_date')
  };
  // часовой пояс + пересчёт абсолютного момента из «настенного» времени зоны
  let off = Number(getVal('#e_tz'));
  if (!TZ_LIST.some(z => z.off === off)) off = matchTzOff(cur);
  const tzLabel = (TZ_LIST.find(z => z.off === off) || {}).label || DEFAULT_TZ_LABEL;
  let iso = cur.dateISO;
  if (v.date) {
    const parts = v.date.split('T');
    const [Y, Mo, D] = parts[0].split('-').map(Number);
    const [H, Mi] = (parts[1] || '00:00').split(':').map(Number);
    iso = new Date(Date.UTC(Y, Mo - 1, D, H, Mi) - off * 60000).toISOString();
  }
  closeModal();
  commit(t => {
    t.match.playerA.name = v.pa; t.match.playerB.name = v.pb;
    t.match.playerA.sub = v.sa; t.match.playerB.sub = v.sb;
    t.match.sport = v.sport; t.match.format = v.fmt; t.match.winsTarget = v.wins;
    t.match.venueText = v.venue; t.match.commissionPct = v.comm;
    t.match.dateISO = iso; t.match.tzOffset = off; t.match.tzLabel = tzLabel;
  });
  toast('Матч обновлён');
}
function doImport() {
  const txt = getVal('#import-area') || '';
  const incoming = [];
  txt.split(/\r?\n/).forEach(line => {
    line = line.trim(); if (!line) return;
    const code = line.startsWith('HMB1:') ? line.slice(5) : line;
    const obj = decObj(code);
    if (obj && obj.participant && Array.isArray(obj.picks)) incoming.push(obj);
  });
  closeModal();
  if (!incoming.length) { toast('Коды не распознаны'); return; }
  commit(t => {
    incoming.forEach(obj => {
      const key = obj.participant.trim().toLowerCase();
      const ex = t.bets.find(b => b.participant.trim().toLowerCase() === key);
      if (ex) ex.picks = obj.picks;
      else t.bets.push({ id: uid('bet'), participant: obj.participant, picks: obj.picks, createdAt: Date.now() });
    });
  });
  toast('Импортировано: ' + incoming.length);
}
function showLink(title, url) {
  openModal('<h3>' + esc(title) + '</h3><div class="code-box" id="share-link" style="margin:12px 0">' + esc(url) + '</div>' +
    '<button class="btn primary block" data-act="copy" data-copy="share-link">' + icon('copy') + ' Копировать</button>');
}

/* ============ theme ============ */
function themeIsDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return !window.matchMedia || window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
  const meta = $('#theme-color-meta'); if (meta) meta.setAttribute('content', themeIsDark() ? '#070b14' : '#eef1f7');
}
function toggleTheme() { S.settings.theme = themeIsDark() ? 'light' : 'dark'; saveState(); applyTheme(); renderChrome(); }

/* ============ countdown ============ */
function startCountdown() {
  setInterval(() => {
    const el = $('#countdown'); if (!el) return;
    let diff = new Date(S.match.dateISO).getTime() - Date.now();
    if (S.match.status === 'finished') { el.textContent = 'Финал'; return; }
    if (diff <= 0) { el.textContent = 'Идёт'; return; }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const mi = Math.floor(diff / 6e4); diff -= mi * 6e4;
    const s = Math.floor(diff / 1e3);
    const p = (x) => String(x).padStart(2, '0');
    el.textContent = (d > 0 ? d + 'д ' : '') + p(h) + ':' + p(mi) + ':' + p(s);
  }, 1000);
}

/* ============ sharing on load (hash) ============ */
function handleHash() {
  const hash = location.hash || '';
  const clean = () => history.replaceState(null, '', location.pathname + location.search);
  if (hash.startsWith('#room=')) { setRoom(decodeURIComponent(hash.slice(6))); clean(); return; }
  if (hash.startsWith('#i=')) {
    const obj = decObj(hash.slice(3));
    if (obj && obj.match) {
      const incoming = obj.match;
      const isNew = !S.match || S.match.id !== incoming.id;
      if (isNew) {
        if (!S.bets.length || confirm('Открыть присланный матч? Текущие локальные прогнозы будут заменены.')) {
          S.match = incoming; S.bets = []; saveState();
        }
      }
    }
    clean();
  } else if (hash.startsWith('#r=')) {
    const obj = decObj(hash.slice(3));
    if (obj && obj.match) {
      if (!S.bets.length || S.match.id === obj.match.id || confirm('Показать присланные результаты? Локальные данные будут заменены.')) {
        S.match = obj.match; S.bets = obj.bets || []; saveState(); UI.view = 'leaders';
      }
    }
    clean();
  }
}

/* ============ PWA ============ */
function injectPWA() {
  const head = document.head;
  const add = (tag, attrs) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); head.appendChild(e); return e; };
  if (!$('meta[name="viewport"]')) add('meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,viewport-fit=cover' });
  const tc = add('meta', { name: 'theme-color', content: '#070b14' }); tc.id = 'theme-color-meta';
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'HomeMade Betting' });
  const iconSVG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0a1122"/><circle cx="256" cy="256" r="150" fill="none" stroke="#37e0ff" stroke-width="18"/><path d="M256 106v300M106 256h300" stroke="#37e0ff" stroke-width="10" opacity=".5"/><text x="256" y="300" font-family="Arial" font-size="150" font-weight="bold" fill="#ffcc3f" text-anchor="middle">HB</text></svg>');
  add('link', { rel: 'apple-touch-icon', href: iconSVG });
  add('link', { rel: 'icon', href: iconSVG });
  if (!$('link[rel="manifest"]')) try {
    const manifest = {
      name: 'HomeMade Betting', short_name: 'HMB', display: 'standalone',
      background_color: '#070b14', theme_color: '#070b14', start_url: '.', scope: '.',
      description: 'Домашние дружеские матчи и прогнозы (виртуальные).',
      icons: [{ src: iconSVG, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    add('link', { rel: 'manifest', href: URL.createObjectURL(blob) });
  } catch (e) {}
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ============ routing / render ============ */
function go(view) { UI.view = view; if (view !== 'match') UI.slip = UI.slip; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function render() {
  renderChrome();
  let html = '';
  switch (UI.view) {
    case 'bet': html = viewBet(); break;
    case 'leaders': html = viewLeaders(); break;
    case 'history': html = viewHistory(); break;
    case 'admin': html = viewAdmin(); break;
    case 'me': html = viewMe(); break;
    default: html = viewMatch();
  }
  $('#view').innerHTML = html;
}

/* ============ init ============ */
function init() {
  injectPWA();
  handleHash();
  applyTheme();
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  startCountdown();
  render();
  startCloudSync();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
