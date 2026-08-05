/* ============ HOMEMADE BETTING — views (bet / me / leaders / history) ============ */

function selInfo(marketId, selectionId) {
  const m = S.match.markets.find(x => x.id === marketId);
  const sel = m && m.selections.find(x => x.id === selectionId);
  return { m, sel };
}

/* ============ VIEW: BET (сделать / изменить прогноз) ============ */
function viewBet() {
  const open = S.match.status === 'open';
  if (!open) {
    return banner('Приём прогнозов закрыт', 'Администратор закрыл приём. Загляни в «Рейтинг», чтобы увидеть расчёт.') +
      leadersPreview();
  }
  let html = '<div class="section-title">' + icon('bet') + ' Ваш прогноз <span class="line"></span></div>';
  html += '<div class="card pad">' +
    '<label class="field"><span class="cap">Ваше имя</span>' +
    '<input id="bet-name" placeholder="Например, Андрей" value="' + esc(UI.name) + '" autocomplete="off"></label>' +
    '<div class="row"><button class="btn ghost sm" data-act="load-my-bet">' + icon('edit') + ' Загрузить мой прогноз для правки</button></div>' +
  '</div>';

  if (!UI.slip.length) {
    html += '<div class="empty"><div class="big">🎯</div>Пока ничего не выбрано.<br>Открой вкладку «Матч» и нажми на исходы.<br><br>' +
      '<button class="btn primary" data-act="go" data-view="match">К рынкам матча</button></div>';
    return html;
  }

  let total = 0, potential = 0;
  const rows = UI.slip.map((p, i) => {
    const { m, sel } = selInfo(p.marketId, p.selectionId);
    if (!m || !sel) return '';
    const odd = oddOf(m, sel);
    const stake = Number(p.stake) || 0;
    total += stake; potential += stake * odd;
    return '<div class="slip-item">' +
      '<div class="info"><b>' + esc(sel.label) + '</b><span>' + esc(m.name) + '</span></div>' +
      '<span class="odd">' + fmtOdd(odd) + '</span>' +
      '<span class="stk"><input type="number" min="0" step="10" inputmode="numeric" value="' + stake + '" data-act="slip-stake" data-idx="' + i + '"></span>' +
      '<button class="rm" data-act="slip-remove" data-idx="' + i + '" aria-label="Убрать">' + icon('close') + '</button>' +
    '</div>';
  }).join('');

  html += '<div class="card pad" style="margin-top:12px">' + rows +
    '<div class="row" style="margin-top:12px">' +
      ['100', '250', '500', '1000'].map(v => '<button class="btn ghost sm" data-act="quick-stake" data-val="' + v + '">' + v + '</button>').join('') +
    '</div>' +
    '<div class="row" style="margin-top:14px;align-items:center">' +
      '<div><div class="hint">Сумма прогноза</div><div class="num" style="font-size:22px;font-weight:700;font-family:Oswald">' + fmtMoney(total) + '</div></div>' +
      '<div style="text-align:right"><div class="hint">Возможный возврат</div><div class="num" style="font-size:22px;font-weight:700;font-family:Oswald;color:var(--gold)">' + fmtMoney(potential) + '</div></div>' +
    '</div>' +
  '</div>';

  html += '<div class="row" style="margin-top:14px">' +
    '<button class="btn ghost" data-act="go" data-view="match">+ Ещё исходы</button>' +
    '<button class="btn green" data-act="submit-bet">' + icon('check') + ' Сохранить прогноз</button>' +
  '</div>';
  html += '<p class="hint" style="text-align:center;margin-top:10px">Суммы виртуальные — только для расчёта. Прогноз можно менять, пока приём открыт.</p>';
  return html;
}

/* ============ VIEW: ME (мои прогнозы) ============ */
function viewMe() {
  let html = '<div class="section-title">' + icon('users') + ' Мои прогнозы <span class="line"></span></div>';
  html += '<div class="card pad"><label class="field"><span class="cap">Имя участника</span>' +
    '<input id="me-name" placeholder="Введите имя" value="' + esc(UI.name) + '" data-act="me-name"></label></div>';
  const bet = findBet(UI.name);
  if (!UI.name) { html += '<p class="empty">Введите имя, чтобы увидеть свой прогноз.</p>'; return html; }
  if (!bet) {
    html += '<div class="empty"><div class="big">🤔</div>Прогноза с именем «' + esc(UI.name) + '» пока нет.<br><br>' +
      (S.match.status === 'open' ? '<button class="btn primary" data-act="go" data-view="bet">Сделать прогноз</button>' : '') + '</div>';
    return html;
  }
  html += betCoupon(bet, true);
  return html;
}

function betCoupon(bet, mine) {
  const sum = betSummary(bet);
  const finished = S.match.status === 'finished';
  const rows = bet.picks.map(p => {
    const { m, sel } = selInfo(p.marketId, p.selectionId);
    if (!m || !sel) return '';
    const r = pickResult(p);
    const odd = r.settled ? r.odd : oddOf(m, sel);
    let tag = '<span class="badge-tag">в игре</span>';
    if (r.settled) tag = r.win
      ? '<span class="pos">выигрыш +' + fmtMoney(p.stake * (odd - 1)) + '</span>'
      : '<span class="neg">−' + fmtMoney(p.stake) + '</span>';
    return '<tr><td>' + esc(sel.label) + '<div class="hint">' + esc(m.name) + '</div></td>' +
      '<td class="num">' + fmtOdd(odd) + '</td><td class="num">' + fmtMoney(p.stake) + '</td><td class="num">' + tag + '</td></tr>';
  }).join('');
  let head = '<div class="market-head"><span class="mt">' + esc(bet.participant) + '</span>';
  if (finished) head += '<span class="' + (sum.profit >= 0 ? 'pos' : 'neg') + '" style="font-family:Oswald;font-size:20px">' + fmtSigned(sum.profit) + '</span>';
  else head += '<span class="chip">Ставка: <b>' + fmtMoney(sum.staked) + '</b></span>';
  head += '</div>';
  let html = '<div class="card pad">' + head +
    '<div class="tbl-wrap" style="margin-top:8px;border:none"><table><thead><tr><th>Исход</th><th class="num">Кэф</th><th class="num">Сумма</th><th class="num">Итог</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
  if (mine && S.match.status === 'open') {
    html += '<div class="row" style="margin-top:12px">' +
      '<button class="btn ghost sm" data-act="load-my-bet">' + icon('edit') + ' Изменить</button>' +
      '<button class="btn ghost sm" data-act="my-ticket">' + icon('share') + ' Код для админа</button>' +
      '<button class="btn danger sm" data-act="del-my-bet">Удалить</button>' +
    '</div>';
  }
  if (finished) {
    html += '<div class="row" style="margin-top:6px"><div class="chip">Угадано: <b>' + sum.won + ' / ' + sum.settled + '</b></div>' +
      '<div class="chip">Возврат: <b>' + fmtMoney(sum.returned) + '</b></div></div>';
  }
  html += '</div>';
  return html;
}

/* ============ VIEW: LEADERS (рейтинг) ============ */
function viewLeaders() {
  let html = '<div class="section-title">' + icon('trophy') + ' Рейтинг матча <span class="line"></span></div>';
  html += hallOfFame();
  if (S.match.status !== 'finished') {
    html += banner('Идёт приём / расчёт', 'Итоговая прибыль появится после ввода результата администратором. Пока — суммы в игре и популярность исходов.');
    html += leadersPreview() + popularityBlock();
    return html;
  }
  const lb = leaderboard();
  if (!lb.length) { html += '<p class="empty">Ставок не было.</p>'; return html; }
  html += '<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Участник</th><th class="num">Ставка</th><th class="num">Возврат</th><th class="num">Точность</th><th class="num">Прибыль</th></tr></thead><tbody>' +
    lb.map((r, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || (i + 1);
      return '<tr><td class="rank">' + (typeof medal === 'string' && medal.length > 1 ? '<span class="medal">' + medal + '</span>' : medal) + '</td>' +
        '<td><b>' + esc(r.name) + '</b></td>' +
        '<td class="num">' + fmtMoney(r.staked) + '</td>' +
        '<td class="num">' + fmtMoney(r.returned) + '</td>' +
        '<td class="num">' + r.won + '/' + r.settled + '</td>' +
        '<td class="num ' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(r.profit) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  html += popularityBlock();
  return html;
}

function leadersPreview() {
  const lb = leaderboard();
  if (!lb.length) return '<p class="empty">Прогнозов пока нет.</p>';
  return '<div class="tbl-wrap"><table><thead><tr><th>Участник</th><th class="num">Исходов</th><th class="num">Сумма в игре</th></tr></thead><tbody>' +
    lb.map(r => '<tr><td><b>' + esc(r.name) + '</b></td><td class="num">' + r.picks + '</td><td class="num">' + fmtMoney(r.staked) + '</td></tr>').join('') +
    '</tbody></table></div>';
}

function popularityBlock() {
  const rows = [];
  S.match.markets.forEach(mk => {
    const { map, pool } = marketStakes(mk.id);
    if (pool <= 0) return;
    mk.selections.forEach(sel => {
      const st = map[sel.id] || 0;
      if (st > 0) rows.push({ name: mk.name, label: sel.label, st, pct: st / pool * 100 });
    });
  });
  if (!rows.length) return '';
  rows.sort((a, b) => b.st - a.st);
  return '<div class="section-title">' + icon('chart') + ' Популярность исходов <span class="line"></span></div>' +
    '<div class="card pad">' + rows.slice(0, 8).map(r =>
      '<div style="margin:8px 0"><div class="row" style="align-items:center"><div class="info" style="flex:1"><b>' + esc(r.label) + '</b> <span class="hint">' + esc(r.name) + '</span></div>' +
      '<div class="num" style="font-weight:700;font-family:Oswald">' + Math.round(r.pct) + '%</div></div>' +
      '<div style="height:8px;border-radius:6px;background:var(--surface-3);overflow:hidden;margin-top:4px"><div style="height:100%;width:' + r.pct.toFixed(1) + '%;background:linear-gradient(90deg,var(--blue),var(--green))"></div></div></div>').join('') +
    '</div>';
}

/* ============ VIEW: HISTORY ============ */
function viewHistory() {
  let html = '<div class="section-title">' + icon('history') + ' История матчей <span class="line"></span></div>';
  html += hallOfFame();
  if (!S.history.length) {
    html += '<div class="empty"><div class="big">📜</div>Сыгранных матчей пока нет.<br>Завершённые матчи попадают сюда из админ-панели.</div>';
    return html;
  }
  html += S.history.slice().reverse().map(h => {
    const top = (h.leaderboard || [])[0];
    return '<div class="card pad" style="margin-top:12px">' +
      '<div class="market-head"><span class="mt">' + esc(h.title || (h.playerA + ' vs ' + h.playerB)) + '</span>' +
      '<span class="badge">' + esc(h.dateStr || '') + '</span></div>' +
      '<div class="row" style="margin-top:6px">' +
        '<div class="chip">Победитель: <b>' + esc(h.winner || '—') + '</b></div>' +
        (h.scoreText ? '<div class="chip">Счёт: <b>' + esc(h.scoreText) + '</b></div>' : '') +
        '<div class="chip">Банк: <b>' + fmtMoney(h.bank || 0) + '</b></div>' +
        '<div class="chip">Участников: <b>' + (h.participants || 0) + '</b></div>' +
      '</div>' +
      (top ? '<div class="row" style="margin-top:8px"><div class="chip">🥇 <b>' + esc(top.name) + '</b> ' + fmtSigned(top.profit) + '</div></div>' : '') +
    '</div>';
  }).join('');
  return html;
}

/* Зал славы — агрегат по истории (история побед участников). */
function hallOfFame() {
  const agg = {};
  const add = (name, profit, win) => {
    const k = name.toLowerCase();
    if (!agg[k]) agg[k] = { name, matches: 0, profit: 0, wins: 0 };
    agg[k].matches++; agg[k].profit += profit; if (win) agg[k].wins++;
  };
  S.history.forEach(h => {
    (h.leaderboard || []).forEach((r, i) => add(r.name, r.profit || 0, i === 0));
  });
  const list = Object.values(agg).sort((a, b) => b.wins - a.wins || b.profit - a.profit);
  if (!list.length) return '';
  return '<div class="card pad"><div class="market-head"><span class="mt">🏆 Зал славы</span>' +
    '<span class="badge">' + S.history.length + ' матч(ей)</span></div>' +
    '<div class="tbl-wrap" style="border:none;margin-top:6px"><table><thead><tr><th>Игрок</th><th class="num">Матчей</th><th class="num">Побед</th><th class="num">Σ прибыль</th></tr></thead><tbody>' +
    list.map(r => '<tr><td><b>' + esc(r.name) + '</b></td><td class="num">' + r.matches + '</td><td class="num">' + r.wins + '</td><td class="num ' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(r.profit) + '</td></tr>').join('') +
    '</tbody></table></div></div>';
}

function banner(title, text) {
  return '<div class="card pad" style="border-color:var(--line-2);margin-bottom:12px">' +
    '<b style="font-family:Oswald;font-size:18px;text-transform:uppercase">' + esc(title) + '</b>' +
    '<p class="hint" style="margin:6px 0 0">' + esc(text) + '</p></div>';
}
