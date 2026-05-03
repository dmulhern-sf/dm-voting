/* ─────────────────────────────────────────────────────────────────
   NBA Narrative · Shared Access Gate v3
   ─────────────────────────────────────────────────────────────────
   HOW TO USE:
     Add before </body> in each page:
     <script src="gate.js" data-page="Page Name Here"></script>

   TRACKING SETUP:
     See cloudflare-worker.js for full instructions.
     Once deployed, paste your Worker URL below as workerUrl.
   ───────────────────────────────────────────────────────────────── */
(function () {

  /* ── CONFIG ─────────────────────────────────────────────────── */
  var _scriptTag = document.querySelector('script[src*="gate.js"]');
  var C = {
    password:   (_scriptTag && _scriptTag.dataset.password) ? _scriptTag.dataset.password : 'SFNBA2026!',
    workerUrl:  'https://summer-mountain-4569.sdunlop.workers.dev',
    web3Key:    'ec698e10-6e6a-4c3a-974e-54a7cd7d4343',
    storeKey:   'nba_visitor_v2',
    authKey:    'nba_auth_v2'
  };

  /* ── INJECT GATE HTML ────────────────────────────────────────── */
  var gate = document.createElement('div');
  gate.id = 'nba-gate';
  gate.style.cssText = [
    'display:none;position:fixed;inset:0;z-index:99999;',
    'background:rgba(3,12,32,0.97);backdrop-filter:blur(12px);',
    'align-items:center;justify-content:center;',
    'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;'
  ].join('');

  gate.innerHTML = [
    '<div style="background:#0D1B2E;border:1px solid rgba(255,255,255,0.08);',
      'border-radius:20px;padding:48px 40px;width:100%;max-width:400px;',
      'text-align:center;box-shadow:0 32px 80px rgba(0,0,0,0.5);margin:0 20px;">',

      '<div style="width:48px;height:48px;border-radius:50%;',
        'background:rgba(1,118,211,0.15);border:1px solid rgba(1,118,211,0.35);',
        'display:flex;align-items:center;justify-content:center;',
        'margin:0 auto 20px;font-size:20px;">🔒</div>',

      '<div style="font-size:10px;font-weight:700;letter-spacing:0.14em;',
        'text-transform:uppercase;color:#0D9DDA;margin-bottom:10px;">',
        'Salesforce · NBA Narrative</div>',

      '<h2 style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;',
        'letter-spacing:-0.02em;">Identify yourself to continue</h2>',

      '<p style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:28px;',
        'line-height:1.6;">Enter your details and the access password<br/>',
        'provided by your Salesforce account team.</p>',

      '<form id="nba-gate-form" autocomplete="off">',
        '<input id="nba-g-name"     type="text"     placeholder="Full Name"       required ',
          'style="width:100%;padding:11px 14px;border-radius:10px;',
          'border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="nba-g-company"  type="text"     placeholder="Company"         required ',
          'style="width:100%;padding:11px 14px;border-radius:10px;',
          'border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="nba-g-position" type="text"     placeholder="Position / Role"  required ',
          'style="width:100%;padding:11px 14px;border-radius:10px;',
          'border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="nba-g-pass"     type="password" placeholder="Password"         required ',
          'style="width:100%;padding:11px 14px;border-radius:10px;',
          'border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<div id="nba-g-error" style="font-size:12px;color:#f87171;',
          'margin-bottom:8px;min-height:16px;text-align:left;"></div>',

        '<button type="submit" id="nba-g-btn" style="width:100%;padding:13px;',
          'border-radius:10px;border:none;cursor:pointer;font-family:inherit;',
          'background:linear-gradient(135deg,#0176D3,#0060a8);color:#fff;',
          'font-size:14px;font-weight:700;transition:opacity 0.2s;" ',
          'onmouseover="this.style.opacity=\'0.85\'" ',
          'onmouseout="this.style.opacity=\'1\'">',
          'Continue →</button>',
      '</form>',

      '<p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:20px;line-height:1.5;">',
        'Your details are saved locally so you won\'t need to re-enter<br/>',
        'them on future visits to any page in this series.</p>',
    '</div>'
  ].join('');

  document.body.insertAdjacentElement('afterbegin', gate);

  /* ── CHECK RETURNING VISITOR ────────────────────────────────── */
  var visitor = loadVisitor();
  if (visitor) {
    trackAccess(visitor.name, visitor.company, visitor.position, true);
    return;
  }

  /* ── SHOW GATE ───────────────────────────────────────────────── */
  gate.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  /* ── FORM SUBMIT ─────────────────────────────────────────────── */
  document.getElementById('nba-gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name     = document.getElementById('nba-g-name').value.trim();
    var company  = document.getElementById('nba-g-company').value.trim();
    var position = document.getElementById('nba-g-position').value.trim();
    var password = document.getElementById('nba-g-pass').value;
    var err      = document.getElementById('nba-g-error');
    var btn      = document.getElementById('nba-g-btn');

    err.textContent = '';

    if (!name || !company || !position) {
      err.textContent = 'Please complete all fields.';
      return;
    }
    if (password !== C.password) {
      err.textContent = 'Incorrect password. Please try again.';
      document.getElementById('nba-g-pass').value = '';
      document.getElementById('nba-g-pass').focus();
      return;
    }

    btn.textContent = 'Unlocking…';
    btn.disabled = true;

    localStorage.setItem(C.authKey,  '1');
    localStorage.setItem(C.storeKey, JSON.stringify({ name: name, company: company, position: position }));

    gate.style.display = 'none';
    document.body.style.overflow = '';
    trackAccess(name, company, position, false);
  });

  /* ── HELPERS ─────────────────────────────────────────────────── */

  function loadVisitor() {
    if (localStorage.getItem(C.authKey) !== '1') return null;
    try { return JSON.parse(localStorage.getItem(C.storeKey)); } catch (x) { return null; }
  }

  function pageName() {
    var s = document.querySelector('script[src*="gate.js"]');
    return (s && s.dataset && s.dataset.page) ? s.dataset.page : (document.title || location.pathname);
  }

  function trackAccess(name, company, position, returning) {
    var time = new Date().toUTCString();
    var page = pageName();
    var url  = location.href;
    var ua   = navigator.userAgent;

    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (ip) {
        var loc = [ip.city, ip.region, ip.country_name].filter(Boolean).join(', ');
        var data = { timestamp: time, name: name, company: company, position: position,
                     page: page, url: url, ip: ip.ip, location: loc, ua: ua,
                     returning: returning ? 'yes' : 'no' };
        appendToGitHub(data);
        if (!returning) sendEmail(name, company, position, time, ip.ip, loc, page, url, ua);
      })
      .catch(function () {
        var data = { timestamp: time, name: name, company: company, position: position,
                     page: page, url: url, ip: '-', location: '-', ua: ua,
                     returning: returning ? 'yes' : 'no' };
        appendToGitHub(data);
        if (!returning) sendEmail(name, company, position, time, '-', '-', page, url, ua);
      });
  }

  function appendToGitHub(data) {
    if (!C.workerUrl || C.workerUrl.indexOf('REPLACE') !== -1) return;
    fetch(C.workerUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    }).catch(function () { /* fail silently — email alert already sent */ });
  }

  function sendEmail(name, company, position, time, ip, loc, page, url, ua) {
    fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: C.web3Key,
        subject:    page + ' opened — ' + name + ' · ' + company + (loc !== '-' ? ' · ' + loc : ''),
        message:    'Name:     ' + name     + '\n' +
                    'Company:  ' + company  + '\n' +
                    'Position: ' + position + '\n' +
                    'Time:     ' + time     + '\n' +
                    'IP:       ' + ip       + '\n' +
                    'Location: ' + loc      + '\n' +
                    'Page:     ' + url      + '\n' +
                    'Device:   ' + ua,
        from_name:  'NBA Narrative Alert'
      })
    });
  }

})();
