import 'dotenv/config';
import musicApp from './api/music.js';

const PORT = process.env.PORT || 3001;

// This file is strictly for local testing since Vercel automatically hosts the files in /api without needing this.
musicApp.listen(PORT, () => {
  console.log(`🎵 Parlaxio Music API (Local Dev Server) running on port ${PORT}`);
});
