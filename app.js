(() => {
  const rail = document.getElementById('rail');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const feedEl = document.getElementById('journey-feed');
  const feedWrap = document.querySelector('.journey-feed-wrap');
  const currentEl = document.getElementById('current');
  const totalEl = document.getElementById('total');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  // Gradient kept as a second background layer so the tile still reads
  // as branded artwork if the remote image fails to load.
  const TILE_FALLBACK = 'linear-gradient(140deg,#0A2E63,#0F5BA8)';

  totalEl.textContent = slides.length;
  let index = 0;
  let lastUrlIndex = -1;

  // The rollout as it actually unfolds for Harlow Engineering Group
  const events = [
    { slide: 0, time: 'Day 0',  icon: '📝', label: 'Global mandate signed',      meta: '5,000 employees in scope · ANZ · UK · SG', chip: '' },
    { slide: 0, time: 'Day 90', icon: '📉', label: 'Adoption stalls at 40%',     meta: '2,000 of 5,000 have ever logged in', chip: 'hot:GAP' },
    { slide: 1, time: 'Day 90', icon: '🔌', label: 'Six systems queried',        meta: 'Workday · Melon · Lumina · Agent Port · Mel', chip: '' },
    { slide: 2, time: 'Day 91', icon: '🧩', label: 'Profiles resolved',          meta: '5,000 employees → one profile each', chip: 'purple:IDENTITY' },
    { slide: 2, time: 'Day 91', icon: '🎯', label: 'Gap splits into 4 cohorts',  meta: '1,150 offline · 700 lapsed · 450 app-only', chip: 'purple:SEGMENT' },
    { slide: 2, time: 'Day 91', icon: '🚫', label: '700 suppressed',             meta: 'Non-travellers removed from the programme', chip: 'SUPPRESS' },
    { slide: 3, time: 'Day 92', icon: '🧠', label: 'Mosaic recommends',          meta: 'Mobile first · lead with her own trip', chip: 'hot:AI' },
    { slide: 3, time: 'Day 92', icon: '📡', label: 'Channel and timing set',     meta: 'Mel push · Tuesday 09:00 local', chip: 'ACTIVATION' },
    { slide: 4, time: 'Day 92', icon: '⚡', label: 'Nudge sequence live',        meta: '1,150 travelling but booking offline', chip: 'purple:AUTOMATION' },
    { slide: 4, time: 'Day 99', icon: '📋', label: 'Consultant task raised',     meta: 'Aisha Rahman · two nudges unanswered', chip: 'ACTION' },
    { slide: 5, time: 'Day 101', icon: '📞', label: 'Activated on the call',     meta: 'Tom Bradley · Workspace console', chip: 'purple:SERVICE' },
    { slide: 5, time: 'Day 105', icon: '✅', label: 'First self-serve booking',  meta: 'Aisha Rahman · PER → SIN, in Melon', chip: 'win:WIN' },
    { slide: 6, time: 'Week 12', icon: '📈', label: 'Adoption 78%',              meta: 'Offline bookings 61% → 24%', chip: 'win:WIN' }
  ];

  const chipHtml = (c) => {
    if (!c) return '';
    const [cls, text] = c.includes(':') ? c.split(':') : ['', c];
    return `<span class="evt-chip ${cls}">${text}</span>`;
  };

  events.forEach((e, i) => {
    const li = document.createElement('li');
    li.dataset.slide = e.slide;
    li.dataset.index = i;
    li.innerHTML = `
      <div class="evt-icon">${e.icon}</div>
      <div class="evt-time">${e.time}</div>
      <div class="evt-label">${e.label}</div>
      <div class="evt-meta">${e.meta}</div>
      ${chipHtml(e.chip)}
    `;
    li.addEventListener('click', () => go(e.slide));
    feedEl.appendChild(li);
  });

  const feedItems = Array.from(feedEl.children);

  const setActive = (i) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    currentEl.textContent = index + 1;
    if (index !== lastUrlIndex) {
      lastUrlIndex = index;
      // Throws on file:// in some browsers — the single-file build runs there.
      try { history.replaceState(null, '', '?slide=' + (index + 1)); } catch {}
    }
    let lastRevealed = -1;
    feedItems.forEach((el, n) => {
      const s = parseInt(el.dataset.slide, 10);
      const revealed = s <= index;
      el.classList.toggle('revealed', revealed);
      el.classList.remove('current', 'past');
      if (revealed) lastRevealed = n;
    });
    feedItems.forEach((el, n) => {
      if (n < lastRevealed) el.classList.add('past');
      else if (n === lastRevealed) el.classList.add('current');
    });
    if (lastRevealed >= 0 && feedWrap) {
      const target = feedItems[lastRevealed];
      const wrapRect = feedWrap.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      if (tRect.bottom > wrapRect.bottom || tRect.top < wrapRect.top) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (index === 0) playGapDial();
    if (index === 2) playSegment();
    else resetSegment();
    if (index === 3) { /* mosaic waits for the button */ } else resetMosaic();
    if (index !== 4) resetFlow();
    if (index !== 5) resetCall();
    if (index === 6) playOutcome();
  };

  const go = (i) => {
    setActive(i);
    const target = slides[index];
    if (isMobile()) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      rail.scrollTo({ left: index * window.innerWidth, behavior: 'smooth' });
    }
  };

  const isTypingTarget = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault(); go(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); go(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault(); go(0);
    } else if (e.key === 'End') {
      e.preventDefault(); go(slides.length - 1);
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => go(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(index + 1));

  let scrollTimer = null;
  const onScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (isMobile()) {
        const center = window.scrollY + window.innerHeight / 2;
        let best = 0, bestDist = Infinity;
        slides.forEach((s, i) => {
          const r = s.getBoundingClientRect();
          const mid = r.top + window.scrollY + r.height / 2;
          const dist = Math.abs(mid - center);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        setActive(best);
      } else {
        setActive(Math.round(rail.scrollLeft / window.innerWidth));
      }
    }, 90);
  };
  rail.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('resize', () => {
    if (!isMobile()) rail.scrollTo({ left: index * window.innerWidth, behavior: 'auto' });
  });

  let touchStartX = null;
  rail.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  rail.addEventListener('touchend', (e) => {
    if (touchStartX === null || isMobile()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
    touchStartX = null;
  });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const countUp = (el, target, ms = 1100, suffix = '') => new Promise(resolve => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(step);
      else { el.textContent = target.toLocaleString() + suffix; resolve(); }
    };
    requestAnimationFrame(step);
  });

  const CIRC = 326;

  // ---------- Data ----------
  let DATA = null;

  const ICONS = {
    people:   '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
    screen:   '<rect x="3" y="4.5" width="18" height="13" rx="2.5"/><path d="M8 21h8M12 17.5V21"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-13"/><path d="M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>',
    card:     '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 14.5h5"/>',
    chat:     '<path d="M20.5 12.5c0 4-3.8 7-8.5 7-1.2 0-2.3-.2-3.3-.5L4 20.5l1.4-3.6A6.9 6.9 0 013.5 12.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7z"/>',
    brain:    '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V4M9 13h.01M15 13h.01M9.5 16.5h5"/>'
  };

  // ---------- Slide 1: the adoption gap dial ----------
  const gapArc = document.getElementById('gap-arc');
  const gapValue = document.getElementById('gap-value');
  const gapCount = document.getElementById('gap-count');
  let gapPlayed = false;

  const playGapDial = async () => {
    if (gapPlayed || !gapArc) return;
    gapPlayed = true;
    const pct = 40;
    const start = performance.now();
    const dur = 1300;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = eased * pct;
      gapArc.setAttribute('stroke-dashoffset', CIRC - CIRC * (v / 100));
      gapValue.textContent = Math.round(v) + '%';
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (gapCount) countUp(gapCount, 2000, 1300);
  };

  // ---------- Slide 2: six source systems ----------
  const srcGrid = document.getElementById('src-grid');

  const renderSources = () => {
    if (!srcGrid || !DATA) return;
    srcGrid.innerHTML = '';
    DATA.sources.forEach((s, i) => {
      const card = document.createElement('article');
      card.className = 'src-card';
      card.style.setProperty('--src', s.colour);
      card.style.animationDelay = (i * 70) + 'ms';
      card.innerHTML = `
        <span class="src-cap"></span>
        <div class="src-head">
          <div class="src-ico"><svg viewBox="0 0 24 24" stroke="${s.colour}">${ICONS[s.icon] || ICONS.card}</svg></div>
          <div>
            <div class="src-name">${s.name}</div>
            <div class="src-role">${s.role}</div>
          </div>
        </div>
        <ul class="src-knows">${s.knows.map(k => `<li>${k}</li>`).join('')}</ul>
        <div class="src-cannot">
          <div class="src-cannot-k">Cannot answer</div>
          <p>${s.cannot}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        const active = card.classList.contains('focus');
        srcGrid.querySelectorAll('.src-card').forEach(c => c.classList.remove('focus'));
        srcGrid.classList.toggle('has-focus', !active);
        if (!active) card.classList.add('focus');
      });
      srcGrid.appendChild(card);
    });
  };

  // ---------- Slide 3: resolve and segment ----------
  const segPlay = document.getElementById('seg-play');
  const segProfiles = document.getElementById('seg-profiles');
  const segFill = document.getElementById('seg-fill');
  const cohBar = document.getElementById('coh-bar');
  const cohDetail = document.getElementById('coh-detail');
  let segAbort = false;
  let segPlayed = false;

  const resetSegment = () => {
    segAbort = true;
    segPlayed = false;
    if (segProfiles) segProfiles.textContent = '0';
    if (segFill) segFill.style.width = '0%';
    if (cohBar) cohBar.querySelectorAll('.coh-seg').forEach(s => s.classList.remove('shown', 'active'));
    if (cohDetail) cohDetail.hidden = true;
  };

  const renderCohortBar = () => {
    if (!cohBar || !DATA) return;
    const total = DATA.cohorts.reduce((a, c) => a + c.size, 0);
    cohBar.innerHTML = '';
    DATA.cohorts.forEach((c, i) => {
      const seg = document.createElement('button');
      seg.type = 'button';
      seg.className = 'coh-seg tone-' + c.tone;
      seg.style.flexGrow = c.size;
      seg.dataset.key = c.key;
      seg.setAttribute('role', 'tab');
      seg.innerHTML = `
        <span class="coh-seg-size">${c.size.toLocaleString()}</span>
        <span class="coh-seg-label">${c.label}</span>
        <span class="coh-seg-pct">${Math.round(c.size / total * 100)}%</span>
      `;
      seg.addEventListener('click', () => selectCohort(c.key));
      cohBar.appendChild(seg);
    });
  };

  const selectCohort = (key) => {
    if (!DATA) return;
    const c = DATA.cohorts.find(x => x.key === key);
    if (!c || !cohDetail) return;
    cohBar.querySelectorAll('.coh-seg').forEach(s =>
      s.classList.toggle('active', s.dataset.key === key));
    cohDetail.hidden = false;
    cohDetail.className = 'coh-detail tone-' + c.tone;
    document.getElementById('coh-size').textContent = c.size.toLocaleString();
    document.getElementById('coh-label').textContent = c.label;
    document.getElementById('coh-from').innerHTML =
      'resolved from ' + c.resolvedFrom.map(s => `<code>${s}</code>`).join(' ');
    const verdict = document.getElementById('coh-verdict');
    verdict.textContent = c.tone === 'suppress' ? 'Do not nudge' : 'Nudge';
    verdict.className = 'coh-verdict ' + (c.tone === 'suppress' ? 'no' : 'yes');
    document.getElementById('coh-insight').textContent = c.insight;
    document.getElementById('coh-treatment').textContent = c.treatment;
    document.getElementById('coh-channel').textContent = c.channel;
    document.getElementById('coh-value').textContent = c.value;
    document.getElementById('coh-logic').textContent = c.logic || '';
    const tile = document.getElementById('coh-tile');
    if (tile && c.image) tile.style.backgroundImage = `url('${c.image}'), ${TILE_FALLBACK}`;
  };

  const playSegment = async () => {
    if (segPlayed || !segFill) return;
    segPlayed = true;
    segAbort = false;
    const guard = async (ms) => { await wait(ms); if (segAbort) throw new Error('aborted'); };
    try {
      segFill.style.width = '100%';
      await countUp(segProfiles, 5000, 1200);
      await guard(250);
      const segs = Array.from(cohBar.querySelectorAll('.coh-seg'));
      for (const s of segs) {
        s.classList.add('shown');
        await guard(320);
      }
      await guard(200);
      selectCohort(DATA.cohorts[0].key);
    } catch {
      // aborted — slide changed
    }
  };

  if (segPlay) segPlay.addEventListener('click', () => { segPlayed = false; resetSegment(); segPlayed = false; playSegment(); });

  // ---------- Slide 4: Mosaic exchange ----------
  const mosExchange = document.getElementById('mos-exchange');
  const mosPlay = document.getElementById('mos-play');
  const mosReset = document.getElementById('mos-reset');
  const mosLanes = ['mos-lane-d360', 'mos-lane-mosaic', 'mos-lane-act'].map(id => document.getElementById(id));
  let mosAbort = false;

  const renderMosaic = () => {
    if (!mosExchange || !DATA) return;
    mosExchange.innerHTML = '';
    DATA.mosaicExchange.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'mos-row dir-' + r.dir;
      li.dataset.step = i + 1;
      li.innerHTML = `
        <div class="mos-row-arrow">${r.dir === 'back' ? '&larr;' : '&rarr;'}</div>
        <div class="mos-row-body">
          <div class="mos-row-head">
            <span class="mos-from">${r.from}</span>
            <span class="mos-to">${r.to}</span>
            <span class="mos-tag">${r.label}</span>
          </div>
          <div class="mos-row-detail">${r.detail}</div>
        </div>
      `;
      mosExchange.appendChild(li);
    });
  };

  const resetMosaic = () => {
    mosAbort = true;
    if (mosExchange) mosExchange.querySelectorAll('.mos-row').forEach(r => r.classList.remove('shown', 'live'));
    mosLanes.forEach(l => l && l.classList.remove('active'));
  };

  const playMosaic = async () => {
    if (!mosExchange) return;
    mosAbort = true;
    await wait(30);
    resetMosaic();
    mosAbort = false;
    const guard = async (ms) => { await wait(ms); if (mosAbort) throw new Error('aborted'); };
    const rows = Array.from(mosExchange.querySelectorAll('.mos-row'));
    // Which lanes light up as each message passes between them.
    const lanePairs = [[0, 1], [1, 0], [0, 2], [2, 1]];
    try {
      for (let i = 0; i < rows.length; i++) {
        mosLanes.forEach(l => l && l.classList.remove('active'));
        lanePairs[i].forEach(n => mosLanes[n] && mosLanes[n].classList.add('active'));
        rows[i].classList.add('shown', 'live');
        await guard(1250);
        rows[i].classList.remove('live');
      }
      mosLanes.forEach(l => l && l.classList.add('active'));
    } catch {
      // aborted
    }
  };

  if (mosPlay) mosPlay.addEventListener('click', playMosaic);
  if (mosReset) mosReset.addEventListener('click', resetMosaic);

  // ---------- Slide 5: nudge escalation flow ----------
  const flowEl = document.getElementById('flow-nudge');
  const flowPlayFull = document.getElementById('flow-play-full');
  const flowPlayEarly = document.getElementById('flow-play-early');
  const flowResetBtn = document.getElementById('flow-reset');
  let flowAbort = false;

  const resetFlow = () => {
    if (!flowEl) return;
    flowAbort = true;
    flowEl.querySelectorAll('[data-step]').forEach(n => n.classList.remove('revealed', 'sending'));
    flowEl.querySelectorAll('.flow-arrow').forEach(a => a.classList.remove('revealed', 'flowing'));
    flowEl.querySelectorAll('.branch').forEach(b => b.classList.remove('active', 'inactive'));
    flowEl.querySelectorAll('.flow-exit').forEach(x => x.classList.remove('revealed', 'cleared'));
  };

  const reveal = (selector) => {
    if (!flowEl) return;
    flowEl.querySelectorAll(selector).forEach(el => el.classList.add('revealed'));
  };

  const flowArrow = (step) => {
    const a = flowEl.querySelector(`.flow-arrow[data-step="${step}"]`);
    if (a) a.classList.add('revealed', 'flowing');
  };

  const playFlow = async (path = 'full') => {
    if (!flowEl) return;
    flowAbort = true;
    await wait(50);
    resetFlow();
    flowAbort = false;

    const guard = async (ms) => {
      await wait(ms);
      if (flowAbort) throw new Error('aborted');
    };

    try {
      reveal('.flow-node.trigger[data-step="1"]');
      await guard(700);
      flowArrow(1);
      await guard(500);

      const inapp = flowEl.querySelector('.flow-node.inapp');
      inapp.classList.add('revealed', 'sending');
      await guard(1200);
      inapp.classList.remove('sending');
      flowArrow(2);
      await guard(500);

      reveal('.flow-decision[data-step="3"]');
      await guard(800);
      const inappNo = flowEl.querySelector('[data-branch="inapp-no"]');
      const inappYes = flowEl.querySelector('[data-branch="inapp-yes"]');

      if (path === 'early') {
        inappYes.classList.add('active');
        inappNo.classList.add('inactive');
        await guard(700);
        flowEl.querySelector('.flow-exit.inapp-exit').classList.add('revealed', 'cleared');
        return;
      }

      inappNo.classList.add('active');
      inappYes.classList.add('inactive');
      await guard(900);
      flowArrow(4);
      await guard(500);

      const email = flowEl.querySelector('.flow-node.sms');
      email.classList.add('revealed', 'sending');
      await guard(1200);
      email.classList.remove('sending');
      flowArrow(5);
      await guard(500);

      reveal('.flow-decision[data-step="5"]');
      await guard(800);
      flowEl.querySelector('[data-branch="sms-no"]').classList.add('active');
      flowEl.querySelector('[data-branch="sms-yes"]').classList.add('inactive');
      await guard(900);
      flowArrow(6);
      await guard(500);

      const call = flowEl.querySelector('.flow-node.call');
      call.classList.add('revealed', 'sending');
      await guard(1400);
      call.classList.remove('sending');
      flowArrow(7);
      await guard(500);

      flowEl.querySelector('.flow-exit.success').classList.add('revealed', 'cleared');
    } catch {
      // aborted — a newer run or a slide change took over
    }
  };

  if (flowPlayFull) flowPlayFull.addEventListener('click', () => playFlow('full'));
  if (flowPlayEarly) flowPlayEarly.addEventListener('click', () => playFlow('early'));
  if (flowResetBtn) flowResetBtn.addEventListener('click', resetFlow);

  // ---------- Slide 6: activate on the call ----------
  const callBtn = document.getElementById('call-activate');
  const asBtn = document.getElementById('as-btn');
  const asPill = document.getElementById('as-pill');
  const asStatus = document.getElementById('act-status');
  const callNote = document.getElementById('call-note');
  const qsLogins = document.getElementById('qs-logins');
  const qsLoginsSub = document.getElementById('qs-logins-sub');
  const talkTrack = document.getElementById('talk-track');

  const CALL_DEFAULTS = {
    note: 'Aisha Rahman is on the line about her Singapore trip.',
    talk: talkTrack ? talkTrack.innerHTML : ''
  };

  const resetCall = () => {
    if (!asPill) return;
    asPill.textContent = 'Not activated';
    asPill.className = 'as-pill warn';
    if (asStatus) asStatus.classList.remove('activated');
    if (qsLogins) qsLogins.textContent = '0';
    if (qsLoginsSub) {
      qsLoginsSub.textContent = 'never activated';
      qsLoginsSub.className = 'sfc-qs-delta down';
    }
    if (callNote) callNote.textContent = CALL_DEFAULTS.note;
    if (talkTrack) talkTrack.innerHTML = CALL_DEFAULTS.talk;
  };

  const activateOnCall = () => {
    if (!asPill) return;
    asPill.textContent = '✓ Activated on call';
    asPill.className = 'as-pill ok';
    if (asStatus) asStatus.classList.add('activated');
    if (qsLogins) qsLogins.textContent = '1';
    if (qsLoginsSub) {
      qsLoginsSub.textContent = 'first login · with consultant';
      qsLoginsSub.className = 'sfc-qs-delta up';
    }
    if (callNote) callNote.textContent = 'Activated at 10:31. Suppressed from further nudges.';
    if (talkTrack) {
      talkTrack.innerHTML = `
        <p><b>Done on the call.</b> Logged in, app linked, Singapore trip visible.
        <mark>&ldquo;Next time, it'll be in your pocket before you ring me.&rdquo;</mark></p>
        <ul class="tt-after">
          <li>Melon activation written back to <b>Data 360</b></li>
          <li>Removed from the nudge audience in <b>MCAE</b></li>
          <li>Outcome fed to <b>Mosaic</b> — consultant-assisted activation works for this cohort</li>
        </ul>
        <div class="tt-src">one action, three systems updated</div>
      `;
    }
  };

  if (callBtn) callBtn.addEventListener('click', activateOnCall);
  if (asBtn) asBtn.addEventListener('click', activateOnCall);

  // ---------- Slide 7: outcome ----------
  const outSvg = document.getElementById('out-svg');
  const outLine = document.getElementById('out-line');
  const outArea = document.getElementById('out-area');
  const outDot = document.getElementById('out-dot');
  const outMetrics = document.getElementById('out-metrics');
  const reuseChips = document.getElementById('reuse-chips');
  let outPlayed = false;

  const renderOutcome = () => {
    if (!DATA) return;
    if (outMetrics) {
      outMetrics.innerHTML = '';
      DATA.outcome.metrics.forEach(m => {
        const el = document.createElement('div');
        el.className = 'out-metric tone-' + m.tone;
        el.innerHTML = `
          <div class="om-label">${m.label}</div>
          <div class="om-move">
            <span class="om-from">${m.from}</span>
            <span class="om-arrow">&rarr;</span>
            <span class="om-to">${m.to}</span>
          </div>
          <div class="om-note">${m.note}</div>
        `;
        outMetrics.appendChild(el);
      });
    }
    if (reuseChips) {
      reuseChips.innerHTML = DATA.outcome.reuse
        .map(r => `<span class="reuse-chip">${r}</span>`).join('');
    }
  };

  const playOutcome = () => {
    if (outPlayed || !outLine || !DATA) return;
    outPlayed = true;
    const curve = DATA.outcome.curve;
    const W = 520, H = 190, MIN = 30, MAX = 90;
    const pts = curve.map((v, i) => [
      (i / (curve.length - 1)) * W,
      H - ((v - MIN) / (MAX - MIN)) * H
    ]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    outLine.setAttribute('d', d);
    outArea.setAttribute('d', `${d} L${W} ${H} L0 ${H} Z`);

    const len = outLine.getTotalLength();
    outLine.style.strokeDasharray = len;
    outLine.style.strokeDashoffset = len;
    outArea.style.opacity = '0';
    // Force layout so the transition actually runs from the dashed state.
    void outLine.getBoundingClientRect();
    outLine.style.transition = 'stroke-dashoffset 1600ms ease-out';
    outArea.style.transition = 'opacity 900ms ease-out 600ms';
    outLine.style.strokeDashoffset = '0';
    outArea.style.opacity = '1';

    const last = pts[pts.length - 1];
    outDot.setAttribute('cx', last[0]);
    outDot.setAttribute('cy', last[1]);
    setTimeout(() => { if (outDot) outDot.setAttribute('opacity', '1'); }, 1500);
  };

  // ---------- Load data, then render everything that depends on it ----------
  fetch('data/p4.json')
    .then(r => r.json())
    .then(json => {
      DATA = json;
      renderSources();
      renderCohortBar();
      renderMosaic();
      renderOutcome();
      if (index === 2) playSegment();
      if (index === 6) playOutcome();
    })
    .catch(err => console.warn('p4.json failed to load', err));

  // ---- Reviewer comments ----
  const COMMENTS_KEY = 'ct-p4-comments';
  const REVIEWER_KEY = 'ct-p4-reviewer';
  const PRESENTER_KEY = 'ct-p4-presenter-mode';

  const slideTitles = slides.map((s, i) => s.dataset.title || `Slide ${i + 1}`);

  const loadComments = () => {
    try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveComments = (data) => localStorage.setItem(COMMENTS_KEY, JSON.stringify(data));

  const commentsToggle = document.getElementById('comments-toggle');
  const commentsPanel = document.getElementById('comments-panel');
  const commentsClose = document.getElementById('comments-close');
  const commentsInput = document.getElementById('comments-input');
  const commentsSave = document.getElementById('comments-save');
  const commentsSub = document.getElementById('comments-sub');
  const commentsList = document.getElementById('comments-list');
  const commentsCount = document.getElementById('comments-count');
  const reviewerNameInput = document.getElementById('reviewer-name');

  if (reviewerNameInput) {
    reviewerNameInput.value = localStorage.getItem(REVIEWER_KEY) || '';
    reviewerNameInput.addEventListener('input', () => {
      localStorage.setItem(REVIEWER_KEY, reviewerNameInput.value.trim());
    });
  }

  const refreshCount = () => {
    if (!commentsCount) return;
    const total = Object.values(loadComments()).reduce((n, arr) => n + (arr ? arr.length : 0), 0);
    commentsCount.hidden = total === 0;
    commentsCount.textContent = total;
  };

  const renderCommentsList = () => {
    if (!commentsList) return;
    const data = loadComments();
    const slideComments = data[index] || [];
    commentsList.innerHTML = '';
    slideComments.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      const timeStr = new Date(c.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      item.innerHTML = `
        <div class="cmeta"><span></span><span>${timeStr}</span></div>
        <div class="cbody"></div>
        <button class="cdel" aria-label="Delete">&times;</button>
      `;
      item.querySelector('.cmeta span').textContent = c.by || 'Reviewer';
      item.querySelector('.cbody').textContent = c.text;
      item.querySelector('.cdel').addEventListener('click', () => {
        const d = loadComments();
        if (d[index]) {
          d[index].splice(i, 1);
          if (!d[index].length) delete d[index];
          saveComments(d);
          renderCommentsList();
          refreshCount();
          if (index === slides.length - 1) renderRollup();
        }
      });
      commentsList.appendChild(item);
    });
  };

  const updateCommentsSub = () => {
    if (commentsSub) commentsSub.textContent = `${slideTitles[index]} (Slide ${index + 1})`;
    if (commentsInput) commentsInput.value = '';
    renderCommentsList();
  };

  const saveCurrent = () => {
    const text = commentsInput && commentsInput.value.trim();
    if (!text) return;
    const data = loadComments();
    if (!data[index]) data[index] = [];
    data[index].push({
      text,
      by: (reviewerNameInput && reviewerNameInput.value.trim()) || 'Reviewer',
      ts: Date.now()
    });
    saveComments(data);
    commentsInput.value = '';
    renderCommentsList();
    refreshCount();
    if (index === slides.length - 1) renderRollup();
  };

  if (commentsToggle) commentsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const shown = commentsPanel.hidden === false;
    commentsPanel.hidden = shown;
    if (!shown) {
      updateCommentsSub();
      setTimeout(() => commentsInput && commentsInput.focus(), 50);
    }
  });
  if (commentsClose) commentsClose.addEventListener('click', (e) => {
    e.stopPropagation();
    commentsPanel.hidden = true;
  });
  document.addEventListener('click', (e) => {
    if (commentsPanel.hidden) return;
    const widget = document.getElementById('comments-widget');
    if (widget && !widget.contains(e.target)) commentsPanel.hidden = true;
  });
  if (commentsSave) commentsSave.addEventListener('click', saveCurrent);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !commentsPanel.hidden) {
      e.preventDefault();
      saveCurrent();
    }
    if (e.key === 'Escape' && !commentsPanel.hidden) commentsPanel.hidden = true;
  });

  const commentsSlideSync = () => {
    if (commentsPanel && !commentsPanel.hidden) updateCommentsSub();
    if (index === slides.length - 1) renderRollup();
    const widget = document.getElementById('comments-widget');
    if (widget) {
      const onRecap = index === slides.length - 1;
      widget.style.display = onRecap ? 'none' : '';
      if (onRecap) commentsPanel.hidden = true;
    }
  };
  rail.addEventListener('scroll', commentsSlideSync, { passive: true });
  window.addEventListener('scroll', commentsSlideSync, { passive: true });
  const slideObserver = new MutationObserver(commentsSlideSync);
  feedItems.forEach(el => slideObserver.observe(el, { attributes: true, attributeFilter: ['class'] }));

  // ---- Feedback roll-up on the final slide ----
  const fbBody = document.getElementById('fb-body');
  const fbSub = document.getElementById('fb-sub');
  const fbCopy = document.getElementById('fb-copy');
  const fbClear = document.getElementById('fb-clear');

  const buildPlainText = () => {
    const data = loadComments();
    const lines = [];
    const reviewer = localStorage.getItem(REVIEWER_KEY) || 'Reviewer';
    lines.push(`Corporate Traveller · P4 onboarding deep dive — feedback from ${reviewer}`);
    lines.push(`(${new Date().toLocaleString()})`);
    lines.push('');
    let hadAny = false;
    slides.forEach((_, i) => {
      const arr = data[i];
      if (!arr || !arr.length) return;
      hadAny = true;
      lines.push(`── Slide ${i + 1}: ${slideTitles[i]} ──`);
      arr.forEach(c => {
        const when = new Date(c.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        lines.push(`• [${c.by || 'Reviewer'} · ${when}] ${c.text}`);
      });
      lines.push('');
    });
    return hadAny ? lines.join('\n') : '';
  };

  const renderRollup = () => {
    if (!fbBody) return;
    const data = loadComments();
    fbBody.innerHTML = '';
    let total = 0;
    slides.forEach((_, i) => {
      const arr = data[i];
      if (!arr || !arr.length) return;
      total += arr.length;
      const group = document.createElement('div');
      group.className = 'fb-slide-group';
      const title = document.createElement('div');
      title.className = 'fb-slide-title';
      title.textContent = `Slide ${i + 1} — ${slideTitles[i]}`;
      group.appendChild(title);
      arr.forEach(c => {
        const el = document.createElement('div');
        el.className = 'fb-comment';
        const when = new Date(c.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const by = document.createElement('div');
        by.className = 'fb-by';
        by.textContent = `${c.by || 'Reviewer'} · ${when}`;
        const txt = document.createElement('div');
        txt.textContent = c.text;
        el.appendChild(by);
        el.appendChild(txt);
        group.appendChild(el);
      });
      fbBody.appendChild(group);
    });
    if (!total) {
      const empty = document.createElement('div');
      empty.className = 'fb-empty';
      empty.textContent = 'Notes you leave on each screen are collected here, ready to copy out.';
      fbBody.appendChild(empty);
      if (fbSub) fbSub.textContent = 'No comments yet.';
    } else if (fbSub) {
      const slideCount = Object.keys(data).length;
      fbSub.textContent = `${total} comment${total === 1 ? '' : 's'} across ${slideCount} slide${slideCount === 1 ? '' : 's'}.`;
    }
  };

  if (fbCopy) fbCopy.addEventListener('click', async () => {
    const text = buildPlainText();
    if (!text) {
      fbCopy.textContent = 'Nothing to copy';
      setTimeout(() => fbCopy.textContent = '📋 Copy all', 1500);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    fbCopy.textContent = '✓ Copied';
    setTimeout(() => fbCopy.textContent = '📋 Copy all', 1500);
  });

  if (fbClear) fbClear.addEventListener('click', () => {
    if (!confirm('Clear all reviewer comments? This cannot be undone.')) return;
    localStorage.removeItem(COMMENTS_KEY);
    renderRollup();
    renderCommentsList();
    refreshCount();
  });

  // ---- Presenter mode ----
  const presenterToggle = document.getElementById('presenter-mode');
  const applyPresenterMode = (on) => {
    document.body.classList.toggle('presenter-mode', on);
    if (on && commentsPanel) commentsPanel.hidden = true;
  };
  if (presenterToggle) {
    const stored = localStorage.getItem(PRESENTER_KEY) === '1';
    presenterToggle.checked = stored;
    applyPresenterMode(stored);
    presenterToggle.addEventListener('change', () => {
      applyPresenterMode(presenterToggle.checked);
      localStorage.setItem(PRESENTER_KEY, presenterToggle.checked ? '1' : '0');
    });
  }

  refreshCount();
  renderRollup();

  // Deep link: ?slide=4 opens straight onto that screen
  const requested = parseInt(new URLSearchParams(location.search).get('slide') || '1', 10);
  const startIndex = Number.isFinite(requested)
    ? Math.max(0, Math.min(slides.length - 1, requested - 1))
    : 0;
  if (startIndex > 0) {
    rail.scrollTo({ left: startIndex * window.innerWidth, behavior: 'auto' });
    setActive(startIndex);
  } else {
    setActive(0);
  }
})();
