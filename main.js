(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Language: English in the markup, Russian in data-ru. */
  const btn = document.getElementById('lang');
  const tr = [...document.querySelectorAll('[data-ru]')];
  tr.forEach(el => { el.dataset.en = el.textContent; });
  const hrefs = [...document.querySelectorAll('[data-ru-href]')];
  hrefs.forEach(el => { el.dataset.enHref = el.getAttribute('href'); });
  let lang = 'en';

  /* The live thing: Shura's measured decode speed by filled context, replayed at that speed. */
  // FINAL2, 2026-10-23: RX 7800 XT 16 GB, 1.5 GiB VRAM reserve for the desktop, 256-token decode after prefill.
  const data = [
    { k: '12k', tps: 72.5, pp: 1738 }, { k: '32k', tps: 58.3, pp: 1570 }, { k: '177k', tps: 34.6, pp: 561 }
  ];
  const answer = {
    en: 'The 1C calendar has 21 working days in September,\nbut payroll.py uses a constant 22.\n\n- days = 22\n+ days = zup.calendar(month).working_days\n\nRan the tests: 48 passed.',
    ru: 'В календаре 1С в сентябре 21 рабочий день,\nа payroll.py берёт константу 22.\n\n- days = 22\n+ days = zup.calendar(month).working_days\n\nЗапустил тесты: 48 прошли.'
  };
  const chips = [...document.querySelectorAll('#chips button')];
  const tps = document.getElementById('tps');
  const note = document.getElementById('term-note');
  const out = document.getElementById('stream');
  let idx = 0, rate = data[idx].tps, raf = 0, seen = false;

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const render = s => s.split('\n').map(l =>
    l.startsWith('+ ') ? `<span class="add">${esc(l)}</span>` :
    l.startsWith('- ') ? `<span class="del">${esc(l)}</span>` : esc(l)).join('\n');

  const play = () => {
    cancelAnimationFrame(raf);
    const src = answer[lang];
    if (reduce) { out.innerHTML = render(src); out.classList.add('done'); return; }
    out.classList.remove('done');
    const t0 = performance.now();
    const step = t => {
      // About 3.5 characters per token of mixed code and prose.
      const n = Math.min(src.length, Math.floor((t - t0) / 1000 * rate * 3.5));
      out.innerHTML = render(src.slice(0, n));
      if (n < src.length) raf = requestAnimationFrame(step);
      else out.classList.add('done');
    };
    raf = requestAnimationFrame(step);
  };

  const fmt = n => n.toFixed(1).replace('.', lang === 'ru' ? ',' : '.');
  const updateDial = () => {
    const d = data[idx];
    rate = d.tps;
    tps.textContent = fmt(d.tps);
    chips.forEach((c, i) => { c.setAttribute('aria-checked', i === idx); c.tabIndex = i === idx ? 0 : -1; });
    const secs = Math.round(1000 / d.tps);
    note.textContent = lang === 'ru'
      ? `Повтор с измеренной скоростью при ${d.k} контекста: промпт читается со скоростью ${d.pp} ток/с, страница кода (~1000 токенов) пишется за ${secs} с.`
      : `Replayed at the measured speed with ${d.k} of context: the prompt is read at ${d.pp.toLocaleString('en')} tok/s, a page of code (~1000 tokens) is written in ${secs} s.`;
  };
  const choose = i => { idx = Math.max(0, Math.min(data.length - 1, i)); updateDial(); if (seen) play(); };
  chips.forEach((c, i) => c.addEventListener('click', () => choose(i)));
  document.getElementById('chips').addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault(); choose(idx + d); chips[idx].focus();
  });

  const term = document.querySelector('.term');
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { seen = true; play(); o.disconnect(); }
  }), { threshold: 0.3 }).observe(term);

  const setLang = l => {
    lang = l;
    document.documentElement.lang = l;
    tr.forEach(el => { el.textContent = l === 'ru' ? el.dataset.ru : el.dataset.en; });
    hrefs.forEach(el => el.setAttribute('href', l === 'ru' ? el.dataset.ruHref : el.dataset.enHref));
    btn.textContent = l === 'ru' ? 'EN' : 'RU';
    try { localStorage.setItem('lang', l); } catch (_) {}
    updateDial();
    if (seen) play();
  };
  btn.addEventListener('click', () => setLang(lang === 'ru' ? 'en' : 'ru'));

  /* Entrances below the first screen, once each. */
  if (!reduce && 'IntersectionObserver' in window) {
    document.querySelectorAll('.numbers li, .case, .job, .facts > div, .contact > *').forEach((el, i, all) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.setAttribute('data-rise', '');
      const sibs = [...el.parentElement.children];
      el.style.setProperty('--i', Math.min(sibs.indexOf(el), 4));
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-rise]').forEach(el => io.observe(el));
  }

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (_) {}
  setLang(saved || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en'));
})();
