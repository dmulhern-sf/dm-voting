const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'install-guide.html'));
});

app.post('/collaborate', async (req, res) => {
  const { name, email, github, role } = req.body;
  if (!name || !email || !github) {
    return res.status(400).json({ error: 'name, email and github are required' });
  }

  try {
    const response = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, github, role: role || '—' })
    });
    if (!response.ok) throw new Error(`Slack returned ${response.status}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Slack webhook error:', err);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
