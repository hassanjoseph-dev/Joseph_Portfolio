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
    const dateInput = $('#taskDate'), timeInput = $('#taskTime'), prioInput = $('#taskPriority');
    const ring = $('#ring'), count = $('#count'), empty = $('#empty');
    const setNum = (el, v) => { if (el.textContent !== String(v)) { el.textContent = v; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } };
    const starter = ['Complete COS101 assignment', 'Study MTH101', 'Review PHY101 notes',
      'Complete GST121 coursework', 'Practice JavaScript', 'Work on portfolio website',
      'Prepare for upcoming examination'];

    let tasks = null;
    try { tasks = JSON.parse(localStorage.getItem(KEY)); } catch (e) { tasks = null; }
    if (!Array.isArray(tasks)) tasks = starter.map((text, i) => ({ id: i + 1, text, done: false }));

    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };

    const pad = n => String(n).padStart(2, '0');
    const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const dueAt = task => (task.date && task.time) ? new Date(task.date + 'T' + task.time) : null;

    function whenText(task) {
      if (!task.date) return '';
      const d = new Date(task.date + 'T' + (task.time || '00:00'));
      if (isNaN(d)) return '';
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      let day;
      if (task.date === dayKey(now)) day = 'Today';
      else if (task.date === dayKey(tomorrow)) day = 'Tomorrow';
      else {
        const opts = { weekday: 'short', day: 'numeric', month: 'short' };
        if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
        day = d.toLocaleDateString('en-GB', opts);
      }
      const time = task.time ? ', ' + d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
      return day + time;
    }

    function isLate(task) {
      if (task.done || !task.date) return false;
      const end = new Date(task.date + 'T' + (task.time || '23:59'));
      return !isNaN(end) && end < new Date();
    }

    function paintWhen(li, task) {
      const when = li.querySelector('.when');
      const text = whenText(task);
      const late = isLate(task);
      when.hidden = false;
      when.classList.toggle('none', !text);
      when.textContent = !text ? 'No date set' : late ? 'Overdue: ' + text : text;
      when.classList.toggle('late', late);
    }

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

    function buildItem(task, isNew) {
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

      const prio = document.createElement('span');
      prio.className = 'prio';
      const level = task.priority || 'normal';
      prio.hidden = level === 'normal';
      prio.textContent = level === 'high' ? 'High priority' : 'Low priority';
      prio.classList.toggle('high', level === 'high');

      const when = document.createElement('span');
      when.className = 'when';

      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.append(prio, when);

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'edit';
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label', 'Edit task: ' + task.text);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', 'Delete task: ' + task.text);

      const actions = document.createElement('span');
      actions.className = 'actions';
      actions.append(edit, del);

      li.append(box, label, meta, actions);
      paintWhen(li, task);
      return li;
    }

    const addItem = (task, isNew) => list.append(buildItem(task, isNew));

    function startEdit(li, task) {
      if (li.classList.contains('editing')) return;
      li.classList.add('editing');

      const ed = document.createElement('div');
      ed.className = 'editor';

      const text = document.createElement('input');
      text.type = 'text';
      text.maxLength = 120;
      text.value = task.text;
      text.setAttribute('aria-label', 'Task');

      const date = document.createElement('input');
      date.type = 'date';
      date.value = task.date || '';
      date.setAttribute('aria-label', 'Due date');

      const time = document.createElement('input');
      time.type = 'time';
      time.value = task.time || '';
      time.setAttribute('aria-label', 'Due time');

      const prio = document.createElement('select');
      prio.setAttribute('aria-label', 'Priority');
      [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']].forEach(([v, t]) => {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        prio.append(o);
      });
      prio.value = task.priority || 'normal';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn line';
      cancelBtn.textContent = 'Cancel';

      const err = document.createElement('p');
      err.className = 'err';
      err.setAttribute('role', 'alert');

      ed.append(text, date, time, prio, saveBtn, cancelBtn, err);
      li.append(ed);
      text.focus();

      cancelBtn.addEventListener('click', () => { li.classList.remove('editing'); ed.remove(); });

      saveBtn.addEventListener('click', () => {
        const v = text.value.trim();
        if (!v) { err.textContent = 'Enter a task name.'; text.focus(); return; }
        if (time.value && !date.value) { err.textContent = 'Choose a date for that time.'; date.focus(); return; }
        task.text = v;
        task.priority = prio.value;
        if (date.value) task.date = date.value; else delete task.date;
        if (time.value) task.time = time.value; else delete task.time;
        const due = dueAt(task);
        task.reminded = Boolean(due && due <= new Date());
        li.replaceWith(buildItem(task, false));
        save();
      });

      ed.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
        if (e.key === 'Escape') cancelBtn.click();
      });
    }

    function complete(id) {
      const task = tasks.find(t => t.id == id);
      if (!task) return;
      task.done = true;
      const li = list.querySelector('[data-id="' + id + '"]');
      if (li) {
        li.classList.add('done');
        li.querySelector('input[type=checkbox]').checked = true;
        paintWhen(li, task);
      }
      save(); updateStats();
    }

    const notifySupported = 'Notification' in window;
    const toasts = $('#toasts') || (() => {
      const d = document.createElement('div');
      d.id = 'toasts';
      d.className = 'toasts';
      d.setAttribute('aria-live', 'assertive');
      document.body.append(d);
      return d;
    })();

    let audioCtx = null;
    const unlockAudio = () => {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch (e) {}
    };
    addEventListener('pointerdown', unlockAudio, { once: true });
    addEventListener('keydown', unlockAudio, { once: true });

    function beep() {
      if (!audioCtx || audioCtx.state !== 'running') return;
      try {
        [0, 0.25, 0.5].forEach(offset => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine';
          o.frequency.value = 880;
          o.connect(g);
          g.connect(audioCtx.destination);
          const t = audioCtx.currentTime + offset;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
          o.start(t);
          o.stop(t + 0.22);
        });
      } catch (e) {}
    }

    function toast(message, task) {
      const el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'alert');
      const msg = document.createElement('p');
      msg.textContent = message;
      const row = document.createElement('div');
      row.className = 'toast-actions';
      if (task) {
        const done = document.createElement('button');
        done.type = 'button';
        done.className = 'primary';
        done.textContent = 'Mark done';
        done.addEventListener('click', () => { complete(task.id); el.remove(); });
        row.append(done);
      }
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = 'Dismiss';
      close.addEventListener('click', () => el.remove());
      row.append(close);
      el.append(msg, row);
      toasts.append(el);
    }

    function alertTask(task) {
      const text = 'Reminder: "' + task.text + '" is due now.';
      toast(text, task);
      beep();
      if (notifySupported && Notification.permission === 'granted') {
        try { new Notification('Planner reminder', { body: text }); } catch (e) {}
      }
    }

    function checkReminders(initial) {
      const now = new Date();
      let missed = 0, changed = false;
      tasks.forEach(task => {
        if (task.done || task.reminded) return;
        const due = dueAt(task);
        if (!due || isNaN(due) || due > now) return;
        task.reminded = true;
        changed = true;
        if (initial && now - due > 5 * 60 * 1000) { missed++; return; }
        alertTask(task);
      });
      if (missed) toast('While the planner was closed, ' + missed + (missed === 1 ? ' task reached its time.' : ' tasks reached their time.') + ' Check the Overdue labels below.');
      if (changed) save();
      list.querySelectorAll('.task').forEach(li => {
        const task = tasks.find(t => t.id == li.dataset.id);
        if (task && !li.classList.contains('editing')) paintWhen(li, task);
      });
    }

    const remind = document.createElement('div');
    remind.className = 'remind';
    const remindBtn = document.createElement('button');
    remindBtn.type = 'button';
    remindBtn.className = 'btn line';
    remindBtn.textContent = 'Turn on browser alerts';
    const remindNote = document.createElement('p');
    remindNote.className = 'note';
    remind.append(remindBtn, remindNote);
    taskForm.after(remind);

    function syncRemind() {
      if (!notifySupported) {
        remindBtn.hidden = true;
        remindNote.textContent = 'Reminders pop up on this page, with a sound, when a task reaches its time. Keep this page open to get them.';
      } else if (Notification.permission === 'granted') {
        remindBtn.hidden = true;
        remindNote.textContent = 'Reminders are on. When a task reaches its time you get an alert and a sound, as long as this page is open.';
      } else if (Notification.permission === 'denied') {
        remindBtn.hidden = true;
        remindNote.textContent = 'Browser alerts are blocked for this site. Reminders still pop up on this page, with a sound, while it is open.';
      } else {
        remindBtn.hidden = false;
        remindNote.textContent = 'Reminders pop up on this page, with a sound, while it is open. Turn on browser alerts to get a system notification too.';
      }
    }
    syncRemind();

    remindBtn.addEventListener('click', () => {
      unlockAudio();
      let handled = false;
      const done = () => {
        if (handled) return;
        handled = true;
        syncRemind();
        if (Notification.permission === 'granted') { toast('Browser alerts are on.'); beep(); }
      };
      const r = Notification.requestPermission(done);
      if (r && r.then) r.then(done);
    });

    taskForm.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) { error.textContent = 'Enter a task before you add it.'; input.focus(); return; }
      if (timeInput.value && !dateInput.value) { error.textContent = 'Choose a date for that time.'; dateInput.focus(); return; }
      error.textContent = '';
      const task = { id: Date.now(), text, done: false, priority: prioInput.value };
      if (dateInput.value) task.date = dateInput.value;
      if (timeInput.value) task.time = timeInput.value;
      const due = dueAt(task);
      task.reminded = Boolean(due && due <= new Date());
      tasks.push(task);
      addItem(task, true);
      input.value = '';
      dateInput.value = '';
      timeInput.value = '';
      prioInput.value = 'normal';
      save(); updateStats();
    });

    list.addEventListener('change', e => {
      if (e.target.type !== 'checkbox') return;
      const li = e.target.closest('.task');
      const task = tasks.find(t => t.id == li.dataset.id);
      task.done = e.target.checked;
      li.classList.toggle('done', task.done);
      paintWhen(li, task);
      save(); updateStats();
    });

    list.addEventListener('click', e => {
      const li = e.target.closest('.task');
      if (!li) return;
      if (e.target.classList.contains('edit')) {
        const task = tasks.find(t => t.id == li.dataset.id);
        if (task) startEdit(li, task);
        return;
      }
      if (!e.target.classList.contains('del')) return;
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

    checkReminders(true);
    setInterval(() => checkReminders(false), 10000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(false); });
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
