import 'dotenv/config';
import musicApp from './api/music.js';

const PORT = process.env.PORT || 3001;

// Prevent server from crashing on unhandled errors (e.g. Redis timeouts)
process.on('uncaughtException', (err) => {
  console.warn('[Uncaught Exception Ignored]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Unhandled Rejection Ignored]', reason);
});

// This file is strictly for local testing since Vercel automatically hosts the files in /api without needing this.
musicApp.listen(PORT, () => {
  console.log(`🎵 Parlaxio Music API (Local Dev Server) running on port ${PORT}`);
});
