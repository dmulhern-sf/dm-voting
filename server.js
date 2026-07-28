const crypto = require('crypto');
const express = require('express');
const path = require('path');

const app = express();
// 8100 so this can run alongside the main walkthrough on 8000.
const PORT = process.env.PORT || 8100;

// The walkthrough names a real client and real FCTG systems, so any public
// deployment gets a password. Only enforced when DEMO_PASSWORD is set, which
// keeps local runs frictionless.
const USER = process.env.DEMO_USER || 'ct';
const PASSWORD = process.env.DEMO_PASSWORD;

// Length-independent compare, so a wrong password can't be narrowed by timing.
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

if (PASSWORD) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
      if (safeEqual(user, USER) && safeEqual(rest.join(':'), PASSWORD)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Corporate Traveller · P4 deep dive", charset="UTF-8"');
    res.status(401).send('Authentication required.');
  });
}

app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Corporate Traveller · P4 adoption deep dive on http://localhost:${PORT}`);
  console.log(PASSWORD ? `  password protected (user: ${USER})` : '  open — set DEMO_PASSWORD to require a login');
});
