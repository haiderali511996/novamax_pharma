// Entry point for hosts that run Node apps via a plain "node <file>" command
// under their own process manager (e.g. cPanel's "Setup Node.js App", which
// uses Phusion Passenger) rather than `next start` or the Docker standalone
// build. Passenger sets PORT itself; app.prepare() reads the already-built
// .next/ directory (run `next build` first - see package.json's postinstall).
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`NovaMax ERP frontend listening on port ${port}`);
  });
});
