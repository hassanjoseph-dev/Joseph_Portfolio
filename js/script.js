(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const toggle = $('.nav-toggle'), menu = $('#menu');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  const header = $('.site-header');
  const scrollBar = document.createElement('div');
  scrollBar.className = 'scroll-bar';
  scrollBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(scrollBar);

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      header.classList.toggle('scrolled', scrollY > 24);
      document.querySelectorAll('.timeline').forEach(t => {
        const r = t.getBoundingClientRect();
        t.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * 0.65 - r.top) / r.height)));
      });
      queued = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.filter(en => en.isIntersecting).forEach((en, i) => {
        en.target.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms');
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('main section>.wrap>h2, main section>.wrap>p, .focus li, .skills li, .chips li, .tbl, .card, .project, .hub-head, .hub>.callout, .item, .timeline li, .stats')
      .forEach(el => { el.classList.add('reveal'); io.observe(el); });
  }

  if (matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const card = e.target.closest('.focus li, .skills li, .card, .item');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  }

  const greeting = $('#greeting');
  if (greeting) {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    greeting.textContent = `${part}, and welcome to my student portfolio.`;
  }

  const typed = $('#typed');
  if (typed) {
    const script = ['$ whoami', 'Hassan Ore-Oluwa Joseph', '$ role', 'Computer Science student', '$ focus', 'cybersecurity | web dev | IT support'];
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = (line, n) => line[0] === '$' ? '<b>$</b>' + esc(line.slice(1, n)) : esc(line.slice(0, n));
    let row = 0, col = 0, done = '';
    const tick = () => {
      if (row >= script.length) return;
      const line = script[row], cmd = line[0] === '$';
      col += cmd ? 1 : line.length;
      typed.innerHTML = done + html(line, col);
      if (col >= line.length) { done = typed.innerHTML + '\n'; row++; col = 0; }
      setTimeout(tick, cmd ? 75 : 380);
    };
    if (calm) typed.innerHTML = script.map(l => html(l, l.length)).join('\n');
    else setTimeout(tick, 900);
  }

  const filters = $('.filters');
  if (filters) {
    const category = { 'ethical-hacking': 'security', 'solar-inverter-installation': 'energy', 'portfolio-and-planner': 'web' };
    const articles = [...document.querySelectorAll('main article')];
    filters.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      filters.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
      articles.forEach(a => {
        const show = btn.dataset.f === 'all' || category[a.id] === btn.dataset.f;
        a.hidden = !show;
        if (show) { a.classList.remove('flip'); void a.offsetWidth; a.classList.add('flip'); }
      });
    });
  }

  const taskForm = $('#taskForm');
  if (taskForm) {
    const KEY = 'hassan-planner-tasks';
    const list = $('#taskList'), input = $('#taskInput'), error = $('#taskError');
    const ring = $('#ring'), count = $('#count'), empty = $('#empty');
    const setNum = (el, v) => { if (el.textContent !== String(v)) { el.textContent = v; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } };
    const starter = ['Complete COS101 assignment', 'Study MTH101', 'Review PHY101 notes',
      'Complete GST121 coursework', 'Practice JavaScript', 'Work on portfolio website',
      'Prepare for upcoming examination'];

    let tasks = null;
    try { tasks = JSON.parse(localStorage.getItem(KEY)); } catch (e) { tasks = null; }
    if (!Array.isArray(tasks)) tasks = starter.map((text, i) => ({ id: i + 1, text, done: false }));

    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };

    function updateStats() {
      const done = tasks.filter(t => t.done).length, total = tasks.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      count.textContent = `${done} of ${total} tasks completed (${pct}%)`;
      ring.style.strokeDashoffset = 327 - (327 * pct) / 100;
      ring.closest('.ring').setAttribute('aria-valuenow', pct);
      ring.closest('.dash').classList.toggle('complete', total > 0 && done === total);
      [['pct', pct + '%'], ['sTotal', total], ['sDone', done], ['sLeft', total - done]].forEach(([id, v]) => setNum($('#' + id), v));
      empty.hidden = total > 0;
    }

    function addItem(task, isNew) {
      const li = document.createElement('li');
      li.className = 'task' + (task.done ? ' done' : '') + (isNew ? ' new' : '');
      li.dataset.id = task.id;

      const box = document.createElement('input');
      box.type = 'checkbox';
      box.id = 'task-' + task.id;
      box.checked = task.done;

      const label = document.createElement('label');
      label.htmlFor = box.id;
      label.textContent = task.text;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete task: ' + task.text);

      li.append(box, label, del);
      list.append(li);
    }

    taskForm.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) { error.textContent = 'Enter a task before you add it.'; input.focus(); return; }
      error.textContent = '';
      const task = { id: Date.now(), text, done: false };
      tasks.push(task);
      addItem(task, true);
      input.value = '';
      save(); updateStats();
    });

    list.addEventListener('change', e => {
      const li = e.target.closest('.task');
      const task = tasks.find(t => t.id == li.dataset.id);
      task.done = e.target.checked;
      li.classList.toggle('done', task.done);
      save(); updateStats();
    });

    list.addEventListener('click', e => {
      if (!e.target.classList.contains('del')) return;
      const li = e.target.closest('.task');
      li.classList.add('out');
      setTimeout(() => {
        tasks = tasks.filter(t => t.id != li.dataset.id);
        li.remove();
        save(); updateStats();
      }, 350);
    });

    tasks.forEach(t => addItem(t, false));
    save();
    requestAnimationFrame(() => requestAnimationFrame(updateStats));
  }

  const form = $('#contactForm');
  if (form) {
    const status = $('#formStatus'), sendBtn = $('button[type=submit]', form);
    const rules = {
      name:    v => v ? '' : 'Enter your name.',
      email:   v => !v ? 'Enter your email address.'
                 : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Enter a valid email address, like name@example.com.',
      phone:   v => !v ? 'Enter your phone number.'
                 : /^\d+$/.test(v) ? '' : 'Use digits only (0-9), with no spaces, dashes or + sign.',
      message: v => v ? '' : 'Write a message before you send.'
    };

    function check(field) {
      const el = form.elements[field];
      const msg = rules[field](el.value.trim());
      el.classList.toggle('bad', Boolean(msg));
      el.setAttribute('aria-invalid', Boolean(msg));
      $('#err-' + field).textContent = msg;
      return !msg;
    }

    Object.keys(rules).forEach(field => {
      const el = form.elements[field];
      el.addEventListener('blur', () => check(field));
      el.addEventListener('input', () => { if (el.classList.contains('bad')) check(field); });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'status';
      const valid = Object.keys(rules).map(check).every(Boolean);
      if (!valid) {
        status.textContent = 'Fix the highlighted fields, then send again.';
        status.classList.add('no');
        $('.bad', form).focus();
        return;
      }
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
      try {
        const res = await fetch(form.action, {
          method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('Request failed');
        form.reset();
        form.classList.add('sent');
        setTimeout(() => form.classList.remove('sent'), 6000);
        status.textContent = 'Message sent. Thank you, I will reply soon.';
        status.classList.add('ok');
      } catch (err) {
        status.textContent = 'Message not sent. Check your connection and try again, or email me directly.';
        status.classList.add('no');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send message';
      }
    });
  }
})();
