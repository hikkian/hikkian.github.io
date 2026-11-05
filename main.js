(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero strip: the frame nearest the centre is lit, and the strip can be dragged with a mouse. */
  const strip = document.getElementById('strip');
  const frames = [...strip.querySelectorAll('.frame')];
  const light = () => {
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = frames[0], dist = Infinity;
    for (const f of frames) {
      const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = f; }
    }
    frames.forEach(f => f.classList.toggle('lit', f === best));
  };
  let ticking = false;
  strip.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { light(); ticking = false; }); }
  }, { passive: true });
  addEventListener('resize', light, { passive: true });
  const start = frames[2];
  const centre = () => { strip.scrollLeft = start.offsetLeft + start.offsetWidth / 2 - strip.clientWidth / 2; light(); };
  centre();
  start.querySelector('img').decode?.().then(centre, () => {});
  addEventListener('load', centre, { once: true });

  const centreOf = f => f.offsetLeft + f.offsetWidth / 2 - strip.clientWidth / 2;
  const nearest = x => frames.reduce((b, f) => Math.abs(centreOf(f) - x) < Math.abs(centreOf(b) - x) ? f : b, frames[0]);
  let restore = 0;
  const glide = left => {
    strip.style.scrollSnapType = 'none';
    strip.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
    clearTimeout(restore);
    const done = () => { clearTimeout(restore); strip.style.scrollSnapType = ''; strip.removeEventListener('scrollend', done); };
    strip.addEventListener('scrollend', done);
    restore = setTimeout(done, 900);
  };

  strip.addEventListener('dragstart', e => e.preventDefault());
  strip.addEventListener('mousedown', e => e.preventDefault());
  let down = false, x0 = 0, s0 = 0, moved = false, lastX = 0, lastT = 0, v = 0;
  strip.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; x0 = lastX = e.clientX; lastT = performance.now(); v = 0; s0 = strip.scrollLeft;
    clearTimeout(restore);
    strip.style.scrollSnapType = 'none'; strip.style.scrollBehavior = 'auto'; strip.classList.add('dragging');
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 4) moved = true;
    const t = performance.now();
    if (t > lastT) v = 0.8 * ((e.clientX - lastX) / (t - lastT)) + 0.2 * v;
    lastX = e.clientX; lastT = t;
    strip.scrollLeft = s0 - dx;
  });
  addEventListener('pointerup', e => {
    if (!down) return;
    down = false; strip.style.scrollBehavior = ''; strip.classList.remove('dragging');
    if (!moved) {
      const f = e.target.closest && e.target.closest('.frame');
      glide(centreOf(f || nearest(strip.scrollLeft)));
      return;
    }
    if (performance.now() - lastT > 80) v = 0;
    glide(centreOf(nearest(strip.scrollLeft - v * 220)));
  });
  strip.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  strip.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const lit = frames.findIndex(f => f.classList.contains('lit'));
    const next = frames[Math.max(0, Math.min(frames.length - 1, lit + (e.key === 'ArrowRight' ? 1 : -1)))];
    glide(centreOf(next));
  });

  /* Language: English in the markup, Russian in data-ru. */
  const btn = document.getElementById('lang');
  const tr = [...document.querySelectorAll('[data-ru]')];
  tr.forEach(el => { el.dataset.en = el.textContent; });
  const hrefs = [...document.querySelectorAll('[data-ru-href]')];
  hrefs.forEach(el => { el.dataset.enHref = el.getAttribute('href'); });
  let lang = 'en';
  const setLang = l => {
    lang = l;
    document.documentElement.lang = l;
    tr.forEach(el => { el.textContent = l === 'ru' ? el.dataset.ru : el.dataset.en; });
    hrefs.forEach(el => el.setAttribute('href', l === 'ru' ? el.dataset.ruHref : el.dataset.enHref));
    btn.textContent = l === 'ru' ? 'EN' : 'RU';
    try { localStorage.setItem('lang', l); } catch (_) {}
    updateDial();
  };
  btn.addEventListener('click', () => setLang(lang === 'ru' ? 'en' : 'ru'));

  /* The live thing: measured decode speed by filled context, and text streamed at that speed. */
  const data = [
    { k: '4k', tps: 53.9 }, { k: '16k', tps: 53.2 }, { k: '32k', tps: 50.8 },
    { k: '64k', tps: 50.5 }, { k: '128k', tps: 42.4 }, { k: '187k', tps: 38.9 }
  ];
  const range = document.getElementById('ctx');
  const out = document.getElementById('ctx-out');
  const tps = document.getElementById('tps');
  const word = document.getElementById('speed-word');
  const field = document.querySelector('.showcase');
  const stream = document.getElementById('stream');
  const text = {
    en: 'def reconcile(payroll, ledger):\n    # every row must match to the cent\n    for row in payroll:\n        if row.total != ledger[row.id]:\n            raise MismatchError(row.id)\n    return True',
    ru: 'Сверяю расчёт зарплаты с 1С построчно: если сумма расходится хоть на копейку, модуль показывает строку и причину, а отчёт не уходит, пока всё не сойдётся.'
  };
  const fmt = n => n.toFixed(1).replace('.', lang === 'ru' ? ',' : '.');
  let rate = 50.8;
  function updateDial() {
    const d = data[+range.value];
    rate = d.tps;
    out.textContent = d.k;
    range.setAttribute('aria-valuetext', d.k + (lang === 'ru' ? ' токенов' : ' tokens'));
    tps.textContent = fmt(d.tps);
    const long = +range.value >= 4;
    field.classList.toggle('long', long);
    word.textContent = lang === 'ru'
      ? (long ? word.dataset.ruLong : word.dataset.ruShort)
      : (long ? 'long context' : 'short context');
  }
  range.addEventListener('input', updateDial);

  // About 1.3 tokens per word; one chunk per token-equivalent at the measured rate.
  let pos = 0, timer = 0;
  const tick = () => {
    const src = text[lang];
    pos += 4;
    if (pos > src.length + 60) pos = 0;
    stream.textContent = src.slice(0, Math.min(pos, src.length));
    timer = setTimeout(tick, 1000 / rate);
  };
  const io0 = new IntersectionObserver(es => es.forEach(e => {
    clearTimeout(timer);
    if (e.isIntersecting && !reduce) tick();
    else if (reduce) stream.textContent = text[lang];
  }));
  io0.observe(field);
  stream.style.whiteSpace = 'pre-wrap';

  /* Entrances: heading, then text, then pictures, once per section. */
  if (!reduce && 'IntersectionObserver' in window) {
    document.querySelectorAll('main section').forEach(sec => {
      const parts = sec.querySelectorAll('h2, h3, .lineup li, .project, .showcase-text p, .dial, .card, .rail p');
      parts.forEach((el, i) => { el.setAttribute('data-rise', ''); el.style.setProperty('--i', Math.min(i, 8)); });
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-rise]').forEach(el => io.observe(el));
  }

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (_) {}
  const initial = saved || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en');
  setLang(initial);
})();
