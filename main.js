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
  // Measured on an RX 7800 XT 16 GB with 1.5 GiB of VRAM left to the desktop.
  const data = [
    { k: 'short', ru: 'коротком контексте', tps: 93, pp: 0 }, { k: '28k', tps: 79, pp: 1766 }, { k: '100k', tps: 57, pp: 1066 }
  ];
  const answer = {
    en: 'payroll.py rounds every line before summing,\nso the rounding errors add up.\n\n- total = sum(round(x, 2) for x in lines)\n+ total = round(sum(lines), 2)\n\nTests: 48 of 48 passed.',
    ru: 'payroll.py округляет каждую строку до сложения,\nи ошибки округления накапливаются.\n\n- total = sum(round(x, 2) for x in lines)\n+ total = round(sum(lines), 2)\n\nТесты: 48 из 48 прошли.'
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

  const fmt = n => String(n);
  const updateDial = () => {
    const d = data[idx];
    rate = d.tps;
    tps.textContent = fmt(d.tps);
    chips.forEach((c, i) => { c.setAttribute('aria-checked', i === idx); c.tabIndex = i === idx ? 0 : -1; });
    const secs = Math.round(1000 / d.tps);
    const ctx = lang === 'ru' ? (d.ru || `контексте ${d.k}`) : (d.k === 'short' ? 'a short context' : `${d.k} of context`);
    const pp = d.pp ? (lang === 'ru' ? `промпт читается со скоростью ${d.pp.toLocaleString('ru')}\u00a0ток/с, ` : `the prompt is read at ${d.pp.toLocaleString('en')}\u00a0tok/s, `) : '';
    note.textContent = lang === 'ru'
      ? `Повтор с измеренной скоростью при ${ctx}: ${pp}страница кода (~1000 токенов) пишется за ${secs}\u00a0с.`
      : `Replayed at the measured speed with ${ctx}: ${pp}a page of code (~1000 tokens) is written in ${secs}\u00a0s.`;
  };
  const choose = i => { idx = Math.max(0, Math.min(data.length - 1, i)); updateDial(); if (seen) play(); };
  chips.forEach((c, i) => c.addEventListener('click', () => choose(i)));
  document.getElementById('chips').addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault(); choose(idx + d); chips[idx].focus();
  });

  const term = document.querySelector('.term');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { seen = true; play(); o.disconnect(); }
    }), { threshold: 0.3 }).observe(term);
  } else { seen = true; play(); }

  const setLang = l => {
    lang = l === 'ru' ? 'ru' : 'en'; l = lang;
    document.title = l === 'ru' ? 'Алишер Шарипов · AI и backend-разработчик' : 'Alisher Sharipov · AI and backend engineer';
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

  /* Scroll scenes: one rAF loop sets --p (0..1) on [data-scroll] elements; CSS does the rest. */
  const bar = document.getElementById('progress');
  const flow = document.getElementById('flow');
  const fill = flow.querySelector('.flow-line');
  const nodes = [...flow.querySelectorAll('.flow-nodes li')];
  const tokens = document.getElementById('flow-tokens');
  const scrolled = [...document.querySelectorAll('[data-scroll]')];
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  let queued = false;
  const frame = () => {
    queued = false;
    const vh = innerHeight;
    const doc = document.documentElement;
    bar.style.transform = `scaleX(${clamp(scrollY / (doc.scrollHeight - vh))})`;
    if (reduce) return;
    for (const el of scrolled) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const mode = el.dataset.scroll;
      const p = mode === 'exit' ? clamp(-r.top / (r.height * 0.9))
        : mode === 'through' ? clamp(-r.top / (r.height - vh))
        : clamp((vh - r.top) / (vh * 0.75));
      el.style.setProperty('--p', p.toFixed(4));
      if (el === flow) {
        nodes.forEach(n => n.classList.toggle('on', p >= +n.dataset.at));
        const t = clamp((p - 0.77) / 0.2);
        tokens.textContent = Math.round(t * 1000).toLocaleString(lang === 'ru' ? 'ru' : 'en');
      }
    }
  };
  const measure = () => {
    flow.style.setProperty('--w', fill.offsetWidth + 'px');
    flow.style.setProperty('--h', fill.offsetHeight + 'px');
    frame();
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', measure, { passive: true });
  measure();
  if (reduce) { nodes.forEach(n => n.classList.add('on')); tokens.textContent = '1000'; }

  /* Numbers count up once when they come into view. */
  if (!reduce && 'IntersectionObserver' in window) {
    const nums = [...document.querySelectorAll('.numbers b')];
    const count = el => {
      const final = el.textContent;
      const m = final.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
      if (!m) return;
      const target = parseFloat(m[2].replace(',', '.'));
      const dec = (m[2].split(/[.,]/)[1] || '').length;
      const sep = m[2].includes(',') ? ',' : '.';
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
        el.textContent = k < 1 ? m[1] + (target * e).toFixed(dec).replace('.', sep) + m[3] : (lang === 'ru' && el.dataset.ru ? el.dataset.ru : el.dataset.en || final);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { count(e.target); io2.unobserve(e.target); }
    }), { threshold: 0.6 });
    nums.forEach(n => io2.observe(n));
  }

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (_) {}
  setLang(saved || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en'));
})();
