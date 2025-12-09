// app.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// simple session setup (for demo; in production use secure store)
app.use(session({
  secret: 'replace_with_a_strong_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set secure:true when using HTTPS
}));

// ---------------------------------------------------------------------
// 🌈 Helper: Bootstrap layout wrapper + global CSS
// ---------------------------------------------------------------------
function pageTemplate(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
      /* ===== Blockchain visual styles (diagram-like) ===== */
      .blockchain-wrapper {
        padding: 0.5rem 0 2rem 0;
      }

      .blockchain-scroll {
        display: flex;
        align-items: center;
        overflow-x: auto;
        gap: 4px;
        padding: 0.75rem 0 0.75rem 0;
        scroll-snap-type: x mandatory;
      }

      /* a segment = block + (optional) arrow to next block */
      .block-chain-segment {
        display: flex;
        align-items: center;
        scroll-snap-align: center;
      }

      .block-card {
        min-width: 220px;
        max-width: 235px;
        background: #4a90e2;
        border-radius: 10px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        padding: 6px;
        position: relative;
        flex-shrink: 0;
        color: #000;
      }
      .block-card.genesis-block {
        outline: 3px solid #198754;
      }
      .block-card.current-block {
        box-shadow: 0 0 0 3px #ffc107, 0 4px 10px rgba(0,0,0,0.3);
      }

      .block-inner {
        background: #e9f2ff;
        border-radius: 6px;
        padding: 4px;
        position: relative;
      }

      /* right-side bracket like the reference diagram */
      .block-inner::after {
        content: "";
        position: absolute;
        top: 6px;
        right: -8px;
        bottom: 42px;
        border: 2px solid rgba(0,0,0,0.4);
        border-left: none;
        border-radius: 0 12px 12px 0;
      }

      .bh-title {
        background: #5cb85c;
        color: #fff;
        text-align: center;
        font-weight: 600;
        padding: 3px 4px;
        border-radius: 4px 4px 0 0;
        font-size: 0.75rem;
      }

      .bh-section {
        background: #dff0d8;
        padding: 4px;
        border-radius: 0 0 4px 4px;
        font-size: 0.72rem;
      }

      .bh-row {
        padding: 3px;
        margin-bottom: 3px;
        border-radius: 3px;
      }
      .bh-row-prev   { background: #e0e0e0; }
      .bh-row-time   { background: #d9edf7; }
      .bh-row-nonce  { background: #dff0d8; }
      .bh-row-hash   { background: #f2dede; }

      .bh-label {
        font-weight: 600;
        display: block;
      }
      .bh-value {
        word-break: break-all;
        font-family: "Courier New", monospace;
      }

      .bd-section {
        margin-top: 4px;
        background: #f0ad4e;
        border-radius: 4px;
        padding: 4px;
        font-size: 0.74rem;
      }
      .bd-title {
        font-weight: 600;
        margin-bottom: 3px;
        text-align: center;
      }
      .bd-body {
        background: rgba(255,255,255,0.65);
        border-radius: 3px;
        padding: 3px;
        font-family: "Courier New", monospace;
        font-size: 0.7rem;
        max-height: 90px;
        overflow: auto;
      }

      .block-footer-label {
        margin-top: 3px;
        text-align: center;
        font-size: 0.73rem;
        color: #fff;
        font-weight: 600;
      }

      /* horizontal arrow between blocks (like Transactions & Blocks image) */
      .block-arrow-outer {
        display: flex;
        align-items: center;
        margin: 0 6px;
        flex-shrink: 0;
      }
      .block-arrow-line {
        width: 34px;
        height: 3px;
        background: #333;
      }
      .block-arrow-head {
        width: 0;
        height: 0;
        border-top: 7px solid transparent;
        border-bottom: 7px solid transparent;
        border-left: 11px solid #333;
      }

      @media (max-width: 768px) {
        .block-card {
          min-width: 200px;
          max-width: 210px;
        }
        .bh-title,
        .bh-section,
        .bd-section,
        .block-footer-label {
          font-size: 0.7rem;
        }
        .bd-body {
          font-size: 0.65rem;
        }
        .block-arrow-line {
          width: 24px;
        }
      }

      /* ===== Admin Results / Stats styles ===== */
      .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .results-header-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .results-header-title span.icon {
        font-size: 1.8rem;
      }
      .results-badge {
        font-size: 0.8rem;
      }

      .election-summary-card {
        border-radius: 12px;
        overflow: hidden;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .election-summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(0,0,0,0.15);
      }
      .election-summary-card .card-header {
        background: linear-gradient(90deg, #0d6efd, #6610f2);
        color: #fff;
      }

      .election-detail-card .card-header {
        background: #0d6efd;
        color: #fff;
      }
      .election-meta {
        font-size: 0.85rem;
        color: #e0e0e0;
      }

      /* ===== Dashboard Cards ===== */
      .dashboard-card {
        border-radius: 12px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
      }
      .icon-large {
        font-size: 44px;
      }
    </style>
  </head>
  <body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div class="container-fluid">
        <a class="navbar-brand" href="/">Blockchain Voting</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link" href="/home">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="/ledger">Public Ledger</a></li>
            <li class="nav-item"><a class="nav-link" href="/elections">Elections</a></li>
            <li class="nav-item"><a class="nav-link" href="/admin">Admin</a></li>
            <li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
          </ul>
        </div>
      </div>
    </nav>
    <main class="container">
      ${bodyHtml}
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  </body>
  </html>`;
}

// ---------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.is_admin !== 1) {
    return res.status(403).send('Forbidden: admin only');
  }
  next();
}

// ---------------------------------------------------------------------
// 🧩 Bootstrap & genesis setup
// ---------------------------------------------------------------------
async function bootstrap() {
  const conn = await pool.getConnection();
  try {
    // Create admin if not exists
    const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM users WHERE is_admin = 1');
    if (rows[0].cnt === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.query(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)',
        ['admin', hash]
      );
      console.log('✅ Created default admin: admin / admin123');
    }

    // Create genesis block if empty
    const [chainRows] = await conn.query('SELECT COUNT(*) AS cnt FROM blockchain');
    if (chainRows[0].cnt === 0) {
      const timestamp = new Date();
      const vote_data = JSON.stringify({ genesis: true });
      const previous_hash = '0';
      let nonce = 0;
      let hash = '';
      while (true) {
        const payload = `${timestamp.toISOString()}|${vote_data}|${previous_hash}|${nonce}`;
        hash = crypto.createHash('sha256').update(payload).digest('hex');
        if (hash.startsWith('00')) break;  // simple PoW
        nonce++;
      }
      await conn.query(
        'INSERT INTO blockchain (timestamp, vote_data, previous_hash, hash, nonce) VALUES (?, ?, ?, ?, ?)',
        [timestamp, vote_data, previous_hash, hash, nonce]
      );
      console.log('✅ Genesis block created.');
    }
  } finally {
    conn.release();
  }
}
bootstrap().catch(err => console.error('Bootstrap error:', err));

// ---------------------------------------------------------------------
// Helper: Build results model from blockchain
// returns: [{ id, name, totalVotes, candidates: [{id, name, votes}] }]
// ---------------------------------------------------------------------
async function buildElectionResultsModel() {
  const [blocks] = await pool.query('SELECT vote_data FROM blockchain ORDER BY block_index ASC');

  const tallies = {};              // tallies[election_id][candidate_id] = count
  const electionIdsSet = new Set();
  const candidateIdsSet = new Set();

  for (const b of blocks) {
    try {
      const vote = typeof b.vote_data === 'string' ? JSON.parse(b.vote_data) : b.vote_data;
      if (vote && vote.election_id && vote.candidate_id) {
        const eId = String(vote.election_id);
        const cId = String(vote.candidate_id);

        if (!tallies[eId]) tallies[eId] = {};
        if (!tallies[eId][cId]) tallies[eId][cId] = 0;
        tallies[eId][cId] += 1;

        electionIdsSet.add(eId);
        candidateIdsSet.add(cId);
      }
    } catch (e) {
      // ignore bad JSON
    }
  }

  const electionIds = Array.from(electionIdsSet);
  const candidateIds = Array.from(candidateIdsSet);

  if (!electionIds.length) return [];

  const [elections] = await pool.query(
    'SELECT id, name FROM elections WHERE id IN (?)',
    [electionIds]
  );
  const [candidates] = await pool.query(
    'SELECT id, name, election_id FROM candidates WHERE id IN (?)',
    [candidateIds]
  );

  const electionMap = {};
  elections.forEach(e => { electionMap[String(e.id)] = e; });

  const candidateMap = {};
  candidates.forEach(c => { candidateMap[String(c.id)] = c; });

  const model = electionIds.map(eId => {
    const e = electionMap[eId];
    const electionName = e ? e.name : `Election ${eId}`;
    const candidateTallies = tallies[eId] || {};
    const candidatesArr = Object.entries(candidateTallies).map(([cId, votes]) => {
      const c = candidateMap[cId];
      return {
        id: cId,
        name: c ? c.name : `Candidate ${cId}`,
        votes
      };
    });
    const totalVotes = candidatesArr.reduce((sum, c) => sum + c.votes, 0);
    return {
      id: eId,
      name: electionName,
      totalVotes,
      candidates: candidatesArr
    };
  });

  return model;
}

// ---------------------------------------------------------------------
// 🏠 Landing Page (choose Admin / User)
// ---------------------------------------------------------------------
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.send(pageTemplate('Welcome', `
    <div class="row justify-content-center mt-4">
      <div class="col-md-5">
        <div class="card shadow-sm mb-4 dashboard-card">
          <div class="card-body text-center">
            <div class="icon-large mb-2">🛠️</div>
            <h3 class="card-title mb-3">Admin Portal</h3>
            <p class="text-muted mb-3">
              Login as administrator to create elections, add candidates and view results.
            </p>
            <a href="/admin/login" class="btn btn-outline-primary w-100">Admin Login</a>
          </div>
        </div>
      </div>
      <div class="col-md-5">
        <div class="card shadow-sm mb-4 dashboard-card">
          <div class="card-body text-center">
            <div class="icon-large mb-2">👤</div>
            <h3 class="card-title mb-3">Voter Portal</h3>
            <p class="text-muted mb-3">
              Register as a voter, log in, and cast your vote in active elections.
            </p>
            <div class="d-grid gap-2">
              <a href="/login" class="btn btn-primary">User Login</a>
              <a href="/register" class="btn btn-outline-secondary">New User? Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `));
});

// ---------------------------------------------------------------------
// 🔐 User Authentication (normal voters)
// ---------------------------------------------------------------------
app.get('/register', (req, res) => {
  res.send(pageTemplate('Register', `
    <div class="card mx-auto shadow-sm" style="max-width: 400px;">
      <div class="card-body">
        <h2 class="mb-4 text-center">User Register</h2>
        <form method="post" action="/register">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input name="username" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          <button class="btn btn-primary w-100">Register</button>
        </form>
        <p class="mt-3 text-center">
          Already have an account? <a href="/login">Login</a><br>
          <a href="/">Back to Portal</a>
        </p>
      </div>
    </div>
  `));
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Username and password required');
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)',
      [username, hash]
    );
    res.send(pageTemplate('Registered', `
      <div class="alert alert-success">Registration successful!</div>
      <a href="/login" class="btn btn-primary">Go to User Login</a>
    `));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.send(pageTemplate('Error', `
        <div class="alert alert-danger">Username already exists.</div>
        <a href="/register" class="btn btn-secondary">Try again</a>
      `));
    }
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/login', (req, res) => {
  res.send(pageTemplate('Login', `
    <div class="card mx-auto shadow-sm" style="max-width: 400px;">
      <div class="card-body">
        <h2 class="mb-4 text-center">User Login</h2>
        <form method="post" action="/login">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input name="username" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          <button class="btn btn-primary w-100">Login</button>
        </form>
        <p class="mt-3 text-center">
          <a href="/register">Create new account</a><br>
          <a href="/">Back to Portal</a>
        </p>
      </div>
    </div>
  `));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND is_admin = 0',
    [username]
  );
  if (rows.length === 0) return res.send('Invalid credentials');
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.send('Invalid credentials');
  req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
  res.redirect('/home');
});

// ---------------------------------------------------------------------
// 🔐 Admin Authentication
// ---------------------------------------------------------------------
app.get('/admin/login', (req, res) => {
  res.send(pageTemplate('Admin Login', `
    <div class="card mx-auto shadow-sm" style="max-width: 400px;">
      <div class="card-body">
        <h2 class="mb-4 text-center">Admin Login</h2>
        <form method="post" action="/admin/login">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input name="username" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          <button class="btn btn-primary w-100">Login as Admin</button>
        </form>
        <p class="mt-3 text-center">
          <a href="/">Back to Portal</a>
        </p>
      </div>
    </div>
  `));
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? AND is_admin = 1',
    [username]
  );
  if (rows.length === 0) return res.send('Invalid admin credentials');
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.send('Invalid admin credentials');
  req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
  res.redirect('/admin');
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// ---------------------------------------------------------------------
// 🏠 User Home Dashboard
// ---------------------------------------------------------------------
app.get('/home', requireLogin, (req, res) => {
  const u = req.session.user;

  if (u.is_admin === 1) {
    return res.redirect('/admin');
  }

  res.send(pageTemplate('User Dashboard', `
    <div class="text-center mb-4">
      <h2 class="fw-bold">Welcome, ${u.username}! 👋</h2>
      <p class="text-muted">Your secure blockchain voting dashboard</p>
    </div>

    <div class="row g-4 justify-content-center">

      <div class="col-md-4">
        <div class="card shadow-sm dashboard-card">
          <div class="card-body text-center">
            <div class="icon-large mb-3">🗳️</div>
            <h5 class="card-title fw-semibold">Active Elections</h5>
            <p class="text-muted small">Vote securely using blockchain</p>
            <a href="/elections" class="btn btn-primary w-100">View Elections</a>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card shadow-sm dashboard-card">
          <div class="card-body text-center">
            <div class="icon-large mb-3">🔗</div>
            <h5 class="card-title fw-semibold">Public Ledger</h5>
            <p class="text-muted small">View blockchain blocks & transactions</p>
            <a href="/ledger" class="btn btn-outline-primary w-100">Open Ledger</a>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card shadow-sm dashboard-card">
          <div class="card-body text-center">
            <div class="icon-large mb-3">🚪</div>
            <h5 class="card-title fw-semibold">Logout</h5>
            <p class="text-muted small">Sign out of your account</p>
            <a href="/logout" class="btn btn-danger w-100">Logout</a>
          </div>
        </div>
      </div>

    </div>
  `));
});

// ---------------------------------------------------------------------
// 🔧 Tampering Simulation: edit hash but reject change
// ---------------------------------------------------------------------
app.get('/block/:index/edit', requireLogin, async (req, res) => {
  const blockIndex = req.params.index;
  const [rows] = await pool.query('SELECT * FROM blockchain WHERE block_index = ?', [blockIndex]);
  if (!rows.length) {
    return res.send(pageTemplate('Block Not Found', `
      <div class="alert alert-danger">Block ${blockIndex} not found.</div>
      <a href="/ledger" class="btn btn-secondary mt-2">Back to Ledger</a>
    `));
  }

  const block = rows[0];

  res.send(pageTemplate('Edit Block Hash (Tampering Test)', `
    <h3 class="mb-3">Edit Block Hash (Tampering Test)</h3>
    <p class="text-danger fw-bold">
      ⚠ This simulates an attacker trying to edit a block hash.<br>
      The blockchain should reject any manual hash change.
    </p>

    <form method="post" action="/block/${block.block_index}/edit">
      <div class="mb-3">
        <label class="form-label fw-bold">Current / Stored Hash</label>
        <input class="form-control" value="${block.hash}" disabled>
      </div>

      <div class="mb-3">
        <label class="form-label fw-bold">Edit Hash Value</label>
        <input type="text" name="hash" class="form-control" value="${block.hash}" required>
      </div>

      <button class="btn btn-danger">Save (Tamper)</button>
      <a href="/ledger" class="btn btn-secondary ms-2">Cancel</a>
    </form>
  `));
});

app.post('/block/:index/edit', requireLogin, async (req, res) => {
  const blockIndex = req.params.index;
  const newHash = (req.body.hash || '').trim();

  const [rows] = await pool.query('SELECT * FROM blockchain WHERE block_index = ?', [blockIndex]);
  if (!rows.length) {
    return res.send(pageTemplate('Block Not Found', `
      <div class="alert alert-danger">Block ${blockIndex} not found.</div>
      <a href="/ledger" class="btn btn-secondary mt-2">Back to Ledger</a>
    `));
  }

  const block = rows[0];
  const storedHash = block.hash;

  if (newHash === storedHash) {
    return res.send(pageTemplate('No Tampering', `
      <div class="alert alert-info">
        You submitted the same hash as already stored.<br>
        Block remains unchanged.
      </div>
      <a href="/ledger" class="btn btn-primary mt-2">Back to Ledger</a>
    `));
  }

  return res.send(pageTemplate('Tampering Rejected', `
    <div class="alert alert-danger">
      ❌ Tampering rejected. You tried to change the hash of block <strong>${blockIndex}</strong>.<br><br>
      <strong>Entered Hash:</strong><br>
      <code>${newHash}</code><br><br>
      <strong>Stored Hash (linked with previous blocks):</strong><br>
      <code>${storedHash}</code><br><br>
      In a blockchain, the hash is derived from the block contents and is referenced by later blocks
      via <code>previous_hash</code>. You cannot arbitrarily change it.
    </div>
    <a href="/ledger" class="btn btn-primary mt-2">Back to Ledger</a>
  `));
});

// ---------------------------------------------------------------------
// 🔗 Public Ledger – diagram blocks + arrows like reference image
// ---------------------------------------------------------------------
app.get('/ledger', requireLogin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM blockchain ORDER BY block_index ASC');

  const segmentsHtml = rows.map((b, idx) => {
    let votePretty;
    try {
      const parsed = typeof b.vote_data === 'string' ? JSON.parse(b.vote_data) : b.vote_data;
      votePretty = JSON.stringify(parsed, null, 2);
    } catch {
      votePretty = String(b.vote_data || '');
    }

    const dateObj = new Date(b.timestamp);
    const humanTs = dateObj.toLocaleString();
    const epoch = Math.floor(dateObj.getTime() / 1000);

    const isLatest = idx === rows.length - 1;
    const isGenesis = b.previous_hash === '0';
    const shortPrev = b.previous_hash ? (b.previous_hash.slice(0, 10) + '…') : '-';

    const blockHtml = `
      <div class="block-card ${isGenesis ? 'genesis-block' : ''} ${isLatest ? 'current-block' : ''}">
        <div class="block-inner">

          <div class="bh-title">
            Block Header
          </div>

          <div class="bh-section">
            <div class="bh-row bh-row-prev">
              <span class="bh-label">
                Hash (Previous Block Header${isGenesis ? ' = 0, Genesis' : ''})
              </span>
              <span class="bh-value" title="${b.previous_hash}">${shortPrev}</span>
            </div>

            <div class="bh-row bh-row-time">
              <span class="bh-label">Timestamp</span>
              <span class="bh-value">
                ${humanTs}<br><strong>Epoch:</strong> ${epoch}
              </span>
            </div>

            <div class="bh-row bh-row-nonce">
              <span class="bh-label">Nonce</span>
              <span class="bh-value">${b.nonce}</span>
            </div>

            <div class="bh-row bh-row-hash">
              <span class="bh-label">Hash of Block Data</span>
              <span class="bh-value" title="${b.hash}">${b.hash}</span>
            </div>

            <div class="mt-1 text-center">
              <a href="/block/${b.block_index}/edit" class="btn btn-sm btn-warning">
                ✏ Edit Hash (Tamper)
              </a>
            </div>
          </div>

          <div class="bd-section">
            <div class="bd-title">Block Data (Transaction / Vote)</div>
            <pre class="bd-body mb-0">${votePretty}</pre>
          </div>

        </div>
        <div class="block-footer-label">
          Block ${b.block_index} ${isLatest ? '(Latest)' : ''}
        </div>
      </div>
    `;

    const arrowHtml = idx < rows.length - 1
      ? `
        <div class="block-arrow-outer">
          <div class="block-arrow-line"></div>
          <div class="block-arrow-head"></div>
        </div>
      `
      : '';

    return `<div class="block-chain-segment">${blockHtml}${arrowHtml}</div>`;
  }).join('');

  res.send(pageTemplate('Public Ledger', `
    <h2 class="mb-4">Public Ledger (Blockchain)</h2>
    <div class="blockchain-wrapper">
      <div class="blockchain-scroll">
        ${segmentsHtml || '<p>No blocks yet.</p>'}
      </div>
    </div>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Admin Panel
// ---------------------------------------------------------------------
app.get('/admin', requireLogin, requireAdmin, (req, res) => {
  res.send(pageTemplate('Admin Panel', `
    <h2 class="mb-4">Admin Panel</h2>
    <div class="list-group mb-3">
      <a href="/admin/active-elections" class="list-group-item list-group-item-action">
        🔔 Active Elections Board
      </a>
      <a href="/admin/create-election" class="list-group-item list-group-item-action">
        ➕ Create Election
      </a>
      <a href="/admin/create-candidate" class="list-group-item list-group-item-action">
        👤 Create Candidate
      </a>
      <a href="/admin/results" class="list-group-item list-group-item-action">
        📊 View Results Tally
      </a>
    </div>
    <a href="/home" class="btn btn-secondary mt-2">Back</a>
  `));
});

// ---------------------------------------------------------------------
// 🟢 Admin: Active Elections Board
// ---------------------------------------------------------------------
app.get('/admin/active-elections', requireLogin, requireAdmin, async (req, res) => {
  const [elections] = await pool.query(
    'SELECT id, name, is_active FROM elections ORDER BY id DESC'
  );

  const resultsModel = await buildElectionResultsModel();
  const tallyMap = {};
  resultsModel.forEach(e => {
    tallyMap[String(e.id)] = e.totalVotes;
  });

  const cardsHtml = elections.map(e => {
    const idStr = String(e.id);
    const totalVotes = tallyMap[idStr] || 0;
    const isActive = e.is_active === 1 || e.is_active === true;

    return `
      <div class="col-md-6">
        <div class="card mb-3 shadow-sm election-summary-card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${e.name}</div>
              <div class="election-meta">ID: ${e.id}</div>
            </div>
            <div class="text-end">
              <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'} results-badge">
                ${isActive ? 'Active' : 'Inactive'}
              </span><br>
              <span class="badge bg-light text-dark results-badge mt-1">
                ${totalVotes} vote(s)
              </span>
            </div>
          </div>
          <div class="card-body">
            <p class="mb-2 text-muted">
              This election is currently ${isActive ? 'open for voting.' : 'closed / inactive.'}
            </p>
            <div class="d-flex flex-wrap gap-2">
              <a href="/admin/results/${e.id}" class="btn btn-outline-primary btn-sm">
                View Results
              </a>
              <a href="/election/${e.id}" class="btn btn-outline-secondary btn-sm">
                Open Voting Page
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  res.send(pageTemplate('Active Elections Board', `
    <div class="results-header">
      <div class="results-header-title">
        <span class="icon">🔔</span>
        <div>
          <h3 class="mb-0">Active Elections Board</h3>
          <div class="election-meta">
            ${elections.length ? elections.length + ' election(s) configured' : 'No elections created yet.'}
          </div>
        </div>
      </div>
      <a href="/admin" class="btn btn-outline-secondary btn-sm">← Back to Admin Panel</a>
    </div>

    ${
      elections.length
        ? `<div class="row">${cardsHtml}</div>`
        : '<div class="alert alert-info mt-3">No elections found. Create one from the Admin Panel.</div>'
    }
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Admin: Results – summary of all elections
// ---------------------------------------------------------------------
app.get('/admin/results', requireLogin, requireAdmin, async (req, res) => {
  const electionsModel = await buildElectionResultsModel();

  if (!electionsModel.length) {
    return res.send(pageTemplate('Results Tally', `
      <div class="results-header">
        <div class="results-header-title">
          <span class="icon">📊</span>
          <div>
            <h3 class="mb-0">Election Results</h3>
            <div class="election-meta">No votes have been recorded yet.</div>
          </div>
        </div>
      </div>
      <a href="/admin" class="btn btn-secondary mt-2">Back</a>
    `));
  }

  const totalAllVotes = electionsModel.reduce((sum, e) => sum + e.totalVotes, 0);

  const cardsHtml = electionsModel.map(e => `
    <div class="col-md-6">
      <div class="card mb-3 shadow-sm election-summary-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">Election: ${e.name}</div>
            <div class="election-meta">ID: ${e.id}</div>
          </div>
          <span class="badge bg-light text-dark results-badge">
            ${e.totalVotes} votes
          </span>
        </div>
        <div class="card-body">
          <p class="mb-2 text-muted">Top candidates:</p>
          <ul class="list-group list-group-flush mb-3">
            ${
              e.candidates.length
                ? e.candidates
                    .slice()
                    .sort((a, b) => b.votes - a.votes)
                    .slice(0, 3)
                    .map(c => `
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${c.name}</span>
                        <span class="badge bg-success rounded-pill">${c.votes}</span>
                      </li>
                    `).join('')
                : '<li class="list-group-item">No candidates with votes yet.</li>'
            }
          </ul>
          <a href="/admin/results/${e.id}" class="btn btn-outline-primary btn-sm">
            View full details
          </a>
        </div>
      </div>
    </div>
  `).join('');

  res.send(pageTemplate('Results Tally', `
    <div class="results-header">
      <div class="results-header-title">
        <span class="icon">📊</span>
        <div>
          <h3 class="mb-0">Election Results Summary</h3>
          <div class="election-meta">
            ${electionsModel.length} election(s) • ${totalAllVotes} total vote(s)
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      ${cardsHtml}
    </div>

    <a href="/admin" class="btn btn-secondary mt-3">Back</a>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Admin: Results – details for one election (candidate counts)
// ---------------------------------------------------------------------
app.get('/admin/results/:electionId', requireLogin, requireAdmin, async (req, res) => {
  const electionId = String(req.params.electionId);
  const electionsModel = await buildElectionResultsModel();
  const election = electionsModel.find(e => String(e.id) === electionId);

  if (!election) {
    return res.send(pageTemplate('Election Results', `
      <div class="alert alert-warning">
        No results found for election id <strong>${electionId}</strong>.
      </div>
      <a href="/admin/results" class="btn btn-secondary mt-2">Back to Results Summary</a>
    `));
  }

  const candidateRows = election.candidates
    .slice()
    .sort((a, b) => b.votes - a.votes)
    .map(c => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <span class="fw-semibold">${c.name}</span>
        </div>
        <span class="badge bg-success rounded-pill">${c.votes} vote(s)</span>
      </li>
    `).join('');

  res.send(pageTemplate('Election Results Detail', `
    <div class="results-header">
      <div class="results-header-title">
        <span class="icon">🗳️</span>
        <div>
          <h3 class="mb-0">Election: ${election.name}</h3>
          <div class="election-meta">
            ID: ${election.id} • ${election.totalVotes} total vote(s)
          </div>
        </div>
      </div>
      <a href="/admin/results" class="btn btn-outline-secondary btn-sm">← Back to all elections</a>
    </div>

    <div class="card mb-3 shadow-sm election-detail-card">
      <div class="card-header">
        Candidate Vote Counts
      </div>
      <ul class="list-group list-group-flush">
        ${candidateRows || '<li class="list-group-item">No candidates with votes yet.</li>'}
      </ul>
    </div>

    <a href="/admin" class="btn btn-secondary mt-2">Back to Admin Panel</a>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Admin: Create Election
// ---------------------------------------------------------------------
app.get('/admin/create-election', requireLogin, requireAdmin, (req, res) => {
  res.send(pageTemplate('Create Election', `
    <h3 class="mb-3">Create Election</h3>
    <form method="post" action="/admin/create-election" class="w-50 mx-auto">
      <div class="mb-3">
        <label class="form-label">Election Name</label>
        <input name="name" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Active?</label>
        <select name="is_active" class="form-select">
          <option value="1" selected>Yes</option>
          <option value="0">No</option>
        </select>
      </div>
      <button class="btn btn-success w-100">Create Election</button>
    </form>
    <a href="/admin" class="btn btn-secondary mt-3">Back</a>
  `));
});

app.post('/admin/create-election', requireLogin, requireAdmin, async (req, res) => {
  const { name, is_active } = req.body;
  await pool.query('INSERT INTO elections (name, is_active) VALUES (?, ?)', [name, is_active ? 1 : 0]);
  res.send(pageTemplate('Election Created', `
    <div class="alert alert-success">Election <strong>${name}</strong> created successfully.</div>
    <a href="/admin" class="btn btn-primary">Back to Admin</a>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Admin: Create Candidate
// ---------------------------------------------------------------------
app.get('/admin/create-candidate', requireLogin, requireAdmin, async (req, res) => {
  const [elections] = await pool.query('SELECT * FROM elections ORDER BY id DESC');
  const options = elections.map(e => `<option value="${e.id}">${e.name} (active=${e.is_active})</option>`).join('');
  res.send(pageTemplate('Create Candidate', `
    <h3 class="mb-3">Create Candidate</h3>
    <form method="post" action="/admin/create-candidate" class="w-50 mx-auto">
      <div class="mb-3">
        <label class="form-label">Candidate Name</label>
        <input name="name" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Election</label>
        <select name="election_id" class="form-select">${options}</select>
      </div>
      <button class="btn btn-success w-100">Create Candidate</button>
    </form>
    <a href="/admin" class="btn btn-secondary mt-3">Back</a>
  `));
});

app.post('/admin/create-candidate', requireLogin, requireAdmin, async (req, res) => {
  const { name, election_id } = req.body;
  await pool.query('INSERT INTO candidates (election_id, name) VALUES (?, ?)', [election_id, name]);
  res.send(pageTemplate('Candidate Created', `
    <div class="alert alert-success">Candidate <strong>${name}</strong> added successfully.</div>
    <a href="/admin" class="btn btn-primary">Back to Admin</a>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Elections (user view)
// ---------------------------------------------------------------------
app.get('/elections', requireLogin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM elections WHERE is_active = 1');
  const electionsHtml = rows.map(e => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      ${e.name}
      <a href="/election/${e.id}" class="btn btn-sm btn-primary">View / Vote</a>
    </li>
  `).join('');

  res.send(pageTemplate('Active Elections', `
    <h3 class="mb-3">Active Elections</h3>
    <ul class="list-group mb-3">
      ${electionsHtml || '<li class="list-group-item">No active elections.</li>'}
    </ul>
    <a href="/home" class="btn btn-secondary">Back</a>
  `));
});

// ---------------------------------------------------------------------
// 🗳️ Voting Routes
// ---------------------------------------------------------------------
app.get('/election/:id', requireLogin, async (req, res) => {
  const electionId = req.params.id;
  const [electionRows] = await pool.query('SELECT * FROM elections WHERE id = ?', [electionId]);
  if (!electionRows.length) {
    return res.send(pageTemplate('Not Found', `<div class="alert alert-danger">Election not found.</div>`));
  }

  const [candidates] = await pool.query('SELECT * FROM candidates WHERE election_id = ?', [electionId]);
  const candidateList = candidates.map(c => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      ${c.name}
      <form method="post" action="/vote" class="m-0">
        <input type="hidden" name="election_id" value="${electionId}">
        <input type="hidden" name="candidate_id" value="${c.id}">
        <button class="btn btn-sm btn-primary">Vote</button>
      </form>
    </li>`).join('');

  res.send(pageTemplate(electionRows[0].name, `
    <h3 class="mb-3">${electionRows[0].name}</h3>
    <ul class="list-group mb-3">${candidateList || '<li class="list-group-item">No candidates yet.</li>'}</ul>
    <a href="/elections" class="btn btn-secondary">Back</a>
  `));
});

app.post('/vote', requireLogin, async (req, res) => {
  const user = req.session.user;
  const { election_id, candidate_id } = req.body;
  if (!election_id || !candidate_id) return res.send('Invalid vote request.');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.query(
      'SELECT 1 FROM user_votes WHERE user_id = ? AND election_id = ?',
      [user.id, election_id]
    );
    if (exists.length) {
      await conn.rollback();
      conn.release();
      return res.send(pageTemplate('Already Voted', `
        <div class="alert alert-danger">You have already voted in this election.</div>
        <a href="/home" class="btn btn-secondary">Back</a>
      `));
    }

    await conn.query(
      'INSERT INTO user_votes (user_id, election_id) VALUES (?, ?)',
      [user.id, election_id]
    );

    const [lastBlock] = await conn.query('SELECT hash FROM blockchain ORDER BY block_index DESC LIMIT 1');
    const previous_hash = lastBlock.length ? lastBlock[0].hash : '0';
    const timestamp = new Date();
    const vote_data = JSON.stringify({ user_id: user.id, election_id, candidate_id });
    let nonce = 0;
    let hash = '';
    while (true) {
      const payload = `${timestamp.toISOString()}|${vote_data}|${previous_hash}|${nonce}`;
      hash = crypto.createHash('sha256').update(payload).digest('hex');
      if (hash.startsWith('00')) break;
      nonce++;
    }
    await conn.query(
      'INSERT INTO blockchain (timestamp, vote_data, previous_hash, hash, nonce) VALUES (?, ?, ?, ?, ?)',
      [timestamp, vote_data, previous_hash, hash, nonce]
    );
    await conn.commit();

    res.send(pageTemplate('Vote Success', `
      <div class="alert alert-success">Your vote has been successfully cast!</div>
      <a href="/home" class="btn btn-primary">Back to Home</a>
    `));
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).send(pageTemplate('Error', `
      <div class="alert alert-danger">Server error while processing vote.</div>
    `));
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
