(() => {
  'use strict';

  const clock = document.getElementById('clock');
  const hours = document.getElementById('hours');
  const minutes = document.getElementById('minutes');
  const seconds = document.getElementById('seconds');
  const dateLabel = document.getElementById('date');
  const timezoneLabel = document.getElementById('time-zone');
  const motionToggle = document.getElementById('motion-toggle');
  const motionLabel = motionToggle.querySelector('.motion-label');
  const newsCard = document.getElementById('news-card');
  const newsTitle = document.getElementById('news-title');
  const newsMeta = document.getElementById('news-meta');

  const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHANGHAI_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const state = {
    paused: prefersReducedMotion.matches,
    news: [],
    newsIndex: 0,
    newsTimer: null
  };

  const NEWS_VISIBLE_MS = 8500;
  const NEWS_GAP_MS = 9000;
  const NEWS_REFRESH_MS = 20 * 60 * 1000;

  function updateClock() {
    const now = new Date();
    const parts = Object.fromEntries(
      timeFormatter.formatToParts(now)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    );
    const hourValue = parts.hour;
    const minuteValue = parts.minute;
    const secondValue = parts.second;

    hours.textContent = hourValue;
    minutes.textContent = minuteValue;
    seconds.textContent = secondValue;
    dateLabel.textContent = dateFormatter.format(now);
    clock.dateTime = `${hourValue}:${minuteValue}:${secondValue}`;
    clock.setAttribute('aria-label', `${hourValue}时${minuteValue}分${secondValue}秒`);
  }

  function describeLocation(payload) {
    const city = cleanText(payload.city);
    const country = cleanText(payload.country || payload.country_name);
    const fields = [city, country].filter((item, index, all) => item && all.indexOf(item) === index);

    if (fields.length === 0) throw new Error('IP location response is incomplete.');
    return fields.join(', ');
  }

  async function requestIpLocation(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`IP location request failed: ${response.status}`);
      const payload = await response.json();
      if (payload.success === false || payload.error) throw new Error('IP location service returned an error.');
      return describeLocation(payload);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadIpLocation() {
    timezoneLabel.textContent = '正在定位地点…';

    const sources = [
      'https://ipwho.is/',
      'https://ipapi.co/json/'
    ];

    for (const source of sources) {
      try {
        timezoneLabel.textContent = await requestIpLocation(source);
        return;
      } catch (error) {
        console.info('An IP location service is temporarily unavailable.', error);
      }
    }

    timezoneLabel.textContent = '当前位置暂不可用';
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeNews(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const seen = new Set();

    return items
      .map((item) => ({
        title: cleanText(item.title),
        source: cleanText(item.source) || 'WORLD NEWS',
        url: item.url
      }))
      .filter((item) => {
        const key = item.title.toLowerCase();
        if (item.title.length < 12 || !item.url || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }

  async function fetchNews() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`data/news.json?v=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`News request failed: ${response.status}`);
      state.news = normalizeNews(await response.json());
    } catch (error) {
      console.info('The same-origin news feed is temporarily unavailable.', error);
    } finally {
      window.clearTimeout(timeout);
    }

    if (state.news.length === 0) {
      state.news = [{
        title: 'BBC World News',
        source: 'BBC NEWS',
        url: 'https://www.bbc.com/news/world'
      }];
    }
  }

  function showNextHeadline() {
    const item = state.news[state.newsIndex % state.news.length];
    state.newsIndex += 1;
    newsTitle.textContent = item.title;
    newsMeta.textContent = `${item.source} · LIVE`;
    newsCard.href = item.url;
    newsCard.classList.add('is-visible');

    window.clearTimeout(state.newsTimer);
    state.newsTimer = window.setTimeout(() => {
      newsCard.classList.remove('is-visible');
      state.newsTimer = window.setTimeout(showNextHeadline, NEWS_GAP_MS);
    }, NEWS_VISIBLE_MS);
  }

  function setPaused(paused) {
    state.paused = paused;
    document.body.classList.toggle('motion-paused', paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionLabel.textContent = paused ? '继续航行' : '暂停航行';
  }

  motionToggle.addEventListener('click', () => setPaused(!state.paused));
  prefersReducedMotion.addEventListener('change', (event) => setPaused(event.matches));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearTimeout(state.newsTimer);
    if (!document.hidden && state.news.length > 0) showNextHeadline();
  });

  updateClock();
  loadIpLocation();
  setPaused(state.paused);
  window.setInterval(updateClock, 1000);

  fetchNews().finally(() => {
    window.setTimeout(showNextHeadline, 800);
  });
  window.setInterval(fetchNews, NEWS_REFRESH_MS);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.info('Offline cache is unavailable.', error);
      });
    });
  }
})();
