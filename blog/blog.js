(() => {
  /* Language: English in the markup, Russian in data-ru (same convention as ../main.js).
     Blog pages only; the choice is remembered in localStorage when it is available. */
  const KEY = 'blog-lang';
  const btn = document.getElementById('lang');
  const nodes = [...document.querySelectorAll('[data-ru]')];
  const title = document.querySelector('title');
  nodes.forEach(el => { el.dataset.en = el.innerHTML; });
  if (title && title.dataset.ru) title.dataset.en = title.textContent;

  function setLang(lang) {
    document.documentElement.lang = lang;
    nodes.forEach(el => { el.innerHTML = lang === 'ru' ? el.dataset.ru : el.dataset.en; });
    if (title && title.dataset.ru) title.textContent = lang === 'ru' ? title.dataset.ru : title.dataset.en;
    if (btn) {
      btn.textContent = lang === 'ru' ? 'EN' : 'RU';
      btn.setAttribute('aria-label', lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    }
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode: the choice just is not remembered */ }
  }

  if (btn) btn.addEventListener('click', () => setLang(document.documentElement.lang === 'ru' ? 'en' : 'ru'));

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  setLang(saved === 'ru' ? 'ru' : 'en');
})();
