const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Enable stealth plugin
puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());

// Render provides PORT dynamically
const PORT = process.env.PORT || 3000;

const DOMAINS_TO_TRY = [
  'https://4khdhub.one',
  'https://4khdhub.click',
  'https://4khdhub.site'
];

app.get('/api/scrape', async (req, res) => {
  const { title } = req.query;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const query = String(title).replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  console.log(`Starting scrape for: ${query}`);

  let browser;
  try {
    // These args help it run in Docker/Render environments without crashing
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath()
    });

    const page = await browser.newPage();
    
    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Default to the first domain for search
    const domain = DOMAINS_TO_TRY[0];
    const searchUrl = `${domain}/?s=${encodeURIComponent(query)}`;
    
    console.log(`Navigating to search page: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Step 1: Find the movie post link
    const postLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => a.href).filter(href => href.includes('-movie-') || href.includes('-series-'));
    });

    if (postLinks.length === 0) {
      await browser.close();
      return res.status(404).json({ success: false, message: 'Movie post not found on site.' });
    }

    const postUrl = postLinks[0];
    console.log(`Navigating to post page: ${postUrl}`);
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Step 2: Find greenmotors shortlinks
    const shortLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => a.href).filter(href => href.includes('greenmotors.cc'));
    });

    if (shortLinks.length === 0) {
      await browser.close();
      return res.status(404).json({ success: false, message: 'No download links (greenmotors) found on the post.' });
    }

    console.log(`Found ${shortLinks.length} shortlinks. Navigating to first shortlink...`);
    
    // Step 3: Bypass greenmotors
    // (This requires navigating to the shortlink and waiting for the redirect or clicking the continue button)
    // IMPORTANT: Actual shortlink bypass logic can be complex (waiting for timers, solving captchas, etc.)
    // We will attempt a basic navigation and wait for it to redirect to hubcloud.
    const targetShortlink = shortLinks[0];
    await page.goto(targetShortlink, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for redirect to happen (wait up to 15 seconds)
    try {
        await page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' });
    } catch(e) {
        console.log("No automatic redirect happened, it might need manual clicking logic here.");
        // If there's a button, you would find and click it here:
        // await page.click('.continue-btn');
    }

    const finalUrl = page.url();
    console.log(`Landed on URL: ${finalUrl}`);
    
    let hubcloudUrl = null;
    if (finalUrl.includes('hubcloud') || finalUrl.includes('pixel')) {
        hubcloudUrl = finalUrl;
    }

    if (!hubcloudUrl) {
      await browser.close();
      return res.status(404).json({ success: false, message: 'Failed to bypass shortlink to reach Hubcloud.' });
    }

    // Step 4: Extract direct video from Hubcloud
    // ... Implement the remaining Hubcloud genlink extraction as previously done in stream.ts but using Puppeteer
    
    await browser.close();
    
    // Return a dummy success structure for now so frontend can integrate
    res.json({
      success: true,
      source: 'Puppeteer Bypass',
      title: query,
      streams: [
        {
          quality: '4K Ultra HD (Scraped)',
          badge: '4K',
          audio: 'Direct Source',
          url: hubcloudUrl, // This should be the final mp4/mkv link, returning hubcloud page for now as proof of concept
          type: 'direct'
        }
      ]
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// For Render health checks
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Scraper Server running on port ${PORT}`);
});
