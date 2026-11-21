/* ==========================================================================
   二进制书房 · 前端公共能力
   本地存储 / 轻提示 / 弹窗 / 全局搜索 / 通知 —— 纯前端，无后端依赖
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'bh.';

  /* ----------------------------- 本地存储 ----------------------------- */
  var store = {
    get: function (k, dft) {
      try {
        var v = localStorage.getItem(NS + k);
        return v === null ? dft : JSON.parse(v);
      } catch (e) { return dft; }
    },
    set: function (k, v) {
      try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { }
      return v;
    },
    del: function (k) {
      try { localStorage.removeItem(NS + k); } catch (e) { }
    },
    push: function (k, item, max) {
      var arr = store.get(k, []);
      arr.push(item);
      if (max && arr.length > max) arr = arr.slice(arr.length - max);
      return store.set(k, arr);
    }
  };

  /* ----------------------------- 轻提示 ----------------------------- */
  var toastBox = null;
  function toast(msg, type) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'bh-toast-box';
      document.body.appendChild(toastBox);
    }
    var el = document.createElement('div');
    el.className = 'bh-toast' + (type ? ' is-' + type : '');
    el.textContent = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      el.classList.remove('is-in');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, 2400);
  }

  /* ----------------------------- 弹窗 ----------------------------- */
  var openModals = [];
  function modal(opts) {
    opts = opts || {};
    var mask = document.createElement('div');
    mask.className = 'bh-modal-mask';
    var card = document.createElement('div');
    card.className = 'bh-modal' + (opts.wide ? ' is-wide' : '');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    var head = document.createElement('div');
    head.className = 'bh-modal-head';
    var h = document.createElement('h3');
    h.className = 'bh-modal-title';
    h.textContent = opts.title || '';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'bh-modal-x';
    x.setAttribute('aria-label', '关闭');
    x.innerHTML = '&times;';
    head.appendChild(h);
    if (opts.closable !== false) head.appendChild(x);

    var body = document.createElement('div');
    body.className = 'bh-modal-body';
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    card.appendChild(head);
    card.appendChild(body);

    if (opts.actions !== false) {
      var foot = document.createElement('div');
      foot.className = 'bh-modal-foot';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'bh-btn bh-btn-ghost';
      cancel.textContent = opts.cancelText || '取消';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'bh-btn bh-btn-grape';
      ok.textContent = opts.okText || '确定';
      cancel.addEventListener('click', function () { close(); });
      ok.addEventListener('click', function () {
        var r = opts.onOk ? opts.onOk(card) : true;
        if (r !== false) close();
      });
      foot.appendChild(cancel);
      foot.appendChild(ok);
      card.appendChild(foot);
      if (opts.cancelText === '') foot.removeChild(cancel);
    }

    mask.appendChild(card);
    document.body.appendChild(mask);
    document.documentElement.classList.add('bh-modal-open');
    openModals.push(mask);
    requestAnimationFrame(function () { mask.classList.add('is-in'); });

    function close() {
      mask.classList.remove('is-in');
      openModals = openModals.filter(function (m) { return m !== mask; });
      if (!openModals.length) document.documentElement.classList.remove('bh-modal-open');
      setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 180);
    }

    x.addEventListener('click', close);
    var bornAt = performance.now();
    mask.addEventListener('click', function (e) {
      if (performance.now() - bornAt < 150) return;   // 吞掉打开弹窗的那一次点击
      if (e.target === mask && opts.closable !== false) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    var first = card.querySelector('input,textarea,select');
    if (first) setTimeout(function () { first.focus(); }, 60);
    return { el: card, close: close };
  }

  function confirmBox(msg, onOk, okText) {
    return modal({
      title: '确认操作',
      body: '<p class="bh-modal-text">' + msg + '</p>',
      okText: okText || '确定',
      onOk: onOk
    });
  }

  /* ----------------------------- 当前用户 ----------------------------- */
  function currentUser() {
    return store.get('user', { name: '弥彦', email: 'miyan@example.com', streak: 41 });
  }

  /* ----------------------------- 全局搜索 ----------------------------- */
  function searchIndex() {
    var qs = (window.BH_DATA && window.BH_DATA.questions) || [];
    var items = qs.map(function (q) {
      return {
        type: '题目', title: q.stem.slice(0, 40),
        meta: q.subject + ' · ' + q.chapter + ' · ' + q.level,
        href: 'practice.html?q=' + encodeURIComponent(q.id)
      };
    });
    var pages = [
      ['概览', 'dashboard.html', '今日任务与学习进度'],
      ['题库', 'library.html', '真题与自建题库'],
      ['专项练习', 'practice.html', '按知识点刷题'],
      ['错题本', 'mistakes.html', '错题回看与重做'],
      ['做题记录', 'records.html', '答题历史与统计'],
      ['班级', 'classes.html', '创建班级、加入班级'],
      ['日历', 'calendar.html', '学习日程'],
      ['课程表', 'schedule.html', '课程与学期'],
      ['番茄钟', 'focus.html', '专注计时'],
      ['稳过签', 'fortune.html', '考前求签'],
      ['手账', 'diary.html', '学习日记'],
      ['设置', 'settings.html', '资料与偏好']
    ].map(function (p) {
      return { type: '页面', title: p[0], meta: p[2], href: p[1] };
    });
    return items.concat(pages);
  }

  // 顶栏内联搜索：输入即在下方展开候选，不再弹窗
  function initInlineSearch(bar) {
    var box = bar.querySelector('.v41-tb-search');
    if (!box) return;
    var input = box.querySelector('.v41-tb-input');
    if (!input) return;

    var idx = searchIndex();
    var panel = document.createElement('div');
    panel.className = 'bh-suggest';
    box.appendChild(panel);

    var shown = [], active = 0;

    function close() {
      panel.classList.remove('is-on');
    }

    function render() {
      var kw = input.value.trim().toLowerCase();
      if (!kw) { close(); return; }
      shown = idx.filter(function (it) {
        return (it.title + ' ' + it.meta).toLowerCase().indexOf(kw) >= 0;
      }).slice(0, 8);
      active = Math.min(active, Math.max(0, shown.length - 1));
      if (!shown.length) {
        panel.innerHTML = '<p class="bh-suggest-empty">没有匹配的结果</p>';
        panel.classList.add('is-on');
        return;
      }
      panel.innerHTML = shown.map(function (it, i) {
        return '<a class="bh-suggest-item' + (i === active ? ' is-active' : '') + '" href="' + it.href + '">' +
          '<span class="bh-suggest-badge">' + it.type + '</span>' +
          '<span class="bh-suggest-main"><b>' + esc(it.title) + '</b><em>' + esc(it.meta) + '</em></span></a>';
      }).join('');
      panel.classList.add('is-on');
    }

    function go(i) {
      var it = shown[i];
      if (it) location.href = it.href;
    }

    input.addEventListener('input', function () { active = 0; render(); });
    input.addEventListener('focus', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      else if (e.key === 'Escape') { input.value = ''; input.blur(); close(); }
    });
    panel.addEventListener('mousedown', function (e) {
      var a = e.target.closest('a');
      if (a) { e.preventDefault(); location.href = a.getAttribute('href'); }
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) close();
    });
    input._bhSearch = { focus: function () { input.focus(); input.select(); } };
  }

  // 兼容旧调用：聚焦顶栏输入
  function openSearch() {
    var input = document.querySelector('.v41-tb-input');
    if (input) { input.focus(); input.select(); return; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ----------------------------- 顶栏通知 ----------------------------- */
  function initTopbar() {
    var bar = document.getElementById('appTopbar');
    if (!bar) return;

    initInlineSearch(bar);

    var bell = bar.querySelector('.v41-tb-bell');
    if (bell) {
      var panel = document.createElement('div');
      panel.className = 'bh-notif';
      var list = store.get('notif', [
        { t: '连续打卡 41 天', d: '再坚持 9 天解锁「月度全勤」徽章', ago: '今天 08:12' },
        { t: '错题本有 3 道待复习', d: '二叉树遍历相关题目已到期', ago: '昨天 21:40' },
        { t: '班级作业提醒', d: '数据结构第 3 章作业还有 2 天截止', ago: '2 天前' }
      ]);
      panel.innerHTML = '<div class="bh-notif-head">通知<a class="bh-notif-clear" href="javascript:void(0)">全部已读</a></div>' +
        '<div class="bh-notif-list">' + list.map(function (n) {
          return '<div class="bh-notif-item"><b>' + esc(n.t) + '</b><p>' + esc(n.d) + '</p><em>' + esc(n.ago) + '</em></div>';
        }).join('') + '</div>';
      bar.appendChild(panel);

      bell.addEventListener('click', function (e) {
        e.preventDefault();
        var on = panel.classList.toggle('is-on');
        if (on) {
          var dot = bell.querySelector('.v41-tb-dot');
          if (dot) dot.style.display = 'none';
        }
      });
      panel.addEventListener('click', function (e) {
        if (e.target.closest('.bh-notif-clear')) {
          var dot = bell.querySelector('.v41-tb-dot');
          if (dot) dot.style.display = 'none';
          toast('已全部标记为已读');
        }
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && !bell.contains(e.target)) panel.classList.remove('is-on');
      });
    }

    var streak = bar.querySelector('.v41-tb-streak');
    if (streak) {
      streak.addEventListener('click', function () {
        var u = currentUser();
        toast('连续打卡 ' + (u.streak || 41) + ' 天，保持住');
      });
    }

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  window.BH = {
    store: store,
    toast: toast,
    modal: modal,
    confirm: confirmBox,
    user: currentUser,
    openSearch: openSearch,
    esc: esc
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopbar);
  } else {
    initTopbar();
  }
})();
