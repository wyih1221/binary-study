(function () {
  var THEME_KEY = 'wenguo-theme';

  var TOOLS_MARKUP = "<div class=\"flex flex-col\"><a class=\"v41-nav-item\" href=\"schedule.html\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-calendar size-[18px] shrink-0\" aria-hidden=\"true\"><path d=\"M8 2v4\"></path><path d=\"M16 2v4\"></path><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"></rect><path d=\"M3 10h18\"></path></svg><span class=\"flex-1\">课程表</span></a><a class=\"v41-nav-item active\" href=\"calendar.html\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-calendar-days size-[18px] shrink-0\" aria-hidden=\"true\"><path d=\"M8 2v4\"></path><path d=\"M16 2v4\"></path><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"></rect><path d=\"M3 10h18\"></path><path d=\"M8 14h.01\"></path><path d=\"M12 14h.01\"></path><path d=\"M16 14h.01\"></path><path d=\"M8 18h.01\"></path><path d=\"M12 18h.01\"></path><path d=\"M16 18h.01\"></path></svg><span class=\"flex-1\">日历</span></a><a class=\"v41-nav-item\" href=\"focus.html\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-timer size-[18px] shrink-0\" aria-hidden=\"true\"><line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\"></line><line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\"></line><circle cx=\"12\" cy=\"14\" r=\"8\"></circle></svg><span class=\"flex-1\">番茄钟专注</span></a><a class=\"v41-nav-item\" href=\"fortune.html\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-wand-sparkles size-[18px] shrink-0\" aria-hidden=\"true\"><path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72\"></path><path d=\"m14 7 3 3\"></path><path d=\"M5 6v4\"></path><path d=\"M19 14v4\"></path><path d=\"M10 2v2\"></path><path d=\"M7 8H3\"></path><path d=\"M21 16h-4\"></path><path d=\"M11 3H9\"></path></svg><span class=\"flex-1\">抽签</span></a><a class=\"v41-nav-item\" href=\"diary.html\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-notebook-pen size-[18px] shrink-0\" aria-hidden=\"true\"><path d=\"M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4\"></path><path d=\"M2 6h4\"></path><path d=\"M2 10h4\"></path><path d=\"M2 14h4\"></path><path d=\"M2 18h4\"></path><path d=\"M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\"></path></svg><span class=\"flex-1\">手账</span></a></div>";

  // 小工具组：所有页面统一注入同一份子菜单，常态展开、不可折叠
  // 子菜单高亮：模板里自带 calendar 的 active，注入后按当前路径重算
  function syncToolActive(panel) {
    var links = panel.querySelectorAll('a');
    var here = decodeURIComponent(location.pathname).replace(/\/+$/, '');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.remove('active');
      var href = links[i].getAttribute('href') || '';
      var target = decodeURIComponent(new URL(href, location.href).pathname).replace(/\/+$/, '');
      if (target === here) links[i].classList.add('active');
    }
  }

  function ensureToolMenu() {
    var title = document.querySelector('.v41-sidebar-more-toggle');
    if (!title) return;
    var group = title.closest('.v41-sidebar-group');
    if (!group) return;

    var panel = group.querySelector('.v41-submenu');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'v41-submenu flex flex-col';
      panel.innerHTML = TOOLS_MARKUP;
      var old = group.querySelector('div.flex.flex-col');
      if (old) group.replaceChild(panel, old);
      else group.appendChild(panel);
    }

    syncToolActive(panel);
    panel.hidden = false;

    var svg = title.querySelector('svg');
    if (svg) svg.remove();
    title.removeAttribute('aria-expanded');
  }

  function activateTab(tab) {
    var list = tab.closest('[role="tablist"]');
    if (!list) return;
    var tabs = list.querySelectorAll('[role="tab"]');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-selected', tabs[i] === tab ? 'true' : 'false');
      tabs[i].classList.toggle('on', tabs[i] === tab);
    }
    var panelId = tab.getAttribute('aria-controls');
    if (!panelId) return;
    var wrap = list.parentNode;
    var panels = wrap.querySelectorAll('[role="tabpanel"]');
    for (var j = 0; j < panels.length; j++) {
      panels[j].hidden = panels[j].id !== panelId;
    }
  }

  // 站点图标跟随日夜模式切换配色（同一套图形，两版配色）
  function syncFavicon() {
    var dark = document.documentElement.classList.contains('dark');
    var file = dark ? 'icon-dark.png' : 'icon.png';
    var links = document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      links[i].setAttribute('href', href.replace(/icon(-light|-dark|-180)?\.png/, file));
    }
  }

  function toggleTheme() {
    var dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) { }
    syncFavicon();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    var tab = t.closest('[role="tab"]');
    if (tab) { e.preventDefault(); activateTab(tab); return; }

    var theme = t.closest('[aria-label*="深色"],[aria-label*="浅色"],[aria-label*="主题"]');
    if (theme) { e.preventDefault(); toggleTheme(); return; }
  }, false);


  // 侧边栏列表底部的渐隐遮罩：滚到底时去掉，避免最后一项看起来是灰的
  function initNavFade() {
    var navs = document.querySelectorAll('nav.scroll-fade-y');
    for (var i = 0; i < navs.length; i++) {
      (function (nav) {
        function update() {
          var atEnd = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 2;
          nav.classList.toggle('scroll-fade-y', !atEnd);
        }
        nav.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        update();
      })(navs[i]);
    }
  }

  // 移动端抽屉：SSR 里侧边栏是 hidden md:block，菜单按钮原来的 React 交互没了
  function initMobileNav() {
    var btn = document.querySelector('[aria-label="打开菜单"]');
    var aside = null;
    var wraps = document.querySelectorAll('aside');
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i].querySelector('.v41-sidebar')) { aside = wraps[i]; break; }
    }
    if (!btn || !aside) return;
    aside.classList.add('v41-drawer');

    var mask = document.createElement('div');
    mask.className = 'v41-drawer-mask';
    document.body.appendChild(mask);

    function open() {
      aside.classList.remove('hidden');
      requestAnimationFrame(function () { aside.classList.add('is-open'); });
      mask.classList.add('is-on');
      document.documentElement.classList.add('drawer-open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
      aside.classList.remove('is-open');
      mask.classList.remove('is-on');
      document.documentElement.classList.remove('drawer-open');
      btn.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        if (!aside.classList.contains('is-open')) aside.classList.add('hidden');
      }, 240);
    }

    btn.addEventListener('click', open);
    mask.addEventListener('click', close);
    aside.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  // 落地页/内容块的淡入动画原本由 React 在滚入视口时触发，静态化后一直停在 opacity:0
  function revealStatic() {
    var nodes = document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      el.style.opacity = '1';
      if (/translate|scale|rotate/.test(el.style.transform)) el.style.transform = 'none';
    }
  }

  // 侧边栏悬停展开（桌面）：驱动宽度、正文位移与放大
  function initRail() {
    var aside = document.querySelector('aside.v41-rail');
    if (!aside) return;
    var root = document.documentElement;
    function open() {
      if (window.innerWidth >= 768) root.classList.add('rail-open');
    }
    function close() {
      root.classList.remove('rail-open');
    }
    aside.addEventListener('mouseenter', open);
    aside.addEventListener('mouseleave', close);
    window.addEventListener('resize', function () {
      if (window.innerWidth < 768) close();
    });
  }

  function boot() {
    ensureToolMenu();
    initMobileNav();
    initNavFade();
    revealStatic();
    initRail();
    syncFavicon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
