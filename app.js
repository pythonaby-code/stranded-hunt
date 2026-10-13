// Stranded Hunt — сайт: загрузка, печатающийся текст, светлячки, параллакс, веер карточек,
// слайдер островов, появление при прокрутке, свечение под курсором, RU/EN.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let EN = false;
  try { EN = localStorage.getItem('sh_lang') === 'en'; } catch (e) {}
  const T = (ru, en) => (EN ? en : ru);

  // ---------- Данные ----------
  const CARDS = [
    { img: 'hunter', c: '#e9a23b', side: ['Это ты', 'That’s you'], name: ['Охотник', 'Hunter'], lvl: 'P1' },
    { img: 'chicken', c: '#6fbf5a', side: ['Добыча', 'Prey'], name: ['Курица', 'Chicken'], lvl: '1' },
    { img: 'rabbit', c: '#3fb6a8', side: ['Добыча', 'Prey'], name: ['Заяц', 'Rabbit'], lvl: '1' },
    { img: 'deer', c: '#7fae4f', side: ['Добыча', 'Prey'], name: ['Олень', 'Deer'], lvl: '2' },
    { img: 'boar', c: '#c9853b', side: ['Даёт сдачи', 'Fights back'], name: ['Кабан', 'Boar'], lvl: '3' },
    { img: 'bear', c: '#d9734e', side: ['Хищник', 'Predator'], name: ['Медведь', 'Bear'], lvl: '4' },
    { img: 'tiger', c: '#b06b3a', side: ['Хищник', 'Predator'], name: ['Тигр', 'Tiger'], lvl: '4' },
    { img: 'shark', c: '#4f8fc9', side: ['В проливах', 'In the straits'], name: ['Акула', 'Shark'], lvl: '4' },
    { img: 'crab', c: '#c4583a', side: ['Босс', 'Boss'], name: ['Краб', 'Crab'], lvl: '5' },
    { img: 'kraken', c: '#9a4f8f', side: ['Босс', 'Boss'], name: ['Кракен', 'Kraken'], lvl: '5' },
  ];
  const ISLANDS = [
    { img: 'rusty', n: '01', tags: [['Остров 1', 'Island 1'], ['Пляж', 'Beach'], ['Курицы', 'Chickens'], ['Машина', 'The car']],
      kick: ['Начало пути', 'Where it starts'], title: ['Ржавый Берег', 'Rusty Shore'],
      desc: ['Машина сломалась, и ты застрял на острове. Собери палки и камни, разведи костёр, поймай курицу и построй плот.',
        'Your car broke down and you’re stranded. Gather sticks and stones, light a fire, catch a chicken and build a raft.'],
      boss: ['Босс: Ржавый Краб', 'Boss: the Rusty Crab'] },
    { img: 'fang', n: '02', tags: [['Остров 2', 'Island 2'], ['Лес', 'Forest'], ['Лавка', 'Shop'], ['Медведи', 'Bears']],
      kick: ['Деньги и оружие', 'Money & weapons'], title: ['Кабаний Клык', 'Boar’s Fang'],
      desc: ['Лесной остров с кабанами, оленями и медведями. Дед Ефим купит мясо и рыбу и продаст арбалет, капкан и старое ружьё.',
        'A forest island of boars, deer and bears. Old Yefim buys meat and fish and sells a crossbow, a bear trap and an old rifle.'],
      boss: ['Босс: Вожак Клыкач', 'Boss: Old Tusk'] },
    { img: 'kraken', n: '03', tags: [['Остров 3', 'Island 3'], ['Горы', 'Mountains'], ['Тигры', 'Tigers'], ['Верфь', 'Shipyard']],
      kick: ['Последний рывок', 'The final push'], title: ['Туманный Рог', 'Misty Horn'],
      desc: ['Скалистый остров с тиграми. На верфи можно купить корабль домой, но в бухте живёт Кракен.',
        'A rocky island full of tigers. The shipyard sells a ship home — but the Kraken lives in the bay.'],
      boss: ['Босс: Кракен', 'Boss: the Kraken'] },
    { img: 'home', n: '04', tags: [['Финал', 'Finale'], ['Дом', 'Home']],
      kick: ['Конец пути', 'Journey’s end'], title: ['Дом', 'Home'],
      desc: ['Проведи корабль между скалами — и вот он, домик у причала. Каждого ждёт своя кровать.',
        'Steer the ship through the rocks — and there it is, the cabin by the pier. A bed for everyone.'],
      boss: ['', ''] },
  ];
  const PHRASES = [
    ['Машина сломалась. До дома — три острова.', 'The car broke down. Three islands to get home.'],
    ['Охоться, рыбачь, жарь мясо на костре.', 'Hunt, fish, cook meat on the campfire.'],
    ['Победи хозяина острова — иначе не уплыть.', 'Beat the island’s master — or you can’t leave.'],
    ['Играй с друзьями: до 4 охотников.', 'Play with friends: up to 4 hunters.'],
  ];

  // ---------- Язык ----------
  function applyLang() {
    document.documentElement.lang = EN ? 'en' : 'ru';
    $$('[data-en]').forEach(el => {
      if (!el.dataset.ru) el.dataset.ru = el.textContent;
      el.textContent = EN ? el.dataset.en : el.dataset.ru;
    });
    $$('#langBtn span').forEach(sp => sp.classList.toggle('on', (sp.dataset.l === 'en') === EN));
    renderCards();
    showIsland(cur, true);
  }
  $('#langBtn').addEventListener('click', () => {
    EN = !EN;
    try { localStorage.setItem('sh_lang', EN ? 'en' : 'ru'); } catch (e) {}
    applyLang();
    typer.restart();
  });

  // ---------- Загрузка: счётчик по реально загруженным картинкам ----------
  const loader = $('#loader'), num = $('#loadNum');
  // Ждём только то, что видно сразу (первый экран), — остальное догрузится по ходу прокрутки.
  const imgs = $$('.hero img, .nav img');
  let loaded = 0, shown = 0;
  imgs.forEach(i => { if (i.complete) loaded++; else i.addEventListener('load', () => loaded++, { once: true }), i.addEventListener('error', () => loaded++, { once: true }); });
  const t0 = performance.now();
  (function tick() {
    const byTime = Math.min(1, (performance.now() - t0) / 1100);
    const target = Math.min(byTime, imgs.length ? loaded / imgs.length : 1) * 100;
    shown += (target - shown) * 0.18 + 0.4;
    shown = Math.min(shown, target);
    num.textContent = Math.round(shown);
    if (shown >= 99.5 || performance.now() - t0 > 3000) {
      num.textContent = 100;
      setTimeout(() => { loader.classList.add('done'); start(); }, 250);
    } else requestAnimationFrame(tick);
  })();

  // ---------- Печатающийся текст ----------
  const typer = (() => {
    const el = $('#typed');
    let p = 0, i = 0, del = false, timer;
    function step() {
      const s = T(...PHRASES[p]);
      if (!del) {
        i++;
        el.textContent = s.slice(0, i);
        if (i >= s.length) { del = true; timer = setTimeout(step, 2200); return; }
        timer = setTimeout(step, 38 + Math.random() * 40);
      } else {
        i--;
        el.textContent = s.slice(0, i);
        if (i <= 0) { del = false; p = (p + 1) % PHRASES.length; timer = setTimeout(step, 350); return; }
        timer = setTimeout(step, 18);
      }
    }
    return {
      start() { if (reduce) { el.textContent = T(...PHRASES[0]); return; } step(); },
      restart() { clearTimeout(timer); i = 0; del = false; this.start(); },
    };
  })();

  // ---------- Веер карточек ----------
  const fan = $('#fan');
  let center = 0, fanTimer;
  function renderCards() {
    fan.innerHTML = '';
    CARDS.forEach((c, k) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.style.setProperty('--c', c.c);
      el.innerHTML = `<span class="side">${T(...c.side)}</span><span class="name">${T(...c.name)}</span>` +
        `<span class="badge"><i>⚔</i>${c.lvl}</span><img src="assets/cards/${c.img}.webp" alt="">`;
      el.addEventListener('click', () => { center = k; layoutFan(); restartFan(); });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      fan.appendChild(el);
    });
    layoutFan();
  }
  function layoutFan() {
    const n = CARDS.length, cards = fan.children;
    const narrow = innerWidth < 640, step = narrow ? 70 : Math.min(150, innerWidth / 11);
    for (let k = 0; k < n; k++) {
      let off = k - center;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      const a = Math.abs(off), vis = a <= (narrow ? 2 : 3);
      const el = cards[k];
      el.style.transform = `translateX(${off * step}px) translateY(${a * a * 9 + a * 16}px) rotate(${off * 8}deg) scale(${1 - a * 0.06})`;
      el.style.zIndex = 20 - a;
      el.style.opacity = vis ? 1 : 0;
      el.style.pointerEvents = vis ? '' : 'none';
      el.classList.toggle('dim', a > 0);
    }
  }
  function restartFan() {
    clearInterval(fanTimer);
    if (!reduce) fanTimer = setInterval(() => { center = (center + 1) % CARDS.length; layoutFan(); }, 2600);
  }
  fan.addEventListener('mouseenter', () => clearInterval(fanTimer));
  fan.addEventListener('mouseleave', restartFan);
  addEventListener('resize', layoutFan);

  // ---------- Слайдер островов ----------
  let cur = 0;
  const bg = $('#panelBg'), info = $('.panel-info');
  function showIsland(k, instant) {
    cur = (k + ISLANDS.length) % ISLANDS.length;
    const s = ISLANDS[cur];
    const apply = () => {
      $('#slTags').innerHTML = s.tags.map(t => `<span>${T(...t)}</span>`).join('');
      $('#slKicker').textContent = T(...s.kick);
      $('#slTitle').textContent = T(...s.title);
      $('#slDesc').textContent = T(...s.desc);
      $('#slBoss').textContent = T(...s.boss);
      $('#slNum').textContent = s.n;
      bg.style.backgroundImage = `url(assets/shots/${s.img}.jpg)`;
      $('#thumbs').innerHTML = '';
      for (let j = 1; j <= 3; j++) {
        const o = ISLANDS[(cur + j) % ISLANDS.length], idx = (cur + j) % ISLANDS.length;
        const t = document.createElement('button');
        t.className = 'thumb';
        t.type = 'button';
        t.style.backgroundImage = `url(assets/shots/${o.img}_s.jpg)`;
        t.innerHTML = `<span>${T(...o.title)}</span>`;
        t.addEventListener('click', () => go(idx));
        $('#thumbs').appendChild(t);
      }
    };
    if (instant || reduce) { apply(); return; }
    bg.classList.add('fade');
    info.classList.add('swap');
    setTimeout(() => { apply(); bg.classList.remove('fade'); info.classList.remove('swap'); }, 420);
  }
  let slTimer;
  function go(k) { showIsland(k); clearInterval(slTimer); slTimer = setInterval(() => showIsland(cur + 1), 6500); }
  $('#prev').addEventListener('click', () => go(cur - 1));
  $('#next').addEventListener('click', () => go(cur + 1));

  // ---------- Свечение под курсором ----------
  $$('.glowable').forEach(el => el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  // ---------- Появление при прокрутке ----------
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });

  // ---------- Параллакс: мышь (главный экран) и прокрутка ----------
  const floaters = $$('.fl'), deep = $$('[data-depth]:not(.fl)');
  const panel = $('#panel');
  let mx = 0, my = 0, sx = 0, sy = 0;
  addEventListener('mousemove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  function frame() {
    sx += (mx - sx) * 0.06; sy += (my - sy) * 0.06;
    const y = scrollY;
    floaters.forEach(f => {
      const d = +f.dataset.depth;
      f.style.transform = `translate(${sx * d * -60}px, ${sy * d * -60 - y * d * 0.35}px)`;
    });
    deep.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.translate = `0 ${k * -110 * +el.dataset.depth}px`;
    });
    // Панель островов: въезжает наклонённой (как карточка, развернувшаяся в мир) и выпрямляется.
    const pr = panel.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, 1 - (pr.top - innerHeight * 0.12) / (innerHeight * 0.75)));
    const e = 1 - Math.pow(1 - p, 3);
    panel.style.transform = `rotateX(${(1 - e) * 28}deg) scale(${0.82 + e * 0.18})`;
    bg.style.translate = `${sx * -14}px ${(pr.top / innerHeight) * 40}px`;
    $('#nav').classList.toggle('solid', y > 40);
    requestAnimationFrame(frame);
  }

  // ---------- Светлячки ----------
  function fireflies() {
    const cv = $('#fireflies'), ctx = cv.getContext('2d');
    let W, H, flies;
    function size() {
      W = cv.width = cv.offsetWidth * devicePixelRatio;
      H = cv.height = cv.offsetHeight * devicePixelRatio;
      const n = Math.round(Math.min(90, cv.offsetWidth / 16));
      flies = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.9,
        a: Math.random() * 6.28, s: 0.2 + Math.random() * 0.5, ph: Math.random() * 6.28,
        hue: Math.random() < 0.75 ? 90 : 48,
      }));
    }
    size();
    addEventListener('resize', size);
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.a += (Math.random() - 0.5) * 0.12;
        f.x += Math.cos(f.a) * f.s * f.z * devicePixelRatio;
        f.y += (Math.sin(f.a) * f.s - 0.12) * f.z * devicePixelRatio;
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
        if (f.y < -20) f.y = H + 20; if (f.y > H + 20) f.y = -20;
        const glow = 0.35 + 0.65 * Math.max(0, Math.sin(t / 900 + f.ph));
        const x = f.x + sx * -40 * f.z * devicePixelRatio, y = f.y + sy * -40 * f.z * devicePixelRatio;
        const r = (2 + f.z * 7) * devicePixelRatio;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `hsla(${f.hue}, 95%, 75%, ${0.9 * glow})`);
        g.addColorStop(0.25, `hsla(${f.hue}, 90%, 60%, ${0.35 * glow})`);
        g.addColorStop(1, 'hsla(90, 90%, 50%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  // ---------- Запуск ----------
  applyLang();
  function start() {
    $$('.reveal').forEach(el => io.observe(el));
    typer.start();
    restartFan();
    go(0);
    fireflies();
    requestAnimationFrame(frame);
  }
})();
