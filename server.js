const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { checkConnection } = require('./config/supabase');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Monitoring
let isDbConnected = false;
let isTableReady = false;
let lastDbMessage = '';

const verifyConnection = async () => {
  const result = await checkConnection();
  isDbConnected = result.connected;
  isTableReady = result.tableReady;
  lastDbMessage = result.message || '';

  if (isTableReady) {
    console.log('✅ Supabase PostgreSQL table "tasks" verified and ready');
  } else if (isDbConnected) {
    console.log('⚡ Supabase project connected. "tasks" table setup pending in Supabase.');
    console.log('💡 Run "supabase-schema.sql" in Supabase SQL Editor: https://supabase.com/dashboard/project/hlhfkgvzvqexwiuijdcz/sql/new\n');
  } else {
    console.warn('⚠️  Supabase Connection Notice:', lastDbMessage);
  }
};

// Check on boot
verifyConnection();

// Periodic connection check every 15 seconds
const healthInterval = setInterval(async () => {
  await verifyConnection();
}, 15000);
healthInterval.unref();

// API Routes
app.use('/api/tasks', require('./routes/taskRoutes'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const check = await checkConnection();
  isDbConnected = check.connected;
  isTableReady = check.tableReady;
  lastDbMessage = check.message || '';

  res.status(200).json({
    status: 'ok',
    database: isTableReady ? 'connected' : (isDbConnected ? 'table_pending' : 'disconnected'),
    isTableReady,
    provider: 'supabase-postgresql',
    projectRef: 'hlhfkgvzvqexwiuijdcz',
    sqlEditorUrl: 'https://supabase.com/dashboard/project/hlhfkgvzvqexwiuijdcz/sql/new',
    message: isTableReady
      ? 'Supabase PostgreSQL connected successfully'
      : (isDbConnected
          ? 'Connected to Supabase project. Table "tasks" not created yet. Please execute supabase-schema.sql in Supabase SQL Editor.'
          : (lastDbMessage || 'Database offline')),
    timestamp: new Date().toISOString()
  });
});

// Endpoint to view/fetch SQL schema directly
app.get('/api/schema', (req, res) => {
  try {
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).json({ error: 'Schema file not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to serve index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server when executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Task Manager Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Frontend UI accessible at: http://localhost:${PORT}`);
    console.log(`📡 API Endpoints live at: http://localhost:${PORT}/api/tasks`);
    console.log(`🗄️  Database Provider: Supabase PostgreSQL`);
    console.log(`===============================================`);
  });
}

module.exports = app;
