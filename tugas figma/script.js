(() => {
  const body = document.body;
  const views = document.querySelectorAll('.view');
  const navBtns = document.querySelectorAll('.nav-btn');

  function showView(name) {
    if (!['home', 'about', 'contact'].includes(name)) name = 'home';
    views.forEach(v => v.classList.toggle('is-active', v.id === 'view-' + name));
    navBtns.forEach(b => b.classList.toggle('is-active', b.dataset.view === name));
    body.dataset.view = name;
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    window.scrollTo({ top: 0 });
  }

  document.querySelectorAll('[data-view]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); showView(el.dataset.view); })
  );

  // About sub menu
  const aboutBtns = document.querySelectorAll('.about-btn');
  const subs = document.querySelectorAll('.sub');
  function showSub(name) {
    aboutBtns.forEach(b => {
      const on = b.dataset.sub === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    subs.forEach(s => s.classList.toggle('is-active', s.dataset.sub === name));
  }
  aboutBtns.forEach(b => b.addEventListener('click', () => showSub(b.dataset.sub)));

  showSub('personal');
  showView(location.hash.slice(1) || 'home');
  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
})();
