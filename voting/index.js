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
  const conferenceQuestionIds = ['fc-q1', 'fc-q2', 'fc-q3'];
  const conferenceSessionState = {
    started: false,
    sessionId: Date.now(),
    activeIndex: 0,
    questionIds: conferenceQuestionIds,
    updatedAt: Date.now()
  };

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
  app.get('/vote-live', (_req, res) => {
    res.sendFile(path.join(__dirname, 'conference-live.html'));
  });

  app.get('/api/voting/conference/state', (_req, res) => {
    const activeTopicId = conferenceSessionState.started
      ? (conferenceSessionState.questionIds[conferenceSessionState.activeIndex] || null)
      : null;
    res.json({
      ...conferenceSessionState,
      activeTopicId,
      done: conferenceSessionState.started
        ? conferenceSessionState.activeIndex >= conferenceSessionState.questionIds.length
        : false
    });
  });

  app.post('/api/voting/conference/advance', require('express').json(), (req, res) => {
    const action = req.body?.action || 'next';
    if (action === 'reset') {
      conferenceSessionState.started = false;
      conferenceSessionState.sessionId = Date.now();
      conferenceSessionState.activeIndex = 0;
      conferenceSessionState.updatedAt = Date.now();
      Promise.all(conferenceSessionState.questionIds.map(topicId => store.resetTopic(topicId)))
        .then(results => {
          conferenceSessionState.questionIds.forEach((topicId, idx) => {
            io.emit('voting:tally', { topicId, counts: results[idx] || {} });
          });
          const activeTopicId = conferenceSessionState.questionIds[conferenceSessionState.activeIndex] || null;
          const payload = {
            ...conferenceSessionState,
            activeTopicId: conferenceSessionState.started ? activeTopicId : null,
            done: conferenceSessionState.started
              ? conferenceSessionState.activeIndex >= conferenceSessionState.questionIds.length
              : false
          };
          io.emit('voting:conference_state', payload);
          return res.json({ ok: true, state: payload });
        })
        .catch(err => {
          console.error('[voting] failed to reset conference tallies:', err);
          return res.status(500).json({ error: 'failed to reset tallies' });
        });
      return;
    } else if (action === 'next') {
      if (!conferenceSessionState.started) {
        conferenceSessionState.started = true;
        conferenceSessionState.activeIndex = 0;
      } else {
        conferenceSessionState.activeIndex = Math.min(
          conferenceSessionState.activeIndex + 1,
          conferenceSessionState.questionIds.length
        );
      }
      conferenceSessionState.updatedAt = Date.now();
    } else if (action === 'set') {
      const requested = Number(req.body?.activeIndex);
      if (!Number.isInteger(requested) || requested < 0 || requested > conferenceSessionState.questionIds.length) {
        return res.status(400).json({ error: 'invalid activeIndex' });
      }
      conferenceSessionState.started = true;
      conferenceSessionState.activeIndex = requested;
      conferenceSessionState.updatedAt = Date.now();
    } else {
      return res.status(400).json({ error: 'invalid action' });
    }
    const activeTopicId = conferenceSessionState.started
      ? (conferenceSessionState.questionIds[conferenceSessionState.activeIndex] || null)
      : null;
    const payload = {
      ...conferenceSessionState,
      activeTopicId,
      done: conferenceSessionState.started
        ? conferenceSessionState.activeIndex >= conferenceSessionState.questionIds.length
        : false
    };
    io.emit('voting:conference_state', payload);
    return res.json({ ok: true, state: payload });
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
    const activeTopicId = conferenceSessionState.questionIds[conferenceSessionState.activeIndex] || null;
    socket.emit('voting:conference_state', {
      ...conferenceSessionState,
      activeTopicId: conferenceSessionState.started ? activeTopicId : null,
      done: conferenceSessionState.started
        ? conferenceSessionState.activeIndex >= conferenceSessionState.questionIds.length
        : false
    });
  });

  console.log(`[voting] registered ${topics.length} topic(s)`);
}

module.exports = { registerVoting };
