/* ─────────────────────────────────────────────────────────────────
   Decktools · Shared Access Gate v4
   ─────────────────────────────────────────────────────────────────
   HOW TO USE:
     Add to <body> in each gated deck:
     <script src="gate.js" data-page="Page Name Here"></script>

   OPTIONAL ATTRIBUTES on the script tag:
     data-page="Page Name"      — shown in tracking + email alerts
     data-password="yourpass"   — defaults to reading body[data-password]
     data-worker-url="https://" — Cloudflare Worker for visit logging
     data-web3-key="..."        — web3forms key for email alerts (optional)
   ───────────────────────────────────────────────────────────────── */
(function () {

  /* ── CONFIG ─────────────────────────────────────────────────── */
  var tag = document.querySelector('script[src*="gate.js"]');
  var bodyPwd = document.body && document.body.dataset && document.body.dataset.password;
  var C = {
    password:   (tag && tag.dataset.password)   || bodyPwd || '',
    workerUrl:  (tag && tag.dataset.workerUrl)  || '',
    web3Key:    (tag && tag.dataset.web3Key)    || '',
    storeKey:   'dt_gate_visitor_v1',
    authKey:    'dt_gate_auth_v1'
  };

  if (!C.password) return; // No password configured — gate disabled

  /* ── INJECT GATE HTML ────────────────────────────────────────── */
  var gate = document.createElement('div');
  gate.id = 'dt-gate';
  gate.style.cssText = [
    'display:none;position:fixed;inset:0;z-index:99999;',
    'background:rgba(0,30,91,0.97);backdrop-filter:blur(12px);',
    'align-items:center;justify-content:center;',
    "font-family:'Salesforce Sans',-apple-system,BlinkMacSystemFont,sans-serif;"
  ].join('');

  gate.innerHTML = [
    '<div style="background:#001E5B;border:1px solid rgba(255,255,255,0.08);',
      'border-radius:16px;padding:48px 40px;width:100%;max-width:400px;',
      'text-align:center;box-shadow:0 32px 80px rgba(0,0,0,0.5);margin:0 20px;">',

      '<img src="assets/logos/Salesforce-Corporate-Logo-Horiz-White-RGB.svg" ',
        'width="140" height="28" alt="Salesforce" style="margin-bottom:28px;" />',

      '<h2 style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;',
        'letter-spacing:-0.02em;">Access this deck</h2>',

      '<p style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:28px;',
        'line-height:1.6;">Enter your details and the access password<br/>',
        'provided by your Salesforce account team.</p>',

      '<form id="dt-gate-form" autocomplete="off">',
        '<input id="dt-g-name"     type="text"     placeholder="Full Name"       required ',
          'style="width:100%;padding:11px 14px;border-radius:8px;',
          'border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="dt-g-company"  type="text"     placeholder="Company"         required ',
          'style="width:100%;padding:11px 14px;border-radius:8px;',
          'border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="dt-g-position" type="text"     placeholder="Position / Role"  required ',
          'style="width:100%;padding:11px 14px;border-radius:8px;',
          'border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<input id="dt-g-pass"     type="password" placeholder="Password"         required ',
          'style="width:100%;padding:11px 14px;border-radius:8px;',
          'border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);',
          'color:#fff;font-size:13px;outline:none;font-family:inherit;',
          'box-sizing:border-box;margin-bottom:10px;" />',

        '<div id="dt-g-error" style="font-size:12px;color:#f87171;',
          'margin-bottom:8px;min-height:16px;text-align:left;"></div>',

        '<button type="submit" id="dt-g-btn" style="width:100%;padding:13px;',
          'border-radius:8px;border:none;cursor:pointer;font-family:inherit;',
          'background:linear-gradient(135deg,#022AC0,#066AFE);color:#fff;',
          'font-size:14px;font-weight:700;transition:opacity 0.2s;" ',
          'onmouseover="this.style.opacity=\'0.85\'" ',
          'onmouseout="this.style.opacity=\'1\'">',
          'Continue →</button>',
      '</form>',

      '<p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:20px;line-height:1.5;">',
        'Your details are saved locally so you won\'t need to re-enter<br/>',
        'them on future visits to this deck.</p>',
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
  document.getElementById('dt-gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name     = document.getElementById('dt-g-name').value.trim();
    var company  = document.getElementById('dt-g-company').value.trim();
    var position = document.getElementById('dt-g-position').value.trim();
    var password = document.getElementById('dt-g-pass').value;
    var err      = document.getElementById('dt-g-error');
    var btn      = document.getElementById('dt-g-btn');

    err.textContent = '';

    if (!name || !company || !position) {
      err.textContent = 'Please complete all fields.';
      return;
    }
    if (password !== C.password) {
      err.textContent = 'Incorrect password. Please try again.';
      document.getElementById('dt-g-pass').value = '';
      document.getElementById('dt-g-pass').focus();
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
    return (tag && tag.dataset && tag.dataset.page) || document.title || location.pathname;
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
        postToWorker(data);
        if (!returning) sendEmail(name, company, position, time, ip.ip, loc, page, url, ua);
      })
      .catch(function () {
        var data = { timestamp: time, name: name, company: company, position: position,
                     page: page, url: url, ip: '-', location: '-', ua: ua,
                     returning: returning ? 'yes' : 'no' };
        postToWorker(data);
        if (!returning) sendEmail(name, company, position, time, '-', '-', page, url, ua);
      });
  }

  function postToWorker(data) {
    if (!C.workerUrl) return;
    fetch(C.workerUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    }).catch(function () {});
  }

  function sendEmail(name, company, position, time, ip, loc, page, url, ua) {
    if (!C.web3Key) return;
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
        from_name:  'Decktools Gate'
      })
    }).catch(function () {});
  }

})();
