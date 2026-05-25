const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const { createStore } = require('./store');

const TOPICS_PATH = path.join(__dirname, 'topics.json');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';

function loadTopics() {
  const raw = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf8'));
  if (!Array.isArray(raw.topics) || raw.topics.length === 0) {
    throw new Error('voting/topics.json must define a non-empty "topics" array');
  }
  for (const t of raw.topics) {
    if (!t.id || !t.title || !Array.isArray(t.options) || t.options.length < 2) {
      throw new Error(`Invalid topic: ${JSON.stringify(t)}`);
    }
  }
  return raw.topics;
}

async function registerVoting(app, server) {
  const topics = loadTopics();
  const topicById = new Map(topics.map(t => [t.id, t]));
  const store = await createStore(topics);

  const io = new Server(server, { path: '/voting/socket.io' });

  function baseUrl(req) {
    if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
    return `${req.protocol}://${req.get('host')}`;
  }

  // Static assets for the widget and vote page
  app.use('/voting/static', require('express').static(__dirname));

  // Mobile vote page
  app.get('/vote/:topicId', (req, res) => {
    if (!topicById.has(req.params.topicId)) return res.status(404).send('Unknown topic');
    res.sendFile(path.join(__dirname, 'vote.html'));
  });

  app.get('/api/voting/topics', async (req, res) => {
    const out = await Promise.all(topics.map(async t => {
      const voteUrl = `${baseUrl(req)}/vote/${t.id}`;
      const qrDataUrl = await QRCode.toDataURL(voteUrl, { margin: 1, width: 220 });
      return {
        id: t.id,
        title: t.title,
        options: t.options,
        counts: await store.getCounts(t.id),
        voteUrl,
        qrDataUrl
      };
    }));
    res.json(out);
  });

  app.get('/api/voting/topic/:topicId', async (req, res) => {
    const topic = topicById.get(req.params.topicId);
    if (!topic) return res.status(404).json({ error: 'unknown topic' });
    const voteUrl = `${baseUrl(req)}/vote/${topic.id}`;
    const qrDataUrl = await QRCode.toDataURL(voteUrl, { margin: 1, width: 220 });
    res.json({
      id: topic.id,
      title: topic.title,
      options: topic.options,
      counts: await store.getCounts(topic.id),
      voteUrl,
      qrDataUrl
    });
  });

  app.post('/api/voting/vote', require('express').json(), async (req, res) => {
    const { topicId, option, voterId } = req.body || {};
    const topic = topicById.get(topicId);
    if (!topic) return res.status(400).json({ error: 'unknown topic' });
    if (!topic.options.includes(option)) return res.status(400).json({ error: 'unknown option' });
    if (!voterId || typeof voterId !== 'string' || voterId.length > 128) {
      return res.status(400).json({ error: 'missing voterId' });
    }
    const previous = await store.getPreviousVote(topicId, voterId);
    if (previous === option) {
      return res.json({ ok: true, counts: await store.getCounts(topicId), changed: false });
    }
    const counts = await store.recordVote(topicId, voterId, option, previous);
    io.emit('voting:tally', { topicId, counts });
    res.json({ ok: true, counts, changed: true });
  });

  io.on('connection', async socket => {
    const snapshot = await Promise.all(topics.map(async t => ({
      id: t.id,
      counts: await store.getCounts(t.id)
    })));
    socket.emit('voting:snapshot', snapshot);
  });

  console.log(`[voting] registered ${topics.length} topic(s)`);
}

module.exports = { registerVoting };
