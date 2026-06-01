// Tally store. In-memory by default; uses Redis if REDIS_URL is set.
// Shape: tally(topicId) -> { [option]: count }, voter(topicId, voterId) -> option

class MemoryStore {
  constructor(topics) {
    this.tallies = new Map();
    this.voters = new Map();
    for (const t of topics) {
      this.tallies.set(t.id, Object.fromEntries(t.options.map(o => [o, 0])));
      this.voters.set(t.id, new Map());
    }
  }
  async getCounts(topicId) { return this.tallies.get(topicId); }
  async getPreviousVote(topicId, voterId) { return this.voters.get(topicId).get(voterId); }
  async recordVote(topicId, voterId, option, previous) {
    const counts = this.tallies.get(topicId);
    if (previous && previous !== option) counts[previous] = Math.max(0, counts[previous] - 1);
    counts[option] += 1;
    this.voters.get(topicId).set(voterId, option);
    return counts;
  }
}

class RedisStore {
  constructor(redis, topics) {
    this.redis = redis;
    this.topics = new Map(topics.map(t => [t.id, t]));
  }
  async getCounts(topicId) {
    const topic = this.topics.get(topicId);
    const raw = await this.redis.hGetAll(`vote:counts:${topicId}`);
    const counts = {};
    for (const opt of topic.options) counts[opt] = parseInt(raw[opt] || '0', 10);
    return counts;
  }
  async getPreviousVote(topicId, voterId) {
    return await this.redis.hGet(`vote:voters:${topicId}`, voterId);
  }
  async recordVote(topicId, voterId, option, previous) {
    const multi = this.redis.multi();
    if (previous && previous !== option) multi.hIncrBy(`vote:counts:${topicId}`, previous, -1);
    multi.hIncrBy(`vote:counts:${topicId}`, option, 1);
    multi.hSet(`vote:voters:${topicId}`, voterId, option);
    await multi.exec();
    return await this.getCounts(topicId);
  }
}

MemoryStore.prototype.resetTopic = async function resetTopic(topicId) {
  const counts = this.tallies.get(topicId);
  if (counts) {
    for (const key of Object.keys(counts)) counts[key] = 0;
  }
  const voters = this.voters.get(topicId);
  if (voters) voters.clear();
  return this.getCounts(topicId);
};

RedisStore.prototype.resetTopic = async function resetTopic(topicId) {
  await this.redis.del(`vote:counts:${topicId}`, `vote:voters:${topicId}`);
  return this.getCounts(topicId);
};

async function createStore(topics) {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('[voting] using in-memory store (set REDIS_URL for persistence)');
    return new MemoryStore(topics);
  }
  try {
    const { createClient } = require('redis');
    const client = createClient({ url });
    client.on('error', err => console.error('[voting][redis]', err.message));
    await client.connect();
    console.log('[voting] using Redis store');
    return new RedisStore(client, topics);
  } catch (err) {
    console.warn('[voting] Redis init failed, falling back to in-memory:', err.message);
    return new MemoryStore(topics);
  }
}

module.exports = { createStore };
