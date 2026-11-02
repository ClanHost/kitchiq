import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory / Mock server cache for multi-household sync hub
const inMemoryStore = {
  households: new Map<string, any>([
    [
      'hh-melbourne-main',
      {
        id: 'hh-melbourne-main',
        name: 'The Main Residence',
        inviteCode: 'KITCH-892F',
        planType: 'hosted_standard',
        createdByUserId: 'usr-admin-1',
        createdAt: new Date().toISOString()
      }
    ]
  ]),
  syncLogs: [] as any[]
};

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Kitchiq',
    domain: 'kitchiq.clanhost.com.au',
    mode: process.env.KITCHIQ_MODE || 'hosted',
    database: process.env.DATABASE_TYPE || 'clanhost_kitchiq_mysql',
    timestamp: new Date().toISOString()
  });
});

// System version endpoint for remote automated updates
app.get('/api/system/version', (req, res) => {
  res.json({
    currentVersion: '1.2.0',
    minClientVersion: '1.0.0',
    releaseChannel: 'production',
    changelogUrl: 'https://kitchiq.clanhost.com.au/changelog',
    updateAvailable: false
  });
});

// Two-way synchronization push endpoint
app.post('/api/sync/push', (req, res) => {
  const { mutations, clientTimestamp } = req.body;
  if (!Array.isArray(mutations)) {
    return res.status(400).json({ error: 'Expected array of mutations' });
  }

  const processedIds: string[] = [];
  const serverTimestamp = new Date().toISOString();

  for (const m of mutations) {
    inMemoryStore.syncLogs.push({
      ...m,
      serverReceivedAt: serverTimestamp
    });
    processedIds.push(m.id);
  }

  res.json({
    success: true,
    processedCount: processedIds.length,
    processedIds,
    serverTimestamp
  });
});

// Two-way synchronization pull endpoint
app.get('/api/sync/pull', (req, res) => {
  const { householdId, since } = req.query;
  res.json({
    householdId,
    since: since || null,
    serverTimestamp: new Date().toISOString(),
    changes: []
  });
});

// Open Food Facts proxy with caching to bypass browser CORS and provide caching
app.get('/api/barcodes/lookup/:barcode', async (req, res) => {
  const barcode = req.params.barcode.trim();
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': 'Kitchiq-Household-Server/1.0 (kitchiq.clanhost.com.au)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'External product lookup failed' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Lookup service offline', message: err.message });
  }
});

// Serve frontend dist assets if production build exists
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Kitchiq API Server Running');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kitchiq server listening on http://0.0.0.0:${PORT}`);
});

export default app;
