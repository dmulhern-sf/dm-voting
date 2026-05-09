// Decktools Usage Tracker · Cloudflare Worker v1.2
// ─────────────────────────────────────────────────────────────────
// Events (POST /track):
//   deck_new        – { customer, industry, deck_type, audience_type, products[], accent, story_arc, user, repo, ts }
//   install         – { user, version, ts }
//   deck_open       – { deck, user, ts }
//   review_end      – { deck, user, comments, slides_with_comments, ts }
//   page_visit      – { ref, ts }           ref = 'canvas' | 'direct'
//   lead_capture    – { name, email, role, ref, ts }
//   interview_start – { user, ts }
//   deck_shared     – { deck, user, ts }
//
// GET /dashboard?token=TOKEN  → HTML impact report
// GET /data?token=TOKEN        → raw JSON export
// ─────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /feedback ───────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/feedback') {
      try {
        const body = await request.json();
        const { repo, deck, content, sha } = body;
        const ghBody = { message: `feedback: ${deck}`, content };
        if (sha) ghBody.sha = sha;
        const ghRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/feedback.md`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
              'Content-Type': 'application/json',
              'User-Agent': 'decktools-tracker',
            },
            body: JSON.stringify(ghBody),
          }
        );
        if (!ghRes.ok) {
          const errText = await ghRes.text();
          return new Response(JSON.stringify({ ok: false, error: errText }), {
            status: ghRes.status, headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }
        const ghData = await ghRes.json();
        return new Response(JSON.stringify({ ok: true, sha: ghData.content?.sha }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── POST /track ──────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/track') {
      try {
        const event = await request.json();

        const ALLOWED_EVENTS = ['deck_new', 'install', 'deck_open', 'review_end', 'page_visit', 'lead_capture', 'interview_start', 'deck_shared'];
        if (!ALLOWED_EVENTS.includes(event.event)) {
          return new Response(JSON.stringify({ ok: false, error: 'unknown event' }), {
            status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }

        event.ts = event.ts || new Date().toISOString();
        const day = event.ts.slice(0, 10);

        await incr(env, 'total:' + event.event);
        await incr(env, 'daily:' + day + ':' + event.event);

        if (event.user) await addToSet(env, 'users', event.user);

        await appendLog(env, 'event_log', event, 500);

        // ── install ──────────────────────────────────────────────
        if (event.event === 'install') {
          await appendLog(env, 'installers', {
            user:    event.user    || '—',
            version: event.version || '—',
            ts:      event.ts,
          }, 200);
        }

        // ── page_visit ───────────────────────────────────────────
        if (event.event === 'page_visit') {
          const ref = (event.ref || 'direct').toLowerCase().replace(/\s+/g, '_');
          await incr(env, 'source:' + ref);
        }

        // ── lead_capture ─────────────────────────────────────────
        if (event.event === 'lead_capture') {
          await appendLog(env, 'leads', {
            name:  event.name  || '—',
            email: event.email || '—',
            role:  event.role  || '—',
            ref:   event.ref   || 'direct',
            ts:    event.ts,
          }, 500);
        }

        // ── deck_new ─────────────────────────────────────────────
        if (event.event === 'deck_new') {
          const deck = {
            customer:      event.customer      || '—',
            industry:      event.industry      || '—',
            deck_type:     event.deck_type     || '—',
            audience_type: event.audience_type || '—',
            products:      event.products      || [],
            accent:        /^#[0-9a-fA-F]{3,8}$|^rgb/.test(event.accent || '') ? event.accent : '',
            story_arc:     event.story_arc     || '',
            repo:          event.repo          || '',
            user:          event.user          || '—',
            ts:            event.ts,
            opens: 0, reviews: 0, shares: 0,
          };
          await appendLog(env, 'decks', deck, 200);

          if (Array.isArray(event.products)) {
            for (const p of event.products) {
              await incr(env, 'product:' + p.toLowerCase().replace(/\s+/g, '_'));
            }
          }
          if (event.industry) {
            await incr(env, 'industry:' + event.industry.toLowerCase().replace(/\s+/g, '_'));
          }
          if (event.deck_type) {
            await incr(env, 'deck_type:' + event.deck_type.toLowerCase().replace(/[\s/-]+/g, '_'));
          }
          if (event.audience_type) {
            await incr(env, 'audience:' + event.audience_type.toLowerCase().replace(/\s+/g, '_'));
          }
        }

        // ── review_end ───────────────────────────────────────────
        if (event.event === 'review_end' && event.deck) {
          await incr(env, 'reviews_comments_total');
          await incrementDeckStat(env, event.deck, 'reviews');
        }

        // ── deck_open ────────────────────────────────────────────
        if (event.event === 'deck_open' && event.deck) {
          await incrementDeckStat(env, event.deck, 'opens');
        }

        // ── deck_shared ──────────────────────────────────────────
        if (event.event === 'deck_shared' && event.deck) {
          await incrementDeckStat(env, event.deck, 'shares');
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── GET /data ────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/data') {
      if (!auth(url, env)) return new Response('Unauthorized', { status: 401 });
      const data = await loadDashboardData(env);
      return new Response(JSON.stringify(data, null, 2), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── GET /dashboard ───────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/dashboard') {
      if (!auth(url, env)) return new Response('Unauthorized', { status: 401 });
      const data = await loadDashboardData(env);
      return new Response(buildDashboard(data), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

// ── KV helpers ────────────────────────────────────────────────────

function auth(url, env) {
  const token = url.searchParams.get('token');
  return env.DASHBOARD_TOKEN && token === env.DASHBOARD_TOKEN;
}

async function incr(env, key) {
  const n = parseInt(await env.DT_KV.get(key) || '0');
  await env.DT_KV.put(key, String(n + 1));
  return n + 1;
}

async function addToSet(env, key, value) {
  const raw = await env.DT_KV.get(key) || '[]';
  const set = JSON.parse(raw);
  if (!set.includes(value)) {
    set.push(value);
    await env.DT_KV.put(key, JSON.stringify(set));
  }
}

async function appendLog(env, key, item, cap) {
  const raw = await env.DT_KV.get(key) || '[]';
  const log = JSON.parse(raw);
  log.unshift(item);
  if (log.length > cap) log.length = cap;
  await env.DT_KV.put(key, JSON.stringify(log));
}

async function incrementDeckStat(env, deckName, stat) {
  // KV read-modify-write is not atomic — acceptable at current traffic levels
  const raw = await env.DT_KV.get('decks') || '[]';
  const decks = JSON.parse(raw);
  const slug = deckName.replace('.html', '');
  const match = decks.find(d => d.repo && slug && (d.repo === slug || d.repo.endsWith('/' + slug)));
  if (match) {
    match[stat] = (match[stat] || 0) + 1;
    await env.DT_KV.put('decks', JSON.stringify(decks));
  }
}

async function loadDashboardData(env) {
  const keys = [
    'total:install', 'total:deck_new', 'total:deck_open', 'total:review_end',
    'total:interview_start', 'total:deck_shared', 'total:page_visit', 'total:lead_capture',
    'reviews_comments_total',
    'users', 'decks', 'installers', 'leads', 'event_log',
    'product:agentforce', 'product:data_cloud', 'product:marketing_cloud',
    'product:sales_cloud', 'product:mulesoft', 'product:slack', 'product:platform',
    'deck_type:tell_show_tell', 'deck_type:pov', 'deck_type:proposal_business_case',
    'source:canvas', 'source:direct',
    'audience:customer_meeting', 'audience:internal_review',
  ];
  const results = await Promise.all(keys.map(k => env.DT_KV.get(k)));
  const [
    installs, deckNews, opens, reviews,
    interviewStarts, deckShares, pageVisits, leadCaptures,
    totalComments,
    usersRaw, decksRaw, installersRaw, leadsRaw, logRaw,
    pAgentforce, pDataCloud, pMarketing, pSales, pMulesoft, pSlack, pPlatform,
    dtTst, dtPov, dtProposal,
    srcCanvas, srcDirect,
    audCustomer, audInternal,
  ] = results;

  const deckNewsInt       = parseInt(deckNews        || '0');
  const interviewStartInt = parseInt(interviewStarts || '0');

  return {
    installs:        parseInt(installs     || '0'),
    deckNews:        deckNewsInt,
    opens:           parseInt(opens        || '0'),
    reviews:         parseInt(reviews      || '0'),
    interviewStarts: interviewStartInt,
    deckShares:      parseInt(deckShares   || '0'),
    pageVisits:      parseInt(pageVisits   || '0'),
    leadCaptures:    parseInt(leadCaptures || '0'),
    totalComments:   parseInt(totalComments|| '0'),
    completionRate:  interviewStartInt > 0 ? Math.round((deckNewsInt / interviewStartInt) * 100) : null,
    users:      JSON.parse(usersRaw      || '[]'),
    decks:      JSON.parse(decksRaw      || '[]'),
    installers: JSON.parse(installersRaw || '[]'),
    leads:      JSON.parse(leadsRaw      || '[]'),
    log:        JSON.parse(logRaw        || '[]').slice(0, 30),
    products: {
      'Agentforce':      parseInt(pAgentforce || '0'),
      'Data Cloud':      parseInt(pDataCloud  || '0'),
      'Marketing Cloud': parseInt(pMarketing  || '0'),
      'Sales Cloud':     parseInt(pSales      || '0'),
      'MuleSoft':        parseInt(pMulesoft   || '0'),
      'Slack':           parseInt(pSlack      || '0'),
      'Platform':        parseInt(pPlatform   || '0'),
    },
    deckTypes: {
      'Tell-Show-Tell': parseInt(dtTst      || '0'),
      'POV':            parseInt(dtPov      || '0'),
      'Proposal':       parseInt(dtProposal || '0'),
    },
    sources: {
      'Canvas': parseInt(srcCanvas || '0'),
      'Direct': parseInt(srcDirect || '0'),
    },
    audience: {
      'Customer meeting': parseInt(audCustomer || '0'),
      'Internal review':  parseInt(audInternal || '0'),
    },
  };
}

// ── Dashboard HTML ────────────────────────────────────────────────

function buildDashboard(d) {
  const generated = new Date().toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Leads table ──────────────────────────────────────────────────
  const leadsHtml = d.leads.map(l => `<tr>
    <td><strong>${escHtml(l.name)}</strong></td>
    <td><a href="mailto:${escAttr(l.email)}" style="color:#022AC0;text-decoration:none">${escHtml(l.email)}</a></td>
    <td>${escHtml(l.role)}</td>
    <td><span class="badge badge-${l.ref === 'canvas' ? 'install' : 'deck_open'}">${escHtml(l.ref)}</span></td>
    <td style="white-space:nowrap;color:#6B7280;font-size:11px">${new Date(l.ts).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
  </tr>`).join('');

  // ── Installers table ─────────────────────────────────────────────
  const installersHtml = d.installers.map(i => `<tr>
    <td>${escHtml(i.user)}</td>
    <td><code style="font-size:11px">${escHtml(i.version)}</code></td>
    <td style="white-space:nowrap;color:#6B7280;font-size:11px">${new Date(i.ts).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
  </tr>`).join('');

  // ── Decks table ──────────────────────────────────────────────────
  const decksHtml = d.decks.slice(0, 50).map(dk => {
    const products = Array.isArray(dk.products) && dk.products.length
      ? dk.products.map(p => `<span class="tag">${escHtml(p)}</span>`).join(' ')
      : '<span style="color:#9CA3AF">—</span>';
    const accentDot = dk.accent
      ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${escAttr(dk.accent)};margin-right:5px;vertical-align:middle;border:1px solid rgba(0,0,0,0.1)"></span>`
      : '';
    const repoLink = dk.repo
      ? `<a href="https://github.com/${escHtml(dk.repo)}" target="_blank" rel="noopener" style="color:#022AC0;font-size:11px">${escHtml(dk.repo)}</a>`
      : '—';
    return `<tr>
      <td><strong>${escHtml(dk.customer)}</strong>${dk.story_arc ? `<div style="font-size:11px;color:#6B7280;margin-top:2px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escAttr(dk.story_arc)}">${escHtml(dk.story_arc)}</div>` : ''}</td>
      <td>${escHtml(dk.industry)}</td>
      <td><span class="badge badge-type">${escHtml(dk.deck_type)}</span></td>
      <td><span style="font-size:11px;color:#6B7280">${escHtml(dk.audience_type || '—')}</span></td>
      <td>${products}</td>
      <td>${accentDot}${dk.accent ? `<code style="font-size:11px">${escHtml(dk.accent)}</code>` : '—'}</td>
      <td>${repoLink}</td>
      <td>${escHtml(dk.user)}</td>
      <td style="text-align:center">${dk.opens || 0}</td>
      <td style="text-align:center">${dk.shares || 0}</td>
      <td style="text-align:center">${dk.reviews || 0}</td>
      <td style="white-space:nowrap">${new Date(dk.ts).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}</td>
    </tr>`;
  }).join('');

  // ── Recent activity ──────────────────────────────────────────────
  const logHtml = d.log.map(e => `<tr>
    <td style="white-space:nowrap;color:#6B7280;font-size:11px">${new Date(e.ts).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
    <td><span class="badge badge-${escAttr(e.event)}">${escHtml(e.event)}</span></td>
    <td>${escHtml(e.user || '—')}</td>
    <td style="font-size:12px;color:#374151">${escHtml(e.customer || e.deck || e.name || '')}</td>
    <td style="font-size:12px;color:#6B7280">${escHtml(e.industry || e.role || (e.comments != null ? e.comments + ' comments' : ''))}</td>
  </tr>`).join('');

  // ── Bar chart helper ─────────────────────────────────────────────
  function barChart(entries, colorMap) {
    const max = Math.max(...entries.map(([,v]) => v), 1);
    return entries.sort((a,b) => b[1]-a[1]).map(([name, count]) => {
      const pct = Math.round((count / max) * 100);
      const color = (colorMap && colorMap[name]) || '#022AC0';
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:140px;font-size:12px;font-weight:600;color:#374151;flex-shrink:0">${escHtml(name)}</div>
        <div style="flex:1;background:#F3F4F6;border-radius:4px;height:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s"></div>
        </div>
        <div style="width:24px;font-size:12px;font-weight:700;color:${color};text-align:right">${count}</div>
      </div>`;
    }).join('');
  }

  const productBars  = barChart(Object.entries(d.products), {});
  const typeBars     = barChart(Object.entries(d.deckTypes).filter(([,v])=>v>0), {'Tell-Show-Tell':'#022AC0','POV':'#06A59A','Proposal':'#730394'});
  const sourceBars   = barChart(Object.entries(d.sources), {'Canvas':'#022AC0','Direct':'#6B7280'});
  const audienceBars = barChart(Object.entries(d.audience), {'Customer meeting':'#022AC0','Internal review':'#06A59A'});

  const userChips = d.users.map(u =>
    `<span class="user-chip">${escHtml(u)}</span>`
  ).join('') || '<span style="color:#9CA3AF;font-size:13px">None yet</span>';

  const completionRateVal = d.completionRate !== null ? d.completionRate + '%' : '—';
  const completionColor   = d.completionRate === null ? '#9CA3AF'
    : d.completionRate >= 70 ? '#166534'
    : d.completionRate >= 40 ? '#92400E'
    : '#991B1B';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Decktools · Impact Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F0F4F8;color:#1a2332;min-height:100vh}
  .hero{background:linear-gradient(135deg,#001E5B 0%,#022AC0 60%,#066AFE 100%);color:#fff;padding:36px 48px 32px;position:relative;overflow:hidden}
  .hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#022AC0,#00B3FF,#04E1CB)}
  .hero h1{font-size:26px;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px}
  .hero-meta{font-size:13px;color:rgba(255,255,255,0.55);display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .hero-meta a{color:#00B3FF;text-decoration:none;font-weight:600}
  .hero-meta a:hover{text-decoration:underline}
  .section{padding:28px 48px 0}
  .section-title{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B7280;margin-bottom:14px}
  .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:24px 48px 0}
  .kpis-2{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:14px 48px 0}
  .kpi{background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #E5E7EB}
  .kpi-val{font-size:30px;font-weight:700;color:#022AC0;letter-spacing:-0.03em;line-height:1}
  .kpi-label{font-size:11px;color:#6B7280;margin-top:5px;font-weight:500}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px 48px 0}
  .grid-full{padding:20px 48px 0}
  .card{background:#fff;border-radius:12px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #E5E7EB}
  .card-title{font-size:12px;font-weight:700;color:#001E5B;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;padding:5px 8px;text-align:left;border-bottom:1px solid #E5E7EB;white-space:nowrap}
  td{padding:9px 8px;border-bottom:1px solid #F9FAFB;color:#374151;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#F9FAFB}
  .badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:2px 7px;border-radius:999px;white-space:nowrap}
  .badge-install{background:#EFF6FF;color:#022AC0}
  .badge-deck_new{background:#F0FDF4;color:#166534}
  .badge-deck_open{background:#FFF7ED;color:#9A3412}
  .badge-review_end{background:#FDF4FF;color:#6B21A8}
  .badge-page_visit{background:#F0F9FF;color:#0369A1}
  .badge-lead_capture{background:#FFF1F2;color:#9F1239}
  .badge-interview_start{background:#FEFCE8;color:#854D0E}
  .badge-deck_shared{background:#F0FDF4;color:#065F46}
  .badge-type{background:#F0F4FF;color:#022AC0}
  .tag{display:inline-block;background:#EFF6FF;color:#022AC0;font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;margin:1px}
  .users{display:flex;flex-wrap:wrap;gap:6px}
  .user-chip{background:#EFF6FF;color:#022AC0;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px}
  .footer{text-align:center;padding:32px 48px;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;margin-top:28px}
  .footer a{color:#022AC0;text-decoration:none;font-weight:600}
  .empty{color:#9CA3AF;text-align:center;padding:20px;font-size:13px}
  @media(max-width:1000px){.kpis{grid-template-columns:repeat(3,1fr)}.kpis-2{grid-template-columns:repeat(2,1fr)}.grid-2{grid-template-columns:1fr}}
  @media(max-width:640px){.kpis,.kpis-2{grid-template-columns:repeat(2,1fr)}.section,.kpis,.kpis-2,.grid-2,.grid-full{padding-left:20px;padding-right:20px}.hero{padding:24px 20px}}
</style>
</head>
<body>

<div class="hero">
  <h1>Decktools · Impact Dashboard</h1>
  <div class="hero-meta">
    <span>Built by <a href="https://www.linkedin.com/in/milestoolin/" target="_blank" rel="noopener">Miles Toolin</a></span>
    <span>·</span>
    <span>Last updated: ${generated}</span>
    <span>·</span>
    <span>${d.users.length} user${d.users.length !== 1 ? 's' : ''} across the org</span>
  </div>
</div>

<!-- KPI row 1 -->
<div class="kpis">
  <div class="kpi"><div class="kpi-val">${d.users.length}</div><div class="kpi-label">Unique users</div></div>
  <div class="kpi"><div class="kpi-val">${d.installs}</div><div class="kpi-label">Skill installs</div></div>
  <div class="kpi"><div class="kpi-val">${d.deckNews}</div><div class="kpi-label">Decks created</div></div>
  <div class="kpi"><div class="kpi-val">${d.opens}</div><div class="kpi-label">Deck opens</div></div>
  <div class="kpi"><div class="kpi-val">${d.reviews}</div><div class="kpi-label">Reviews completed</div></div>
</div>

<!-- KPI row 2 -->
<div class="kpis-2">
  <div class="kpi"><div class="kpi-val">${d.pageVisits}</div><div class="kpi-label">Install guide visits</div></div>
  <div class="kpi"><div class="kpi-val">${d.leadCaptures}</div><div class="kpi-label">Visit captures</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${completionColor}">${completionRateVal}</div><div class="kpi-label">Interview → deck rate${d.completionRate === null ? ' (no data)' : ''}</div></div>
  <div class="kpi"><div class="kpi-val">${d.deckShares}</div><div class="kpi-label">Decks shared</div></div>
</div>

<!-- Products + deck types -->
<div class="grid-2" style="margin-top:6px">
  <div class="card">
    <div class="card-title">Products featured in decks</div>
    ${productBars || '<div class="empty">No decks yet</div>'}
  </div>
  <div class="card">
    <div class="card-title">Deck types</div>
    ${typeBars || '<div class="empty">No decks yet</div>'}
  </div>
</div>

<!-- Sources + audience -->
<div class="grid-2">
  <div class="card">
    <div class="card-title">Install guide — traffic source</div>
    ${sourceBars || '<div class="empty">No visits yet</div>'}
  </div>
  <div class="card">
    <div class="card-title">Deck audience type</div>
    ${audienceBars || '<div class="empty">No decks yet</div>'}
  </div>
</div>

<!-- Leads -->
<div class="grid-full">
  <div class="card">
    <div class="card-title">Visit captures (${d.leads.length})</div>
    <div style="overflow-x:auto">
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Source</th><th>Date</th></tr></thead>
      <tbody>${leadsHtml || '<tr><td colspan="5" class="empty">No leads yet</td></tr>'}</tbody>
    </table>
    </div>
  </div>
</div>

<!-- Installers -->
<div class="grid-full">
  <div class="card">
    <div class="card-title">Skill installs (${d.installers.length})</div>
    <table>
      <thead><tr><th>User</th><th>Version</th><th>Date</th></tr></thead>
      <tbody>${installersHtml || '<tr><td colspan="3" class="empty">No installs recorded yet</td></tr>'}</tbody>
    </table>
  </div>
</div>

<!-- Decks -->
<div class="grid-full">
  <div class="card">
    <div class="card-title">All decks created (${d.decks.length})</div>
    <div style="overflow-x:auto">
    <table>
      <thead><tr>
        <th>Customer &amp; story arc</th>
        <th>Industry</th>
        <th>Type</th>
        <th>Audience</th>
        <th>Products</th>
        <th>Brand</th>
        <th>Repo</th>
        <th>Created by</th>
        <th style="text-align:center">Opens</th>
        <th style="text-align:center">Shares</th>
        <th style="text-align:center">Reviews</th>
        <th>Date</th>
      </tr></thead>
      <tbody>${decksHtml || '<tr><td colspan="12" class="empty">No decks created yet</td></tr>'}</tbody>
    </table>
    </div>
  </div>
</div>

<!-- Activity + users -->
<div class="grid-2">
  <div class="card">
    <div class="card-title">Recent activity (last 30)</div>
    <table>
      <thead><tr><th>When</th><th>Event</th><th>User</th><th>Detail</th><th>Context</th></tr></thead>
      <tbody>${logHtml || '<tr><td colspan="5" class="empty">No activity yet</td></tr>'}</tbody>
    </table>
  </div>
  <div class="card">
    <div class="card-title">All users (${d.users.length})</div>
    <div class="users">${userChips}</div>
  </div>
</div>

<div class="footer">
  Designed by Decktools · Built by <a href="https://www.linkedin.com/in/milestoolin/" target="_blank" rel="noopener">Miles Toolin</a> with Claude Code
</div>

</body>
</html>`;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
