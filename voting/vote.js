const topicId = location.pathname.split('/').pop();
const titleEl = document.getElementById('topicTitle');
const optsEl = document.getElementById('options');
const statusEl = document.getElementById('status');

function getVoterId() {
  let id = localStorage.getItem('voterId');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
      String(Date.now()) + Math.random().toString(36).slice(2);
    localStorage.setItem('voterId', id);
  }
  return id;
}

function getMyVote() { return localStorage.getItem(`vote:${topicId}`); }
function setMyVote(option) { localStorage.setItem(`vote:${topicId}`, option); }

function paintSelection() {
  const mine = getMyVote();
  for (const btn of optsEl.querySelectorAll('button')) {
    btn.classList.toggle('selected', btn.dataset.option === mine);
  }
}

async function castVote(option) {
  statusEl.textContent = 'Submitting…';
  const res = await fetch('/api/voting/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId, option, voterId: getVoterId() })
  });
  if (!res.ok) {
    statusEl.textContent = 'Vote failed. Try again.';
    return;
  }
  setMyVote(option);
  paintSelection();
  statusEl.textContent = `Vote recorded: ${option}. Tap another to change.`;
}

async function init() {
  const res = await fetch(`/api/voting/topic/${encodeURIComponent(topicId)}`);
  if (!res.ok) {
    titleEl.textContent = 'Topic not found';
    return;
  }
  const topic = await res.json();
  titleEl.textContent = topic.title;
  for (const opt of topic.options) {
    const btn = document.createElement('button');
    btn.dataset.option = opt;
    btn.textContent = opt;
    btn.addEventListener('click', () => castVote(opt));
    optsEl.appendChild(btn);
  }
  paintSelection();
  const mine = getMyVote();
  if (mine) statusEl.textContent = `You voted: ${mine}. Tap another to change.`;
}

init();
