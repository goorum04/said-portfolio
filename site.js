/* SaeTech v3 — i18n, nav, reveal */
(function () {
  var LANGS = ['ca', 'es', 'fr', 'en'];
  var NAMES = { ca: 'Català', es: 'Español', fr: 'Français', en: 'English' };
  var I18N = window.I18N || {};
  function getLang() {
    try { var s = localStorage.getItem('lang'); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    return 'ca';
  }
  function apply(lang) {
    var dict = I18N[lang] || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] !== undefined) el.innerHTML = dict[k];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      // format: attr:key;attr:key
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'); if (p.length === 2 && dict[p[1]] !== undefined) el.setAttribute(p[0], dict[p[1]]);
      });
    });
    document.documentElement.lang = lang;
    var cur = document.getElementById('langCur'); if (cur) cur.textContent = lang.toUpperCase();
    document.querySelectorAll('.lang-menu button').forEach(function (b) {
      if (b.getAttribute('data-lang') === lang) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    if (dict['meta.title']) document.title = dict['meta.title'];
    var md = document.querySelector('meta[name="description"]'); if (md && dict['meta.desc']) md.setAttribute('content', dict['meta.desc']);
  }
  window.__applyLang = apply; window.__getLang = getLang;
  function setLang(lang) { try { localStorage.setItem('lang', lang); } catch (e) {} apply(lang); }
  document.addEventListener('DOMContentLoaded', function () {
    var lang = getLang();
    if (lang !== 'ca') apply(lang); else apply('ca');
    // lang menu
    var lb = document.getElementById('langBtn'), lm = document.getElementById('langMenu');
    if (lb && lm) {
      LANGS.forEach(function (l) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-lang', l); b.textContent = NAMES[l];
        b.addEventListener('click', function () { setLang(l); lm.classList.remove('open'); });
        lm.appendChild(b);
      });
      lb.addEventListener('click', function (e) { e.stopPropagation(); lm.classList.toggle('open'); });
      document.addEventListener('click', function () { lm.classList.remove('open'); });
      apply(lang);
    }
    // burger
    var bg = document.getElementById('burger'), menu = document.getElementById('menu');
    if (bg && menu) bg.addEventListener('click', function () { var o = menu.classList.toggle('open'); bg.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    // current page
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.menu a').forEach(function (a) { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
    // reveal
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else { document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); }); }
  });
})();

document.addEventListener('DOMContentLoaded',function(){var c=null;try{c=localStorage.getItem('cookieConsent')}catch(e){return}if(c)return;var b=document.createElement('div');b.className='cookie';b.setAttribute('role','dialog');b.innerHTML='<p><span data-i18n="ck.msg">Faig servir cookies d’anàlisi (Google) per entendre com s’usa la web. Només s’activen si acceptes.</span> <a href="privacidad.html" data-i18n="ck.more">Més informació</a></p><div><button type="button" class="btn btn-ghost" data-v="rejected" data-i18n="ck.no">Només essencials</button><button type="button" class="btn btn-primary" data-v="accepted" data-i18n="ck.yes">Accepta</button></div>';b.querySelectorAll('button').forEach(function(x){x.addEventListener('click',function(){var v=x.dataset.v;try{localStorage.setItem('cookieConsent',v)}catch(e){}if(v==='accepted'){window.__loadGTM&&window.__loadGTM();window.__loadMetricool&&window.__loadMetricool();}b.remove();});});document.body.appendChild(b);if(window.__applyLang)try{window.__applyLang(window.__getLang())}catch(e){}});
