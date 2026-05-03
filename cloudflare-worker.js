// NBA Narrative · Tracking Worker
// ─────────────────────────────────────────────────────────────────
// SETUP:
//   1. workers.cloudflare.com → sign up free → Create Worker
//   2. Paste this entire file, click Save & Deploy
//   3. Settings → Variables → Add secret:
//        Name:  GITHUB_TOKEN
//        Value: (your new GitHub fine-grained PAT — Contents read/write on nba-narrative)
//   4. Copy your Worker URL (e.g. https://nba-tracking.YOUR-NAME.workers.dev)
//   5. Paste it into gate.js as workerUrl
// ─────────────────────────────────────────────────────────────────

const GITHUB_REPO = 'sdunlop-sf/nba-narrative';
const GITHUB_FILE = 'tracking.json';
const API_URL     = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + GITHUB_FILE;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    try {
      const data = await request.json();

      const ghHeaders = {
        'Authorization': 'token ' + env.GITHUB_TOKEN,
        'Accept':        'application/vnd.github.v3+json',
        'Content-Type':  'application/json',
        'User-Agent':    'nba-narrative-tracker',
      };

      // Read current tracking.json
      const getRes = await fetch(API_URL, { headers: ghHeaders });
      let rows = [];
      let sha  = null;

      if (getRes.ok) {
        const file = await getRes.json();
        sha = file.sha;
        try {
          const binary = atob(file.content.replace(/\s/g, ''));
          const bytes  = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          rows = JSON.parse(new TextDecoder().decode(bytes));
        } catch (e) { rows = []; }
      }

      rows.push(data);

      const json    = JSON.stringify(rows, null, 2);
      const bytes   = new TextEncoder().encode(json);
      let binary    = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);

      const putBody = {
        message: 'track: ' + (data.name || 'visitor') + ' · ' + (data.page || ''),
        content: btoa(binary),
      };
      if (sha) putBody.sha = sha;

      await fetch(API_URL, {
        method:  'PUT',
        headers: ghHeaders,
        body:    JSON.stringify(putBody),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status:  500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
  },
};
