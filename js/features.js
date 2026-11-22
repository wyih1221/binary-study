/* ==========================================================================
   二进制书房 · 各页面交互
   按 location 识别页面，逐页增强；数据全部落在 localStorage
   ========================================================================== */
(function () {
  'use strict';

  var S = window.BH.store, toast = window.BH.toast, esc = window.BH.esc;
  var DATA = window.BH_DATA || { questions: [] };
  var QS = DATA.questions || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // 绑定按钮点击：按钮常被包在 <a href="本页"> 里，必须拦掉默认跳转
  function bindBtn(el, fn) {
    if (!el) return;
    el.setAttribute('data-bh-act', '1');
    el.addEventListener('click', function (e) {
      if (el.closest('a')) e.preventDefault();
      fn(e);
    });
  }

  // 找到包含指定文案的最内层容器（用作空态替换目标）
  function pickEmpty(root, text) {
    var hit = null;
    $$('*', root).forEach(function (el) {
      if (el.textContent.indexOf(text) < 0) return;
      if (el.children.length && [].some.call(el.children, function (c) { return c.textContent.indexOf(text) >= 0; })) return;
      hit = el;
    });
    return hit;
  }

  /* ============================ 专项练习 ============================ */
  function initPractice() {
    if (!$('#pracStem')) return;

    var answers = S.get('answers', {});       // { qid: {pick, ok} }
    var favs = S.get('fav', []);
    var subject = '全部';
    var cur = 0;

    var qParam = new URLSearchParams(location.search).get('q');
    var sParam = new URLSearchParams(location.search).get('subject');
    if (sParam) subject = sParam;

    var list = [];

    function rebuild() {
      list = subject === '全部' ? QS.slice() : QS.filter(function (q) { return q.subject === subject; });
      if (qParam) {
        var i = list.findIndex(function (q) { return q.id === qParam; });
        if (i >= 0) { cur = i; qParam = null; }
      }
      cur = Math.min(cur, Math.max(0, list.length - 1));
    }

    function chips() {
      var box = $('#pracSubjects');
      var subs = ['全部'].concat(QS.map(function (q) { return q.subject; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      box.className = 'bh-chips mt-3';
      box.innerHTML = subs.map(function (s) {
        return '<button type="button" class="bh-chip' + (s === subject ? ' is-on' : '') + '" data-sub="' + esc(s) + '">' + esc(s) + '</button>';
      }).join('');
      box.onclick = function (e) {
        var b = e.target.closest('.bh-chip');
        if (!b) return;
        subject = b.getAttribute('data-sub');
        cur = 0;
        rebuild(); chips(); render();
      };
    }

    function render() {
      var q = list[cur];
      if (!q) {
        $('#pracStem').textContent = '这个科目下暂时没有题目';
        $('#pracOpts').innerHTML = '';
        return;
      }
      var rec = answers[q.id];
      $('#pracIdx').textContent = '第 ' + (cur + 1) + ' 题 / 共 ' + list.length;
      $('#pracType').textContent = q.type;
      $('#pracLevel').textContent = q.level;
      $('#pracSub').textContent = q.subject + ' · ' + q.chapter;
      $('#pracStem').textContent = q.stem;
      $('#pracFav').classList.toggle('is-on', favs.indexOf(q.id) >= 0);

      $('#pracOpts').innerHTML = q.options.map(function (o) {
        var cls = 'bh-opt';
        if (rec) {
          if (o.key === q.answer) cls += ' is-right';
          else if (o.key === rec.pick) cls += ' is-wrong';
        }
        return '<button type="button" class="' + cls + '" data-k="' + o.key + '"' + (rec ? ' disabled' : '') + '>' +
          '<span class="bh-opt-k">' + o.key + '</span><span>' + esc(o.text) + '</span></button>';
      }).join('');

      var ana = $('#pracAna');
      if (rec) {
        var picked = q.options.filter(function (o) { return o.key === rec.pick; })[0];
        ana.hidden = false;
        ana.innerHTML = '<b>' + (rec.ok ? '答对了。' : '答错了，正确答案是 ' + q.answer + '。') + '</b>' +
          (picked ? esc(picked.analysis) : '') +
          '<br><b>解析：</b>' + q.options.filter(function (o) { return o.key === q.answer; })[0].analysis;
      } else {
        ana.hidden = true;
        ana.innerHTML = '';
      }
      grid();
    }

    function grid() {
      $('#pracGrid').innerHTML = list.map(function (q, i) {
        var r = answers[q.id];
        var cls = 'bh-side-num';
        if (r) cls += r.ok ? ' is-done' : ' is-wrong';
        if (i === cur) cls += ' is-cur';
        return '<button type="button" class="' + cls + '" data-i="' + i + '">' + (i + 1) + '</button>';
      }).join('');
      var done = list.filter(function (q) { return answers[q.id]; }).length;
      var ok = list.filter(function (q) { return answers[q.id] && answers[q.id].ok; }).length;
      $('#pracStat').textContent = '已答 ' + done + ' / ' + list.length + ' · 正确 ' + ok;
    }

    $('#pracOpts').addEventListener('click', function (e) {
      var b = e.target.closest('.bh-opt');
      if (!b) return;
      var q = list[cur];
      if (!q || answers[q.id]) return;
      var k = b.getAttribute('data-k');
      var ok = k === q.answer;
      answers[q.id] = { pick: k, ok: ok, at: Date.now() };
      S.set('answers', answers);
      var wrong = S.get('wrong', []).filter(function (w) { return w.id !== q.id; });
      if (!ok) wrong.push({ id: q.id, at: Date.now(), pick: k });
      else if (wrong.length !== S.get('wrong', []).length) toast('已从错题本移除这道题', 'ok');
      S.set('wrong', wrong);
      render();
      toast(ok ? '答对了' : '答错了，已加入错题本', ok ? 'ok' : 'error');
    });

    $('#pracGrid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      cur = +b.getAttribute('data-i');
      render();
    });

    $('#pracPrev').addEventListener('click', function () {
      if (cur > 0) { cur--; render(); } else toast('已经是第一题');
    });
    $('#pracNext').addEventListener('click', function () {
      if (cur < list.length - 1) { cur++; render(); } else toast('已经是最后一题');
    });

    $('#pracFav').addEventListener('click', function () {
      var q = list[cur];
      if (!q) return;
      var i = favs.indexOf(q.id);
      if (i >= 0) { favs.splice(i, 1); toast('已取消收藏'); }
      else { favs.push(q.id); toast('已收藏'); }
      S.set('fav', favs);
      render();
    });

    $('#pracAi').addEventListener('click', function () {
      var q = list[cur];
      if (!q) return;
      var ana = $('#pracAna');
      ana.hidden = false;
      ana.innerHTML = '<b>AI 讲题</b><br><span class="bh-typing"></span>';
      var span = ana.querySelector('.bh-typing');
      var text = q.ai || '这道题的关键是抓住定义之间的数量关系。';
      var i = 0;
      clearInterval(ana._timer);
      ana._timer = setInterval(function () {
        i += 2;
        span.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(ana._timer);
      }, 22);
    });

    $('#pracSubmit').addEventListener('click', function () {
      var done = list.filter(function (q) { return answers[q.id]; }).length;
      var ok = list.filter(function (q) { return answers[q.id] && answers[q.id].ok; }).length;
      var rate = done ? Math.round(ok / done * 100) : 0;
      window.BH.modal({
        title: '交卷结果',
        body: '<div class="bh-result"><div class="bh-result-num">' + rate + '<em>%</em></div>' +
          '<p>共 ' + list.length + ' 题，已答 ' + done + ' 题，答对 ' + ok + ' 题</p>' +
          '<p class="bh-hint">' + (done < list.length ? '还有 ' + (list.length - done) + ' 题没做，未答题目不计入正确率。' : '全部完成，继续保持。') + '</p></div>',
        okText: '看看错题',
        cancelText: '继续练习',
        onOk: function () { location.href = 'mistakes.html'; }
      });
    });

    rebuild(); chips(); render();
  }

  /* ============================ 错题本 ============================ */
  function initMistakes() {
    var head = $('.v3-sec-head');
    if (!head) return;
    var listBox = head.nextElementSibling;
    var main = $('main');

    var items = S.get('wrong', []);
    if (!items.length && !S.get('seeded')) {
      items = [{ id: 'co-cache-16', pick: 'C', at: Date.now() - 864e5 },
               { id: 'os-schedule-hunger', pick: 'A', at: Date.now() - 36e5 }];
      S.set('wrong', items); S.set('seeded', 1);
    }
    var type = '全部', kw = '', sort = 'lib', compact = false;

    function pool() {
      return items.map(function (w) {
        var q = QS.filter(function (x) { return x.id === w.id; })[0];
        return q ? { w: w, q: q } : null;
      }).filter(Boolean);
    }

    function render() {
      var all = pool();
      // 统计
      var week = all.filter(function (x) { return Date.now() - x.w.at < 7 * 864e5; }).length;
      var subs = {};
      all.forEach(function (x) { subs[x.q.subject] = 1; });
      var types = {};
      all.forEach(function (x) { types[x.q.type] = 1; });

      var sub = $('.v3-sub', main);
      if (sub) sub.textContent = '共 ' + all.length + ' 道错题 · 从错误中学习，稳过每一场考试';
      var map = { '总错题': all.length + '道', '本周新增': week + '道',
                  '涉及题库': Object.keys(subs).length + '套', '涉及题型': Object.keys(types).length + '种' };
      $$('.v3-stat', main).forEach(function (st) {
        var lab = st.querySelector('.v3-stat-label');
        var val = st.querySelector('.v3-stat-val');
        if (lab && val && map[lab.textContent.trim()]) val.innerHTML = map[lab.textContent.trim()].replace(/(\d+)/, '$1<em></em>');
      });
      var banner = $('.v3-page-head ~ * b, main b');
      var sub2 = $('.v3-sub', main);
      if (sub2 && sub2.nextElementSibling) { }
      // 横幅数字
      $$('main b').forEach(function (b) { if (/道错题/.test(b.textContent)) b.textContent = all.length + ' 道错题'; });
      // 复习按钮
      $$('main button').forEach(function (btn) {
        if (/开始复习|立即复习/.test(btn.textContent)) {
          btn.disabled = all.length === 0;
          btn.classList.toggle('is-ready', all.length > 0);
        }
      });
      // 分组标题
      var title = head.querySelector('.v3-sec-title');
      if (title) {
        var groups = sort === 'lib' ? Object.keys(subs).length : (sort === 'type' ? Object.keys(types).length : all.length);
        title.innerHTML = '错题列表 <span class="ml-1.5 text-xs font-normal text-[var(--ink-faint)]">共 ' + all.length + ' 题 · ' + groups + ' 组</span>';
      }

      // 过滤
      var shown = all.filter(function (x) {
        if (type !== '全部' && x.q.type !== type) return false;
        if (kw && (x.q.stem + x.q.subject + x.q.chapter).toLowerCase().indexOf(kw) < 0) return false;
        return true;
      });
      if (sort === 'time') shown.sort(function (a, b) { return b.w.at - a.w.at; });
      else if (sort === 'type') shown.sort(function (a, b) { return a.q.type.localeCompare(b.q.type); });
      else shown.sort(function (a, b) { return a.q.subject.localeCompare(b.q.subject); });

      if (!listBox) return;
      listBox.className = 'pb-10';
      if (!shown.length) {
        listBox.innerHTML = '<div class="bh-empty"><b>' + (all.length ? '没有符合条件的错题' : '还没有错题') + '</b>' +
          (all.length ? '换个筛选条件试试' : '去专项练习做题，答错的题会自动收进来') +
          (all.length ? '' : '<br><br><a class="bh-mis-act is-main" href="practice.html">去刷题</a>') + '</div>';
        return;
      }
      listBox.innerHTML = '<div class="bh-mis-list' + (compact ? ' is-compact' : '') + '">' + shown.map(function (x) {
        var q = x.q;
        return '<article class="bh-mis-item" data-id="' + q.id + '">' +
          '<div class="bh-mis-top"><span class="bh-mis-tag">' + esc(q.subject) + '</span>' +
          '<span class="bh-mis-tag">' + esc(q.type) + '</span>' +
          '<span class="bh-mis-tag">' + esc(q.level) + '</span>' +
          '<span>' + esc(q.chapter) + '</span></div>' +
          '<p class="bh-mis-stem">' + esc(q.stem) + '</p>' +
          '<div class="bh-mis-ans"><span>你的答案 <span class="bad">' + esc(x.w.pick || '未选') + '</span></span>' +
          '<span>正确答案 <span class="good">' + q.answer + '</span></span></div>' +
          '<div class="bh-mis-foot"><a class="bh-mis-act is-main" href="practice.html?q=' + encodeURIComponent(q.id) + '">重做这题</a>' +
          '<button type="button" class="bh-mis-act" data-del="' + q.id + '">移出错题本</button></div>' +
          '</article>';
      }).join('') + '</div>';
    }

    if (listBox) {
      listBox.addEventListener('click', function (e) {
        var del = e.target.closest('[data-del]');
        if (!del) return;
        var id = del.getAttribute('data-del');
        items = S.get('wrong', []).filter(function (w) { return w.id !== id; });
        S.set('wrong', items);
        toast('已移出错题本');
        render();
      });
    }

    $$('.mis-filter-chip').forEach(function (c) {
      bindBtn(c, function () {
        $$('.mis-filter-chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        type = c.textContent.trim();
        render();
      });
    });

    var search = $('.mis-filter-search input');
    if (search) search.addEventListener('input', function () { kw = search.value.trim().toLowerCase(); render(); });

    $$('main button').forEach(function (b) {
      var t = b.textContent.trim();
      if (t === '按题库' || t === '按题型' || t === '按时间') {
        bindBtn(b, function () {
          sort = t === '按题库' ? 'lib' : (t === '按题型' ? 'type' : 'time');
          $$('main button').forEach(function (x) {
            if (/^(按题库|按题型|按时间)$/.test(x.textContent.trim())) {
              var on = x === b;
              x.style.background = on ? 'var(--grape)' : 'transparent';
              x.style.color = on ? '#fff' : 'var(--ink-soft)';
              x.style.boxShadow = on ? '1px 1px 0 var(--grape-deep)' : 'none';
            }
          });
          render();
        });
      }
      if (/开始复习|立即复习/.test(t)) {
        bindBtn(b, function () {
          var all = pool();
          if (!all.length) return;
          location.href = 'practice.html?q=' + encodeURIComponent(all[0].q.id);
        });
      }
      if (t === '紧凑显示') {
        bindBtn(b, function () {
          compact = !compact;
          var span = b.querySelector('span');
          if (span) span.textContent = compact ? '舒适显示' : '紧凑显示';
          render();
        });
      }
      if (t === '全部题库') {
        bindBtn(b, function () { toast('当前只有官方真题一个题库'); });
      }
    });

    render();
  }

  /* ============================ 题库 ============================ */
  function initLibrary() {
    var main = $('main');
    if (!main) return;
    var tabWrap = main.querySelector('.mt-2.inline-flex');
    var row = main.querySelector('.mb-4.flex.flex-wrap.items-center.gap-3');
    var secHead = main.querySelector('.v3-sec-head');
    var listBox = secHead ? secHead.nextElementSibling : null;
    if (!tabWrap || !listBox) return;

    var origRow = row ? row.innerHTML : '';
    var tabs = $$('button', tabWrap);
    var tabNames = tabs.map(function (b) { return b.textContent.trim(); });
    var active = '官方题库';
    var subject = '全部';
    var kw = '';

    function styleTabs() {
      tabs.forEach(function (b) {
        var on = b.textContent.trim() === active;
        b.style.background = on ? 'var(--paper)' : 'transparent';
        b.style.color = on ? 'var(--grape-deep)' : 'var(--ink-soft)';
        b.style.boxShadow = on ? '3px 3px 0 var(--ink)' : 'none';
      });
    }

    function stats() {
      var ans = S.get('answers', {});
      var done = Object.keys(ans).length;
      var ok = Object.keys(ans).filter(function (k) { return ans[k].ok; }).length;
      $$('.v3-stat', main).forEach(function (st) {
        var lab = st.querySelector('.v3-stat-label');
        var val = st.querySelector('.v3-stat-val');
        if (!lab || !val) return;
        var name = lab.textContent.trim();
        if (name === '已解析题目') val.innerHTML = QS.length + '<em>题</em>';
        else if (name === '平均正确率') val.innerHTML = done ? Math.round(ok / done * 100) + '<em>%</em>' : '—';
      });
    }

    function renderRow() {
      if (!row) return;
      if (active !== '官方题库') { row.innerHTML = origRow; return; }
      var subs = ['全部'].concat(QS.map(function (q) { return q.subject; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      row.innerHTML = '<div class="bh-chips">' + subs.map(function (s) {
        return '<button type="button" class="bh-chip' + (s === subject ? ' is-on' : '') + '" data-sub="' + esc(s) + '">' + esc(s) + '</button>';
      }).join('') + '</div>' +
        '<div class="bh-lib-search"><input class="bh-input" type="text" placeholder="搜索题目、章节…" value="' + esc(kw) + '"></div>';
      row.querySelector('.bh-chips').addEventListener('click', function (e) {
        var b = e.target.closest('.bh-chip');
        if (!b) return;
        subject = b.getAttribute('data-sub');
        renderRow(); render();
      });
      var input = row.querySelector('input');
      input.addEventListener('input', function () { kw = input.value.trim().toLowerCase(); render(); });
    }

    function render() {
      stats();
      if (secHead) {
        secHead.innerHTML = active === '官方题库'
          ? '官方真题 <span class="ml-1.5 text-xs font-normal text-[var(--ink-faint)]">2009–2010 · 共 ' + QS.length + ' 题</span>'
          : '我的题库 <span class="ml-1.5 text-xs font-normal text-[var(--ink-faint)]">来源：我上传的</span>';
      }
      if (active !== '官方题库') {
        listBox.className = 'flex flex-col items-center justify-center py-20';
        listBox.innerHTML = '<div class="bh-empty" style="padding:0"><b>还没有自己的题库</b>' +
          '可以先做官方真题练手，再按章节专项突破<br><br>' +
          '<a class="bh-mis-act is-main" href="practice.html">去做官方真题</a></div>';
        return;
      }
      var shown = QS.filter(function (q) {
        if (subject !== '全部' && q.subject !== subject) return false;
        if (kw && (q.stem + q.subject + q.chapter).toLowerCase().indexOf(kw) < 0) return false;
        return true;
      });
      listBox.className = '';
      if (!shown.length) {
        listBox.innerHTML = '<div class="bh-empty"><b>没有匹配的题目</b>换个关键词或科目试试</div>';
        return;
      }
      listBox.innerHTML = '<div class="bh-lib-list">' + shown.map(function (q, i) {
        var ans = S.get('answers', {})[q.id];
        return '<a class="bh-lib-item" href="practice.html?q=' + encodeURIComponent(q.id) + '">' +
          '<span class="bh-lib-no">' + (i + 1) + '</span>' +
          '<span class="bh-lib-main"><b>' + esc(q.stem) + '</b>' +
          '<em>' + esc(q.subject) + ' · ' + esc(q.chapter) + ' · ' + esc(q.level) + '</em></span>' +
          (ans ? '<span class="bh-lib-state ' + (ans.ok ? 'is-ok' : 'is-bad') + '">' + (ans.ok ? '已答对' : '答错过') + '</span>'
               : '<span class="bh-lib-state">未做</span>') +
          '</a>';
      }).join('') + '</div>';
    }

    tabs.forEach(function (b) {
      bindBtn(b, function () {
        active = b.textContent.trim();
        styleTabs(); renderRow(); render();
      });
    });

    styleTabs(); renderRow(); render();
  }

  /* ============================ 番茄钟 ============================ */
  function initFocus() {
    var main = $('main');
    if (!main) return;
    var startBtn = $$('button', main).filter(function (b) { return /开始专注/.test(b.textContent); })[0];
    if (!startBtn) return;

    var mins = 25, left = 25 * 60, timer = null, running = false;

    // 按钮外层容器里有一层 absolute inset-0 的紫色装饰底，撑高后会把整块染紫，先关掉
    var glow = startBtn.parentNode.querySelector(':scope > div.absolute');
    if (glow) glow.style.display = 'none';

    var bar = document.createElement('div');
    bar.className = 'bh-timer';
    bar.innerHTML = '<div class="bh-timer-num">25:00</div><div class="bh-timer-hint">选择时长后点开始，专注期间自动屏蔽打扰</div>';
    startBtn.parentNode.parentNode.insertBefore(bar, startBtn.parentNode);
    var num = bar.querySelector('.bh-timer-num');

    function paint() {
      var m = Math.floor(left / 60), sec = left % 60;
      num.textContent = (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
      num.classList.toggle('is-run', running);
    }

    function stop() {
      running = false; clearInterval(timer); timer = null;
      startBtn.textContent = '继续专注 ' + mins + ' 分钟';
      paint();
    }

    function tick() {
      left--;
      if (left <= 0) {
        clearInterval(timer); timer = null; running = false;
        left = 0; paint();
        startBtn.textContent = '再来一轮 ' + mins + ' 分钟';
        var rec = S.get('focusLog', []); rec.push({ mins: mins, at: Date.now() }); S.set('focusLog', rec);
        toast('专注完成，休息一下吧', 'ok');
        setTimeout(function () { left = mins * 60; paint(); }, 1200);
        return;
      }
      paint();
    }

    startBtn.addEventListener('click', function () {
      if (running) { stop(); return; }
      if (left <= 0) left = mins * 60;
      running = true; startBtn.textContent = '暂停';
      timer = setInterval(tick, 1000);
      paint();
      toast('开始专注 ' + mins + ' 分钟');
    });

    $$('button', main).forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      var m = t.match(/^(15|25|45)\s/);
      if (!m && !/自定义/.test(t)) return;
      bindBtn(b, function () {
        if (running) { toast('专注进行中，先暂停再切换时长'); return; }
        if (m) mins = +m[1];
        else {
          var inp = main.querySelector('input[type="number"]');
          mins = inp ? Math.max(1, Math.min(120, +inp.value || 25)) : 25;
        }
        left = mins * 60;
        startBtn.textContent = '开始专注 ' + mins + ' 分钟';
        paint();
      });
    });

    var numInput = main.querySelector('input[type="number"]');
    if (numInput) numInput.addEventListener('change', function () {
      if (running) return;
      mins = Math.max(1, Math.min(120, +numInput.value || 25));
      left = mins * 60; startBtn.textContent = '开始专注 ' + mins + ' 分钟'; paint();
    });

    paint();
  }

  /* ============================ 稳过签 ============================ */
  function initFortune() {
    var main = $('main');
    if (!main) return;
    var subject = '';
    var lots = [
      { t: '上上签', c: '稳扎稳打', s: '基础题不丢分，压轴题敢下手。今天的状态适合成套刷题，连着做两套再对答案。' },
      { t: '上签', c: '渐入佳境', s: '错题正在变少，但别急着加难度。把第八章的笔记再翻一遍，会有新收获。' },
      { t: '中签', c: '稳住别浪', s: '今天的正确率会有点波动。先做 20 道简单题热身，再进入难题，别一上来就死磕。' },
      { t: '上签', c: '厚积薄发', s: '你最近积累的东西快到兑现的时候了。保持节奏，按计划完成今天的任务即可。' }
    ];

    $$('button', main).forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (/英语四级|英语六级|期末考试|考证上岸|考研考公|日常安心/.test(t)) {
        bindBtn(b, function () {
          subject = t.replace(/[^\u4e00-\u9fa5]/g, '');
          $$('button', main).forEach(function (x) { x.classList.remove('is-picked'); });
          b.classList.add('is-picked');
          var inp = main.querySelector('input:not([type="file"]):not([type="number"]):not([type="password"]):not([type="checkbox"])');
          if (inp && !inp.value) inp.value = subject;
          toast('已选择：' + subject);
        });
      }
      if (/开始求签/.test(t)) {
        bindBtn(b, function () {
          var inp = main.querySelector('input:not([type="file"]):not([type="number"]):not([type="password"]):not([type="checkbox"])');
          var want = (inp && inp.value.trim()) || subject;
          if (!want) { toast('先写下你的所求，比如「高数」', 'error'); if (inp) inp.focus(); return; }
          b.disabled = true;
          b.textContent = '求签中…';
          setTimeout(function () {
            var lot = lots[Math.floor(Math.random() * lots.length)];
            window.BH.modal({
              title: '为你求得「' + lot.t + '」',
              body: '<p class="bh-modal-text"><b>' + esc(want) + ' · ' + esc(lot.c) + '</b></p>' +
                    '<p class="bh-modal-text" style="margin-top:8px">' + esc(lot.s) + '</p>' +
                    '<p class="bh-hint" style="margin-top:10px">签文只是提醒，分数还是靠题量堆出来的。</p>',
              okText: '去刷题', cancelText: '收下',
              onOk: function () { location.href = 'practice.html'; }
            });
            b.disabled = false;
            b.textContent = '再求一签';
            var n = main.querySelector('.bh-fortune-count');
            if (n) n.textContent = String((+n.textContent || 0) + 1);
          }, 900);
        });
      }
    });
    var zero = $$('*', main).filter(function (e) { return e.children.length === 0 && e.textContent.trim() === '0'; })[0];
    if (zero) zero.className += ' bh-fortune-count';
  }

  /* ============================ 手账 ============================ */
  function initDiary() {
    var main = $('main');
    if (!main) return;
    var box = pickEmpty(main, '还没有日记');

    function list() { return S.get('diary', []); }

    function render() {
      var arr = list();
      if (!arr.length || !box) return;
      box.className = 'bh-diary-list';
      box.innerHTML = arr.slice().reverse().map(function (d) {
        return '<article class="bh-diary-item"><div class="bh-diary-head"><b>' + esc(d.title) + '</b>' +
          '<em>' + new Date(d.at).toLocaleDateString('zh-CN') + '</em></div>' +
          '<p>' + esc(d.body).replace(/\n/g, '<br>') + '</p></article>';
      }).join('');
    }

    function openEditor() {
      var wrap = document.createElement('div');
      wrap.innerHTML = '<div class="bh-field"><label>标题</label><input class="bh-input bh-d-title" placeholder="给今天起个标题"></div>' +
        '<div class="bh-field"><label>内容</label><textarea class="bh-textarea bh-d-body" placeholder="今天学了什么？遇到了什么坑？"></textarea></div>';
      window.BH.modal({
        title: '写日记', body: wrap, okText: '保存',
        onOk: function (card) {
          var t = card.querySelector('.bh-d-title').value.trim();
          var body = card.querySelector('.bh-d-body').value.trim();
          if (!t && !body) { toast('写点什么再保存吧', 'error'); return false; }
          var arr = list();
          arr.push({ title: t || '无标题', body: body, at: Date.now() });
          S.set('diary', arr);
          toast('已保存', 'ok');
          render();
        }
      });
    }

    $$('button', main).forEach(function (b) {
      if (/写日记/.test(b.textContent)) bindBtn(b, openEditor);
    });
    render();
  }

  /* ============================ 概览待办 ============================ */
  function initDashboard() {
    var main = $('main');
    if (!main) return;
    var input = main.querySelector('input:not([type="file"]):not([type="number"]):not([type="password"]):not([type="checkbox"])');
    if (!input) return;
    var addBtn = $$('button', main).filter(function (b) { return b.textContent.trim() === '添加'; })[0];
    var box = pickEmpty(main, '还没有待办');
    var prio = '中';

    function list() { return S.get('tasks', []); }
    function render() {
      var arr = list();
      if (!arr.length || !box) return;
      box.className = 'bh-task-list';
      box.innerHTML = arr.map(function (t, i) {
        return '<div class="bh-task' + (t.done ? ' is-done' : '') + '" data-i="' + i + '">' +
          '<button class="bh-task-chk" type="button" aria-label="完成">' + (t.done ? '✓' : '') + '</button>' +
          '<span class="bh-task-txt">' + esc(t.text) + '</span>' +
          '<span class="bh-task-p is-' + t.prio + '">' + t.prio + '</span>' +
          '<button class="bh-task-del" type="button" aria-label="删除">×</button></div>';
      }).join('');
    }

    function add() {
      var v = input.value.trim();
      if (!v) { toast('先写点什么', 'error'); input.focus(); return; }
      var arr = list();
      arr.push({ text: v, prio: prio, done: false, at: Date.now() });
      S.set('tasks', arr);
      input.value = '';
      toast('已添加到今日待办', 'ok');
      render();
    }

    if (addBtn) { addBtn.disabled = false; bindBtn(addBtn, add); }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });

    $$('button', main).forEach(function (b) {
      var t = b.textContent.trim();
      if (t === '高' || t === '中' || t === '低') {
        bindBtn(b, function () {
          prio = t;
          $$('button', main).forEach(function (x) {
            if (/^[高中低]$/.test(x.textContent.trim())) {
              var on = x === b;
              x.style.background = on ? 'var(--grape)' : 'var(--paper)';
              x.style.color = on ? '#fff' : 'var(--ink-soft)';
            }
          });
        });
      }
      if (/AI 生成/.test(t)) {
        bindBtn(b, function () {
          var arr = list();
          [{ text: '复习错题本 10 道', prio: '高' }, { text: '做完数据结构第 5 章', prio: '中' }].forEach(function (x) {
            arr.push({ text: x.text, prio: x.prio, done: false, at: Date.now() });
          });
          S.set('tasks', arr); render(); toast('已生成 2 条待办', 'ok');
        });
      }
      if (/手动添加/.test(t)) bindBtn(b, function () { input.focus(); });
    });

    box.addEventListener('click', function (e) {
      var row = e.target.closest('.bh-task');
      if (!row) return;
      var i = +row.getAttribute('data-i');
      var arr = list();
      if (e.target.closest('.bh-task-del')) { arr.splice(i, 1); S.set('tasks', arr); render(); return; }
      if (e.target.closest('.bh-task-chk')) { arr[i].done = !arr[i].done; S.set('tasks', arr); render(); }
    });

    render();
  }

  /* ============================ 班级 ============================ */
  function initClasses() {
    var main = $('main');
    if (!main) return;

    function list() { return S.get('classes', []); }

    $$('button', main).forEach(function (b) {
      var t = b.textContent.trim();
      if (t === '创建班级') {
        bindBtn(b, function () {
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div class="bh-field"><label>班级名称</label><input class="bh-input bh-c-name" placeholder="如：2026 考研 408 冲刺班"></div>' +
            '<div class="bh-field"><label>班级简介</label><input class="bh-input bh-c-desc" placeholder="一句话说明这个班"></div>';
          window.BH.modal({
            title: '创建班级', body: wrap, okText: '创建',
            onOk: function (card) {
              var n = card.querySelector('.bh-c-name').value.trim();
              if (!n) { toast('给班级起个名字', 'error'); return false; }
              var arr = list();
              var code = Math.random().toString(36).slice(2, 8).toUpperCase();
              arr.push({ name: n, desc: card.querySelector('.bh-c-desc').value.trim(), code: code, at: Date.now() });
              S.set('classes', arr);
              toast('班级已创建，邀请码 ' + code, 'ok');
            }
          });
        });
      }
      if (t === '加入班级') {
        bindBtn(b, function () {
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div class="bh-field"><label>邀请码</label><input class="bh-input bh-c-code" placeholder="输入 6 位邀请码"></div>';
          window.BH.modal({
            title: '加入班级', body: wrap, okText: '加入',
            onOk: function (card) {
              var c = card.querySelector('.bh-c-code').value.trim().toUpperCase();
              if (c.length !== 6) { toast('邀请码是 6 位', 'error'); return false; }
              var arr = S.get('joined', []);
              arr.push({ code: c, at: Date.now() });
              S.set('joined', arr);
              toast('已提交加入申请，等班级管理员通过', 'ok');
            }
          });
        });
      }
    });

    var created = list();
    var head = main.querySelector('.v3-sec-head');
    if (created.length && head && head.nextElementSibling) {
      var box = head.nextElementSibling;
      box.className = 'bh-mis-list';
      box.innerHTML = created.map(function (c) {
        return '<article class="bh-mis-item"><div class="bh-mis-top"><span class="bh-mis-tag">我创建的</span>' +
          '<span>邀请码 ' + esc(c.code) + '</span></div>' +
          '<p class="bh-mis-stem">' + esc(c.name) + '</p>' +
          '<div class="bh-mis-ans"><span>' + esc(c.desc || '暂无简介') + '</span></div></article>';
      }).join('');
    }
  }

  /* ============================ 设置 ============================ */
  function initSettings() {
    var main = $('main');
    if (!main) return;
    var u = window.BH.user();

    function refreshName() {
      $$('main *', main).forEach(function (e) {
        if (e.children.length === 0 && e.textContent.trim() === (u.name || '弥彦')) e.textContent = u.name;
      });
    }

    $$('button', main).forEach(function (b) {
      var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (t === '编辑资料') {
        bindBtn(b, function () {
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div class="bh-field"><label>昵称</label><input class="bh-input bh-s-name" value="' + esc(u.name) + '"></div>' +
            '<div class="bh-field"><label>邮箱</label><input class="bh-input bh-s-mail" value="' + esc(u.email) + '"></div>';
          window.BH.modal({
            title: '编辑资料', body: wrap, okText: '保存',
            onOk: function (card) {
              var n = card.querySelector('.bh-s-name').value.trim();
              if (!n) { toast('昵称不能为空', 'error'); return false; }
              u.name = n;
              u.email = card.querySelector('.bh-s-mail').value.trim();
              S.set('user', u);
              refreshName();
              toast('资料已保存', 'ok');
            }
          });
        });
      }
      if (/退出登录/.test(t)) {
        bindBtn(b, function () {
          window.BH.confirm('退出后需要重新登录，确定退出吗？', function () {
            S.del('session');
            toast('已退出登录');
            setTimeout(function () { location.href = 'dashboard.html'; }, 600);
          }, '退出');
        });
      }
      if (/注销账号/.test(t)) {
        bindBtn(b, function () {
          window.BH.confirm('注销会清除本机全部学习数据（答题记录、错题、日记等），且无法恢复。', function () {
            try {
              Object.keys(localStorage).filter(function (k) { return k.indexOf('bh.') === 0; })
                .forEach(function (k) { localStorage.removeItem(k); });
            } catch (e) { }
            toast('本机数据已清除');
            setTimeout(function () { location.reload(); }, 700);
          }, '确定注销');
        });
      }
      if (/AI 服务商 Key/.test(t) || /AI.*Key/i.test(t)) {
        bindBtn(b, function () {
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div class="bh-field"><label>API Key</label><input class="bh-input bh-s-key" placeholder="sk-..." value="' + esc(S.get('aiKey', '')) + '"></div>' +
            '<p class="bh-hint">仅保存在本机浏览器，用于演示 AI 讲题与判分。</p>';
          window.BH.modal({
            title: 'AI 服务商 Key', body: wrap, okText: '保存',
            onOk: function (card) {
              S.set('aiKey', card.querySelector('.bh-s-key').value.trim());
              toast('已保存到本机', 'ok');
            }
          });
        });
      }
      if (/修改密码/.test(t)) {
        bindBtn(b, function () {
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div class="bh-field"><label>原密码</label><input class="bh-input" type="password" placeholder="当前密码"></div>' +
            '<div class="bh-field"><label>新密码</label><input class="bh-input" type="password" placeholder="至少 6 位"></div>';
          window.BH.modal({
            title: '修改密码', body: wrap, okText: '保存',
            onOk: function (card) {
              var ps = card.querySelectorAll('input');
              if (ps[1].value.length < 6) { toast('新密码至少 6 位', 'error'); return false; }
              toast('密码已更新（演示环境不会真正校验原密码）', 'ok');
            }
          });
        });
      }
    });

    refreshName();
  }

  /* ============================ 登录 / 注册 ============================ */
  function initAuth(mode) {
    var submit = $('#authSubmit');
    if (!submit) return;
    var err = $('#authErr');

    function fail(msg) {
      err.textContent = msg;
      err.hidden = false;
    }

    function ok() { err.hidden = true; }

    var th = $('.bh-auth-theme');
    if (th) bindBtn(th, function () {
      var dark = document.documentElement.classList.toggle('dark');
      S.set('theme', dark ? 'dark' : 'light');
      try { localStorage.setItem('wenguo-theme', dark ? 'dark' : 'light'); } catch (e) { }
    });

    submit.addEventListener('click', function () {
      ok();
      var id = $('#authId').value.trim();
      var pwd = $('#authPwd').value;
      if (!id) return fail(mode === 'login' ? '请输入邮箱或用户名' : '请输入用户名');
      if (pwd.length < 6) return fail('密码至少 6 位');

      if (mode === 'login') {
        var acc = S.get('account', null);
        if (acc && id !== acc.name && id !== acc.email) return fail('账号不存在，先去注册');
        if (acc && pwd !== acc.pwd) return fail('密码不对，再试一次');
        S.set('session', { id: id, at: Date.now() });
        toast('登录成功，正在进入…', 'ok');
        setTimeout(function () { location.href = 'dashboard.html'; }, 600);
        return;
      }

      var mail = $('#authMail').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return fail('邮箱格式不对');
      if ($('#authPwd2').value !== pwd) return fail('两次输入的密码不一致');
      S.set('account', { name: id, email: mail, pwd: pwd, at: Date.now() });
      S.set('user', { name: id, email: mail, streak: 0 });
      S.set('session', { id: id, at: Date.now() });
      toast('账号已创建，正在进入…', 'ok');
      setTimeout(function () { location.href = 'dashboard.html'; }, 700);
    });
  }

  /* ============================ 日历 ============================ */
  function initCalendar() {
    var main = $('main');
    if (!main) return;
    var grid = $$('.grid.grid-cols-7', main).filter(function (g) { return g.children.length >= 28; })[0];
    if (!grid) return;
    var cells = [].slice.call(grid.children);
    var title = $$('*', main).filter(function (e) {
      return e.children.length === 0 && /\d{4}\s*年\s*\d{1,2}\s*月/.test(e.textContent);
    })[0];

    var now = new Date();
    var cur = new Date(now.getFullYear(), now.getMonth(), 1);

    function cellNum(cell) {
      var leaf = $$('*', cell).filter(function (e) { return e.children.length === 0 && /^\d{1,2}$/.test(e.textContent.trim()); })[0];
      return leaf || cell;
    }

    function sameDay(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function render() {
      var first = new Date(cur.getFullYear(), cur.getMonth(), 1);
      var start = new Date(first);
      start.setDate(1 - ((first.getDay() + 6) % 7));   // 周一开头
      cells.forEach(function (c, i) {
        var d = new Date(start);
        d.setDate(start.getDate() + i);
        var n = cellNum(c);
        n.textContent = String(d.getDate());
        c.classList.toggle('is-outside', d.getMonth() !== cur.getMonth());
        c.classList.toggle('is-today', sameDay(d, new Date()));
      });
      if (title) title.textContent = cur.getFullYear() + ' 年 ' + (cur.getMonth() + 1) + ' 月';
    }

    function shift(n) {
      cur = new Date(cur.getFullYear(), cur.getMonth() + n, 1);
      render();
    }

    $$('button', main).forEach(function (b) {
      var t = b.textContent.trim();
      var label = (b.getAttribute('aria-label') || '') + ' ' + (b.title || '');
      if (/上一月|上个月|上月/.test(label) || /^‹|^←/.test(t)) bindBtn(b, function () { shift(-1); });
      else if (/下一月|下个月|下月/.test(label) || /^›|^→/.test(t)) bindBtn(b, function () { shift(1); });
      else if (t === '今天') bindBtn(b, function () {
        cur = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        render(); toast('已回到今天');
      });
      else if (t === '周视图') bindBtn(b, function () { toast('周视图还在做，先用月视图'); });
    });

    render();
  }

  /* ============================ 启动 ============================ */
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  var registry = {
    practice: initPractice,
    mistakes: initMistakes,
    library: initLibrary,
    focus: initFocus,
    fortune: initFortune,
    diary: initDiary,
    dashboard: initDashboard,
    classes: initClasses,
    settings: initSettings,
    login: function () { initAuth('login'); },
    register: function () { initAuth('register'); },
    calendar: initCalendar
  };

  function boot() {
    var fn = registry[page];
    if (fn) { try { fn(); } catch (e) { console.error('[BH] ' + page + ' 初始化失败', e); } }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BH_PAGES = registry;
})();
