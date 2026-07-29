import { mkdir, writeFile } from 'node:fs/promises';

const feeds = [
  {
    name: '中国大陆 · Google 新闻',
    url: 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans'
  },
  {
    name: '台湾 · Google 新闻',
    url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
  },
  {
    name: '香港 · Google 新闻',
    url: 'https://news.google.com/rss/search?q=%E9%A6%99%E6%B8%AF%20when%3A1d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans'
  },
  {
    name: '澳门 · Google 新闻',
    url: 'https://news.google.com/rss/search?q=%E6%BE%B3%E9%97%A8%20when%3A1d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans'
  }
];

function decodeXml(value = '') {
  const entities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"'
  };

  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name] ?? match)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function field(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeXml(match?.[1]);
}

function parseRss(xml, source) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1];
      const title = field(item, 'title');
      const url = field(item, 'link');
      const publishedAt = field(item, 'pubDate');
      return {
        title,
        url,
        source,
        publishedAt: Number.isNaN(Date.parse(publishedAt)) ? null : new Date(publishedAt).toISOString()
      };
    })
    .filter((item) => item.title && item.url);
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { 'user-agent': 'Xstime-news-updater/1.0' },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`${feed.name}: HTTP ${response.status}`);
  return parseRss(await response.text(), feed.name);
}

const results = await Promise.allSettled(feeds.map(fetchFeed));
const seen = new Set();
const items = results
  .filter((result) => result.status === 'fulfilled')
  .flatMap((result) => result.value.slice(0, 6))
  .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
  .filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .slice(0, 24);

if (items.length === 0) {
  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message)
    .join('; ');
  throw new Error(`No news items were fetched. ${failures}`);
}

await mkdir('data', { recursive: true });
await writeFile('data/news.json', `${JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2)}\n`);
console.log(`Wrote ${items.length} headlines to data/news.json`);
