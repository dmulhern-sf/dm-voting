// Embeddable live-vote widget for Decktools slides.
// Usage:  <div data-vote-topic="cats-vs-dogs"></div>
//         <script src="/voting/static/voting-widget.js"></script>
// Loads /voting/static/voting-widget.css automatically.

(function () {
  const STYLE_ID = 'dt-vote-style';
  if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = '/voting/static/voting-widget.css';
    document.head.appendChild(link);
  }

  const widgets = new Map(); // topicId -> [{ el, options, counts }]
  let socket = null;

  function ensureSocket() {
    if (socket) return socket;
    if (!window.io) {
      const s = document.createElement('script');
      s.src = '/voting/socket.io/socket.io.js';
      s.onload = () => connectSocket();
      document.head.appendChild(s);
    } else {
      connectSocket();
    }
  }

  function connectSocket() {
    socket = window.io({ path: '/voting/socket.io' });
    socket.on('voting:tally', ({ topicId, counts }) => updateAll(topicId, counts));
  }

  function updateAll(topicId, counts) {
    const list = widgets.get(topicId);
    if (!list) return;
    for (const w of list) renderCounts(w, counts);
  }

  function renderCounts(w, counts) {
    w.counts = counts;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    for (const [opt, n] of Object.entries(counts)) {
      const row = w.el.querySelector(`.dt-vote-row[data-option="${CSS.escape(opt)}"]`);
      if (!row) continue;
      const pct = total === 0 ? 0 : (n / total) * 100;
      row.querySelector('.dt-vote-bar > span').style.width = `${pct}%`;
      row.querySelector('.dt-vote-count').textContent = n;
    }
  }

  async function mount(el) {
    const topicId = el.dataset.voteTopic;
    if (!topicId) return;
    el.classList.add('dt-vote');
    el.innerHTML = `
      <div class="dt-vote-qr">
        <img alt="" />
        <p class="dt-vote-hint">Scan to vote</p>
        <div class="dt-vote-url"></div>
      </div>
      <div class="dt-vote-body">
        <h3 class="dt-vote-title"></h3>
        <div class="dt-vote-results"></div>
      </div>
    `;

    const res = await fetch(`/api/voting/topic/${encodeURIComponent(topicId)}`);
    if (!res.ok) {
      el.querySelector('.dt-vote-title').textContent = 'Unknown topic';
      return;
    }
    const topic = await res.json();
    el.querySelector('.dt-vote-title').textContent = topic.title;
    el.querySelector('.dt-vote-qr img').src = topic.qrDataUrl;
    el.querySelector('.dt-vote-qr img').alt = `QR code for ${topic.title}`;
    el.querySelector('.dt-vote-url').textContent = topic.voteUrl;

    const results = el.querySelector('.dt-vote-results');
    for (const opt of topic.options) {
      const row = document.createElement('div');
      row.className = 'dt-vote-row';
      row.dataset.option = opt;
      row.innerHTML = `
        <div class="dt-vote-label">${opt}</div>
        <div class="dt-vote-bar"><span></span></div>
        <div class="dt-vote-count">0</div>
      `;
      results.appendChild(row);
    }

    const widget = { el, options: topic.options, counts: topic.counts };
    if (!widgets.has(topicId)) widgets.set(topicId, []);
    widgets.get(topicId).push(widget);
    renderCounts(widget, topic.counts);
    ensureSocket();
  }

  function init() {
    document.querySelectorAll('[data-vote-topic]').forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
