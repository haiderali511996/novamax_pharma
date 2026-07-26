const fs = require('fs');
const path = require('path');
const { app, request, registerUser } = require('./helpers/factory');

const uploadedFiles = [];

// Files are physically stored in backend/uploads/ regardless of the URL
// prefix they're served under (see app.js) - resolve cleanup paths from the
// filename, not by naively joining the URL.
function trackForCleanup(url) {
  uploadedFiles.push(path.join(__dirname, '..', 'uploads', path.basename(url)));
}

afterEach(() => {
  while (uploadedFiles.length) {
    const file = uploadedFiles.pop();
    fs.rm(file, { force: true }, () => {});
  }
});

describe('File uploads', () => {
  test('uploads a valid PDF and serves it back statically', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake content'), { filename: 'license.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/^\/api\/uploads\/.+\.pdf$/);
    trackForCleanup(res.body.data.url);

    // application/pdf isn't one of superagent's auto-parsed text types, so
    // force buffering to read the raw bytes back for the assertion.
    const fetched = await request(app).get(res.body.data.url).buffer(true).parse((response, cb) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body.toString()).toContain('fake content');
  });

  test('rejects a disallowed file extension', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('binary junk'), { filename: 'malware.exe', contentType: 'application/octet-stream' });
    expect(res.status).toBe(400);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('content'), { filename: 'x.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(401);
  });

  test('an uploaded document URL can be attached to a License record', async () => {
    const { token } = await registerUser();
    const upload = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4'), { filename: 'license.pdf', contentType: 'application/pdf' });
    trackForCleanup(upload.body.data.url);

    const license = await request(app)
      .post('/api/licenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Drug License', expiryDate: '2027-01-01', documentUrl: upload.body.data.url });
    expect(license.body.data.documentUrl).toBe(upload.body.data.url);
  });
});
