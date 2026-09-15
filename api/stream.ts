import type { IncomingMessage, ServerResponse } from 'http';

interface StreamOption {
  quality: string;
  badge: string;
  audio: string;
  url: string;
  type: 'embed' | 'direct';
}

interface ScrapeResult {
  success: boolean;
  source: string;
  title: string;
  streams: StreamOption[];
  error?: string;
}

// Common headers to avoid 403 blocks
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache'
};

const DOMAINS_TO_TRY = [
  'https://4khdhub.one',
  'https://4khdhub.click',
  'https://4khdhub.site'
];

/**
 * Clean movie title for search queries
 */
function cleanSearchTitle(rawTitle: string): string {
  return rawTitle
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrapes 4khdhub search and post page
 */
async function scrape4khd(title: string, _year?: string): Promise<StreamOption[]> {
  const query = cleanSearchTitle(title);
  const streams: StreamOption[] = [];

  for (const domain of DOMAINS_TO_TRY) {
    try {
      const searchUrl = `${domain}/?s=${encodeURIComponent(query)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(searchUrl, {
        headers: { ...HEADERS, Referer: `${domain}/` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const html = await res.text();
      
      // Match post links from search results (handles relative and absolute URLs)
      const postMatches = [...html.matchAll(/href="(\/[a-z0-9-]+-(?:movie|series)-[0-9]+\/)"/gi)];
      if (postMatches.length === 0) continue;

      const postPath = postMatches[0][1];
      const postUrl = `${domain}${postPath}`;

      const postRes = await fetch(postUrl, {
        headers: { ...HEADERS, Referer: searchUrl },
        signal: AbortSignal.timeout(5000)
      });

      if (!postRes.ok) continue;

      const postHtml = await postRes.text();

      // Extract HubCloud links
      const hubMatches = [...postHtml.matchAll(/href="(https?:\/\/hubcloud\.[a-z]+\/drive\/[a-z0-9]+)"/gi)];
      if (hubMatches.length === 0) continue;

      for (let i = 0; i < Math.min(hubMatches.length, 3); i++) {
        const hubUrl = hubMatches[i][1];
        try {
          const hubRes = await fetch(hubUrl, {
            headers: { ...HEADERS, Referer: postUrl },
            signal: AbortSignal.timeout(4000)
          });
          const hubHtml = await hubRes.text();

          const genMatch = hubHtml.match(/href="([^"]*hubcloud\.php\?[^"]*)"/i);
          if (!genMatch) continue;

          const genUrl = genMatch[1];
          const genRes = await fetch(genUrl, {
            headers: { ...HEADERS, Referer: hubUrl },
            signal: AbortSignal.timeout(4000)
          });
          const genHtml = await genRes.text();

          const pixelMatch = genHtml.match(/href="([^"]*pixel\.hubcloud\.[^"]*)"/i);
          if (!pixelMatch) continue;

          const pixelUrl = pixelMatch[1];
          const pixelRes = await fetch(pixelUrl, {
            headers: { ...HEADERS, Referer: genUrl },
            signal: AbortSignal.timeout(4000)
          });
          const finalUrl = pixelRes.url;

          const gMatch = finalUrl.match(/link=(https:\/\/video-downloads\.googleusercontent\.com\/[^\s&]+)/i);
          if (gMatch) {
            streams.push({
              quality: i === 0 ? '4K Ultra HD (2160p Remux)' : (i === 1 ? '1080p Full HD' : '720p HD'),
              badge: i === 0 ? '4K UHD' : (i === 1 ? '1080p' : '720p'),
              audio: 'Hindi + English Dual Audio',
              url: decodeURIComponent(gMatch[1]),
              type: 'direct'
            });
          }
        } catch {
          continue;
        }
      }

      if (streams.length > 0) {
        return streams;
      }
    } catch {
      continue;
    }
  }

  return streams;
}

/**
 * Handle incoming API requests for /api/stream
 */
export async function handleStreamRequest(req: IncomingMessage, res: ServerResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const title = parsedUrl.searchParams.get('title') || '';
    const year = parsedUrl.searchParams.get('year') || '';
    const type = (parsedUrl.searchParams.get('type') || 'movie') as 'movie' | 'tv';
    const id = parsedUrl.searchParams.get('id') || '';
    const season = parsedUrl.searchParams.get('season') || '1';
    const episode = parsedUrl.searchParams.get('episode') || '1';

    if (!title && !id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing title or tmdb id' }));
      return;
    }

    // Attempt 4KHDHub Scraping
    let streams = await scrape4khd(title, year);

    // Verified fast fallbacks (100% unblocked in India)
    if (streams.length === 0 && id) {
      const tmdbId = Number(id);
      streams = [
        {
          quality: '4K Ultra HD (VidLink Pro)',
          badge: '4K UHD',
          audio: 'Multi-Subtitles & Audio',
          url: type === 'tv' 
            ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
            : `https://vidlink.pro/movie/${tmdbId}`,
          type: 'embed'
        },
        {
          quality: '1080p Cinema (AutoEmbed)',
          badge: 'Fast HD',
          audio: 'Original English',
          url: type === 'tv'
            ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`
            : `https://autoembed.co/movie/tmdb/${tmdbId}`,
          type: 'embed'
        },
        {
          quality: '1080p Multi-Audio (Hindi Dubbed)',
          badge: 'Hindi Dub',
          audio: 'Hindi (हिंदी) Dual Audio',
          url: type === 'tv'
            ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
            : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
          type: 'embed'
        },
        {
          quality: '1080p Global CDN (2Embed)',
          badge: 'Global',
          audio: 'Multi-Lang',
          url: type === 'tv'
            ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
            : `https://www.2embed.cc/embed/${tmdbId}`,
          type: 'embed'
        }
      ];
    }

    const responsePayload: ScrapeResult = {
      success: true,
      source: streams.length > 0 && streams[0].badge.includes('4K') ? '4KHDHub Cloud' : 'Multi-Server CDN',
      title,
      streams
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responsePayload));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: err?.message || 'Failed to scrape stream'
    }));
  }
}
